export interface WeatherData {
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  rain: number;
  windSpeed: number;
  description: string;
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  // Using Open-Meteo API (free, no API key required)
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,rain,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  
  return {
    temperature: data.current.temperature_2m,
    minTemperature: data.daily.temperature_2m_min[0],
    maxTemperature: data.daily.temperature_2m_max[0],
    rain: data.current.rain,
    windSpeed: data.current.wind_speed_10m,
    description: data.current.rain > 0 ? 'Rainy' : 'Clear',
  };
}
