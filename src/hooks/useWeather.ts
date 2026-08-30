import { useEffect, useState } from 'react';
import { config } from '../config';

interface WeatherState {
  weatherInfo: string | null;
  weatherError: string | null;
}

const CACHE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Récupère la météo locale (via géolocalisation + OpenWeather) au montage,
 * avec un cache localStorage (position et météo) pour éviter de redemander
 * la géolocalisation à chaque rechargement.
 */
export function useWeather(): WeatherState {
  const [weatherInfo, setWeatherInfo] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      const API_KEY = config.openWeatherApiKey;
      if (!API_KEY) {
        setWeatherError("Service météo non configuré.");
        return;
      }
      const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;

      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Impossible de récupérer la météo.");
        const data = await response.json();
        const weatherString = `${Math.round(data.main.temp)}°C, ${data.weather[0].description}, à ${data.name}`;
        setWeatherInfo(weatherString);
        setWeatherError(null);

        // Mettre en cache la météo
        localStorage.setItem('cachedWeather', JSON.stringify({
          weather: weatherString,
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
        const { weather, timestamp } = JSON.parse(cachedWeather);
        if (Date.now() - timestamp < CACHE_WINDOW_MS) {
          // Utiliser la météo en cache
          setWeatherInfo(weather);
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

  return { weatherInfo, weatherError };
}
