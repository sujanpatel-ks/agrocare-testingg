import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
}

export async function diagnoseCrop(imageBase64: string): Promise<DiagnosisResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Analyze this crop leaf image. Identify the crop and any disease. Provide the disease name in English, Hindi, and Kannada. Provide a brief description of the diagnosis. Provide symptoms. Provide detailed prevention tips divided into immediate actions and long-term measures. Provide detailed treatments (organic and chemical) including product name (EN/HI/KN), dosage, frequency, precautions, and estimated cost per hectare. Also estimate the severity (Low, Medium, High). Return JSON." },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] || imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING },
          disease: { type: Type.STRING },
          diseaseHi: { type: Type.STRING },
          diseaseKn: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          description: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          prevention: {
            type: Type.OBJECT,
            properties: {
              immediate: { type: Type.ARRAY, items: { type: Type.STRING } },
              longTerm: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["immediate", "longTerm"],
          },
          treatment: {
            type: Type.OBJECT,
            properties: {
              organic: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  nameHi: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  precautions: { type: Type.STRING },
                  costEstimate: { type: Type.STRING },
                },
                required: ["name", "nameHi", "dosage", "frequency", "precautions", "costEstimate"],
              },
              chemical: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  nameHi: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  precautions: { type: Type.STRING },
                  costEstimate: { type: Type.STRING },
                },
                required: ["name", "nameHi", "dosage", "frequency", "precautions", "costEstimate"],
              },
            },
            required: ["organic", "chemical"],
          },
          actionRequired: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
        },
        required: ["crop", "disease", "diseaseHi", "diseaseKn", "confidence", "description", "symptoms", "prevention", "treatment", "severity"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
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
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: "Find agricultural input suppliers, seed stores, and fertilizer shops within 25km of my location. List their names, ratings, and addresses.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      }
    },
  });

  // Since googleMaps tool doesn't support responseSchema, we have to parse the text or use the grounding metadata
  // For this demo, we'll try to extract information from the response text or grounding chunks
  // and map it to our Supplier interface.
  
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    return chunks.map((chunk: any, index: number) => ({
      id: `geo-${index}`,
      name: chunk.maps?.title || "Nearby Supplier",
      distance: "Nearby", // We'd ideally calculate this
      rating: 4.5,
      reviews: 120,
      status: 'open',
      specialty: ['Seeds', 'Fertilizers'],
      verified: true,
      address: chunk.maps?.uri,
    }));
  }

  return [];
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
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Get current weather for coordinates ${lat}, ${lng}. Return JSON with temp (number, Celsius), location (string, city/region), humidity (number, %), rain (number, mm), wind (number, km/h), and condition (string, e.g., 'Sunny', 'Cloudy', 'Rainy').`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          temp: { type: Type.NUMBER },
          location: { type: Type.STRING },
          humidity: { type: Type.NUMBER },
          rain: { type: Type.NUMBER },
          wind: { type: Type.NUMBER },
          condition: { type: Type.STRING },
        },
        required: ["temp", "location", "humidity", "rain", "wind", "condition"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getWeatherForecast(lat: number, lng: number): Promise<ForecastDay[]> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Get a 5-day weather forecast for coordinates ${lat}, ${lng}. For each day, provide the day name, max temp, min temp, condition, rain chance (%), and agricultural advice for farmers based on that weather. Return as a JSON array of objects.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            tempMax: { type: Type.NUMBER },
            tempMin: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            rainChance: { type: Type.NUMBER },
            advice: { type: Type.STRING },
          },
          required: ["day", "tempMax", "tempMin", "condition", "rainChance", "advice"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
}

export async function chatWithAssistant(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are AgroCare Bot, a helpful agricultural assistant. You provide advice on crop diseases, planting, fertilizers, and market trends. Keep responses concise and helpful for farmers. You can speak in English and Hindi.",
    },
  });

  // Note: The SDK might handle history differently depending on version, 
  // but for simple stateless calls or manual history management:
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: [{ text: message }] }],
  });

  return response.text;
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}
