import { useEffect, useState } from 'react';
import { config } from '../config';

interface WeatherState {
  weatherInfo: string | null;
  weatherError: string | null;
  weatherMaxToday: number | null;
}

interface ForecastListItem {
  dt: number;
  main: { temp: number };
}

const CACHE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Calcule la température max prévue restant à courir sur la journée en
 * cours à partir des prévisions 3h de l'endpoint /forecast (même clé,
 * même tier gratuit que /weather — aucun coût supplémentaire). Retourne
 * null si aucune donnée n'est dispo pour aujourd'hui (ex: en toute fin de
 * journée, quand toutes les prévisions 3h restantes sont pour demain).
 */
function computeMaxTemperatureToday(list: ForecastListItem[]): number | null {
  const now = new Date();
  const todayItems = list.filter(item => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.getFullYear() === now.getFullYear()
      && itemDate.getMonth() === now.getMonth()
      && itemDate.getDate() === now.getDate();
  });
  if (todayItems.length === 0) return null;
  return Math.round(Math.max(...todayItems.map(item => item.main.temp)));
}

/**
 * Récupère la météo locale (via géolocalisation + OpenWeather) au montage,
 * avec un cache localStorage (position et météo) pour éviter de redemander
 * la géolocalisation à chaque rechargement. Récupère aussi la température
 * max prévue pour le reste de la journée, pour que les tenues suggérées le
 * matin restent adaptées à l'après-midi (voir sharedStyleRules.ts).
 */
export function useWeather(): WeatherState {
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherMaxToday, setWeatherMaxToday] = useState<number | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      const API_KEY = config.openWeatherApiKey;
      if (!API_KEY) {
        setWeatherError("Service météo non configuré.");
        return;
      }
      const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;
      const FORECAST_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;

      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Impossible de récupérer la météo.");
        const data = await response.json();
        const currentTemp = Math.round(data.main.temp);
        const weatherString = `${currentTemp}°C, ${data.weather[0].description}, à ${data.name}`;
        setWeatherInfo(weatherString);
        setWeatherError(null);

        // La prévision est purement indicative (voir docstring) : un échec
        // ici ne doit jamais faire échouer la météo actuelle, déjà utile.
        let maxToday: number | null = null;
        try {
          const forecastResponse = await fetch(FORECAST_URL);
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            const forecastMax = computeMaxTemperatureToday(forecastData.list || []);
            maxToday = forecastMax !== null ? Math.max(forecastMax, currentTemp) : null;
          }
        } catch {
          // Prévision indisponible, on garde la météo actuelle seule.
        }
        setWeatherMaxToday(maxToday);

        // Mettre en cache la météo (actuelle + max du jour)
        localStorage.setItem('cachedWeather', JSON.stringify({
          weather: weatherString,
          maxToday,
          timestamp: Date.now()
        }));
      } catch {
        setWeatherError("Météo indisponible.");
      }
    };

    // Vérifier d'abord si on a une météo en cache (< 30 minutes)
    const cachedWeather = localStorage.getItem('cachedWeather');
    if (cachedWeather) {
      try {
        const { weather, maxToday, timestamp } = JSON.parse(cachedWeather);
        if (Date.now() - timestamp < CACHE_WINDOW_MS) {
          // Utiliser la météo en cache
          setWeatherInfo(weather);
          setWeatherMaxToday(typeof maxToday === 'number' ? maxToday : null);
          setWeatherError(null);
          return;
        }
      } catch {
        // Cache invalide, continuer avec la géolocalisation
      }
    }

    // Vérifier si on a une position en cache (< 30 minutes)
    const cachedPosition = localStorage.getItem('cachedPosition');
    if (cachedPosition) {
      try {
        const { lat, lon, timestamp } = JSON.parse(cachedPosition);
        if (Date.now() - timestamp < CACHE_WINDOW_MS) {
          // Utiliser la position en cache
          fetchWeather(lat, lon);
          return;
        }
      } catch {
        // Cache invalide, continuer avec la géolocalisation
      }
    }

    // Pas de cache valide, demander la géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Mettre en cache la position
          localStorage.setItem('cachedPosition', JSON.stringify({
            lat,
            lon,
            timestamp: Date.now()
          }));

          fetchWeather(lat, lon);
        },
        () => setWeatherError("Activez la géolocalisation pour la météo.")
      );
    } else {
      setWeatherError("Géolocalisation non supportée.");
    }
  }, []);

  return { weatherInfo, weatherError, weatherMaxToday };
}
