import { parseTemperatureCelsius } from './outfitConstraints';

// En dessous de cet écart, on n'encombre pas le prompt avec la prévision —
// une différence de 1-2°C ne change rien au choix de la tenue.
const MIN_NOTABLE_RISE_C = 3;

// Heure de la journée considérée comme "typique" pour s'habiller le matin :
// sert à choisir, parmi les prévisions 3h de demain, celle qui représente
// le mieux le moment où la tenue sera réellement portée.
const TARGET_MORNING_HOUR = 8;

// Après cette heure locale, on suppose par défaut que l'utilisateur prépare
// sa tenue pour le LENDEMAIN (cas d'usage : préparer ses vêtements le soir)
// plutôt que pour la fin de la journée en cours. Reste un défaut : le
// sélecteur Aujourd'hui/Demain dans l'UI permet toujours de corriger.
const EVENING_THRESHOLD_HOUR = 19;

export type WeatherDay = 'today' | 'tomorrow';

export interface ForecastListItem {
  dt: number;
  main: { temp: number };
  weather?: { description: string }[];
}

export interface TomorrowForecast {
  morningTemp: number;
  maxTemp: number;
  morningDescription: string;
}

function isSameLocalDay(date: Date, reference: Date): boolean {
  return date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
}

/** Aujourd'hui par défaut, sauf en soirée où on bascule sur demain. */
export function getDefaultWeatherDay(now: Date = new Date()): WeatherDay {
  return now.getHours() >= EVENING_THRESHOLD_HOUR ? 'tomorrow' : 'today';
}

/** Libellé affiché devant la météo, dans le prompt ET dans l'UI (une seule source de vérité). */
export function getWeatherDayLabel(weatherDay: WeatherDay): string {
  return weatherDay === 'tomorrow' ? 'Demain matin' : 'Météo actuelle';
}

/**
 * Température max prévue restant à courir sur la journée EN COURS, à
 * partir des prévisions 3h de l'endpoint /forecast (même clé, même tier
 * gratuit que /weather — aucun coût supplémentaire). Retourne null si
 * aucune donnée n'est dispo pour aujourd'hui (ex: en toute fin de journée,
 * quand toutes les prévisions 3h restantes sont pour demain).
 */
export function computeMaxTemperatureToday(list: ForecastListItem[], now: Date = new Date()): number | null {
  const todayItems = list.filter(item => isSameLocalDay(new Date(item.dt * 1000), now));
  if (todayItems.length === 0) return null;
  return Math.round(Math.max(...todayItems.map(item => item.main.temp)));
}

/**
 * Résumé météo pour DEMAIN à partir des mêmes prévisions 3h que
 * computeMaxTemperatureToday (déjà récupérées, aucun appel réseau
 * supplémentaire) : la température la plus proche de l'heure typique pour
 * s'habiller le matin, et le max prévu sur la journée de demain (même rôle
 * que weatherMaxToday, pour le jour suivant). Retourne null si aucune
 * prévision n'est dispo pour demain (ne devrait arriver qu'en tout début
 * de fenêtre, l'API OpenWeather couvrant 5 jours).
 */
export function computeTomorrowForecast(list: ForecastListItem[], now: Date = new Date()): TomorrowForecast | null {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowItems = list.filter(item => isSameLocalDay(new Date(item.dt * 1000), tomorrow));
  if (tomorrowItems.length === 0) return null;

  const morningItem = tomorrowItems.reduce((closest, item) => {
    const itemHour = new Date(item.dt * 1000).getHours();
    const closestHour = new Date(closest.dt * 1000).getHours();
    return Math.abs(itemHour - TARGET_MORNING_HOUR) < Math.abs(closestHour - TARGET_MORNING_HOUR) ? item : closest;
  });

  return {
    morningTemp: Math.round(morningItem.main.temp),
    maxTemp: Math.round(Math.max(...tomorrowItems.map(item => item.main.temp))),
    morningDescription: morningItem.weather?.[0]?.description ?? '',
  };
}

/**
 * Construit la ligne météo à afficher/injecter dans le prompt — SANS le
 * label ("Météo actuelle" / "Demain matin"), ajouté séparément par
 * l'appelant via getWeatherDayLabel, pour que le prompt et l'UI utilisent
 * exactement la même valeur.
 *
 * En mode "aujourd'hui" : température actuelle, enrichie du max du jour
 * quand l'écart est notable (voir sharedStyleRules.ts, layering).
 * En mode "demain" : température prévue le matin, enrichie du max prévu
 * dans la journée de demain selon la même logique.
 */
export function buildWeatherContext(
  weatherDay: WeatherDay,
  weatherInfo: string | null | undefined,
  weatherMaxToday: number | null | undefined,
  tomorrowForecast: TomorrowForecast | null | undefined
): string | null {
  if (weatherDay === 'tomorrow') {
    if (!tomorrowForecast) return null;
    const { morningTemp, maxTemp, morningDescription } = tomorrowForecast;
    const base = morningDescription ? `${morningTemp}°C, ${morningDescription}` : `${morningTemp}°C`;
    return maxTemp - morningTemp >= MIN_NOTABLE_RISE_C
      ? `${base} (jusqu'à ${maxTemp}°C dans la journée)`
      : base;
  }

  if (!weatherInfo) return null;
  const currentTemp = parseTemperatureCelsius(weatherInfo);
  if (
    currentTemp === null ||
    weatherMaxToday === null ||
    weatherMaxToday === undefined ||
    weatherMaxToday - currentTemp < MIN_NOTABLE_RISE_C
  ) {
    return weatherInfo;
  }
  return `${weatherInfo} (jusqu'à ${weatherMaxToday}°C prévus aujourd'hui)`;
}

/**
 * Température de référence à transmettre à filterOutfitsByHardConstraints
 * (via parseTemperatureCelsius, qui attend un format "18°C, ..."). En mode
 * "aujourd'hui" c'est la météo actuelle ; en mode "demain" c'est la
 * prévision du matin — l'heure à laquelle la tenue sera réellement portée,
 * pas la température au moment où l'utilisateur consulte l'app le soir.
 */
export function buildReferenceWeatherInfo(
  weatherDay: WeatherDay,
  weatherInfo: string | null | undefined,
  tomorrowForecast: TomorrowForecast | null | undefined
): string | null {
  if (weatherDay === 'tomorrow') {
    return tomorrowForecast ? `${tomorrowForecast.morningTemp}°C` : null;
  }
  return weatherInfo ?? null;
}
