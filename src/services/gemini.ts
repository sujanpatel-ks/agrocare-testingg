export interface TreatmentDetails {
  name: string;
  nameHi: string;
  dosage: string;
  frequency: string;
  precautions: string;
  costEstimate: string;
}

export interface DiagnosisResult {
  crop: string;
  disease: string;
  diseaseHi: string;
  diseaseKn: string;
  confidence: number;
  description: string;
  symptoms: string[];
  prevention: {
    immediate: string[];
    longTerm: string[];
  };
  treatment: {
    organic: TreatmentDetails;
    chemical: TreatmentDetails;
  };
  actionRequired?: string;
  severity: 'Low' | 'Medium' | 'High';
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export async function diagnoseCrop(imageBase64: string): Promise<DiagnosisResult> {
  const response = await fetch("/api/gemini/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!response.ok) {
    throw new Error(`Failed to diagnose crop: ${response.statusText}`);
  }
  return response.json();
}

export interface Supplier {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  status: 'open' | 'closed' | 'closing';
  specialty: string[];
  verified: boolean;
  lat?: number;
  lng?: number;
  address?: string;
}

export async function findNearbySuppliers(lat: number, lng: number): Promise<Supplier[]> {
  const response = await fetch("/api/gemini/nearby-suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });
  if (!response.ok) {
    throw new Error(`Failed to find suppliers: ${response.statusText}`);
  }
  return response.json();
}

export interface WeatherData {
  temp: number;
  location: string;
  humidity: number;
  rain: number;
  wind: number;
  condition: string;
}

export interface ForecastDay {
  day: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainChance: number;
  advice: string;
}

export async function getRealTimeWeather(lat: number, lng: number): Promise<WeatherData> {
  // Fetch highly accurate location name using a free reverse geocoding API
  let exactLocation = "";
  try {
    const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      exactLocation = geoData.locality || geoData.city || geoData.principalSubdivision || "";
    }
  } catch (error) {
    console.error("Reverse geocoding failed on client:", error);
  }

  const response = await fetch("/api/gemini/realtime-weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng, exactLocation }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get weather: ${response.statusText}`);
  }
  return response.json();
}

export async function getWeatherForecast(lat: number, lng: number): Promise<ForecastDay[]> {
  const response = await fetch("/api/gemini/weather-forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng }),
  });
  if (!response.ok) {
    throw new Error(`Failed to get weather forecast: ${response.statusText}`);
  }
  return response.json();
}

export async function chatWithAssistant(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[], language: string = 'en', sessionId?: string): Promise<string> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, language, sessionId }),
  });
  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.text || "";
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  const response = await fetch("/api/gemini/generate-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Speech generation failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.audio;
}

export async function transcribeAudio(audioBase64: string, mimeType: string, language: string): Promise<string> {
  const response = await fetch("/api/gemini/transcribe-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, language }),
  });
  if (!response.ok) {
    throw new Error(`Audio transcription failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.text || "";
}

export interface SoilData {
  n: number;
  p: number;
  k: number;
  ph: number;
  type: string;
  moisture: number;
}

export interface CropFertilizerRecommendation {
  crop: string;
  type: string;
  quantityPerAcre: string;
  frequency: string;
  applicationMethod: string;
}

export interface SoilAnalysisResult {
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  phAnalysis: string;
  npkAnalysis: string;
  recommendations: string[];
  suitableCrops: string[];
  fertilizerAdvice: string;
  cropFertilizerRecommendations: CropFertilizerRecommendation[];
}

export async function analyzeSoil(data: SoilData): Promise<SoilAnalysisResult> {
  const response = await fetch("/api/gemini/analyze-soil", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!response.ok) {
    throw new Error(`Soil analysis failed: ${response.statusText}`);
  }
  return response.json();
}
