export const config = {
  // geminiApiKey géré côté serveur via Cloud Functions (sécurisé)
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || '',
  huggingFaceApiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
};
