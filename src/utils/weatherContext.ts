import { parseTemperatureCelsius } from './outfitConstraints';

// En dessous de cet écart, on n'encombre pas le prompt avec la prévision —
// une différence de 1-2°C ne change rien au choix de la tenue.
const MIN_NOTABLE_RISE_C = 3;

/**
 * Enrichit la chaîne météo (température actuelle) avec la température max
 * prévue pour le reste de la journée, quand elle est notablement plus
 * élevée — pour que l'IA sache qu'une tenue pensée pour un matin frais
 * doit rester modulable pour un après-midi plus chaud (voir
 * sharedStyleRules.ts, section "Écart de température dans la journée").
 *
 * Les contraintes dures (ex: short si < 22°C) restent volontairement
 * basées sur la température ACTUELLE — voir outfitConstraints.ts — donc
 * cette fonction ne touche qu'au contexte informatif envoyé au prompt.
 */
export function buildWeatherContext(
  weatherInfo: string | null | undefined,
  weatherMaxToday: number | null | undefined
): string | null {
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
