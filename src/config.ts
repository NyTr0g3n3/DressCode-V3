export const config = {
  // NOTE: La clé Gemini est maintenant gérée côté serveur via Firebase Cloud Functions
  // Elle n'est plus exposée au client pour des raisons de sécurité
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  huggingFaceApiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
};
