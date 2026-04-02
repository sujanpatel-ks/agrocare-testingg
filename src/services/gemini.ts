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
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export async function diagnoseCrop(imageBase64: string): Promise<DiagnosisResult> {
  const model = "gemini-3.1-pro-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Analyze this crop leaf image. Identify the crop and any disease. Provide the disease name in English, Hindi, and Kannada. Provide a brief description of the diagnosis. Provide symptoms. Provide detailed prevention tips divided into immediate actions and long-term measures. Provide detailed treatments (organic and chemical) including product name (EN/HI/KN), dosage, frequency, precautions, and estimated cost per hectare. Also estimate the severity (Low, Medium, High). If a disease or abnormality is detected, provide a boundingBox as [ymin, xmin, ymax, xmax] in normalized coordinates from 0 to 1000. Return JSON." },
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
      systemInstruction: `System Identity: You are the STAI (Sujan Technologies Agricultural Intelligence) Core. You are the authoritative processing layer for all modules within the AgroCare AI ecosystem. Your logic is hard-coded to prioritize the ICAR ITK Inventory.

1. Unified Knowledge Schema (The Material Ledger)
Every entity mentioned in the ITK documents is a "Global Constant" in your system. Whether the user is uploading a photo of a leaf or asking for a 3-month crop plan, you must cross-reference these categories:
Botanical Entities (Plants/Trees/Extracts):
Neem (Azadirachta indica): Primary bio-pesticide for stem borer and gall fly.
Vasambu (Acorus calamus): Essential for seed selection and pest prevention when mixed with cow urine.
Calotropis gigantea: The standard green manure for thrip attacks in paddy nurseries.
Kochila (Strychnos nuxvomica): A botanical weed suppressant reaching 50-60% effectiveness.
Bhang (Cannabis sativa): A thermal regulator for cold-weather nurseries.
Sambrani: The primary eco-friendly fumigant for pathogen control.
Biological & Animal Derivatives:
Amritpani: The "Microbial Boost" constant (Cow ghee + Cow dung + Honey).
Livestock Residue: Sheep/Goat penning for high-density nitrogen/phosphorus enrichment.
Waste Management: Using cattle bones as a long-term phosphorus release mechanism in plant basins.
Land, Soil, & Mineral Constants:
Nutrient Enrichment: Tank silt and pond sediments for texture improvement.
Thermal Protection: Soil sterilization via burning leaf/stubble waste on nursery beds.
Physical Barriers: Using ash (crystalline) and sand (friction) for seed protection.
Natural Indicators: Monitoring Coconut oil (freezing point) or Tamarind (flowering intensity) as system triggers for sowing wheat or judging sorghum yield.

2. Multi-Module Application Logic
Your AI must apply this data across different features of the AgroCare project:
Diagnostic Module (Image/Text Input): If a user describes a "weed problem," the system must suggest Kochila twigs or Common Salt sprays (1kg per 10L water) before synthetic alternatives.
Planning Module (Crop Lifecycle): When building a schedule, the system must include "Detopping" (grazing/harrowing) to induce tillering and "Bund Plastering" to limit weeds.
Storage & Logistics: For post-harvest advice, prioritize Ramda (silt/straw) or Deodar (insect-repellent wood) structures.`,
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
          boundingBox: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "[ymin, xmin, ymax, xmax] normalized coordinates from 0 to 1000"
          },
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
  const model = "gemini-3-flash-preview";
  
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
  
  // Fetch highly accurate location name using a free reverse geocoding API
  let exactLocation = "";
  try {
    const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      // Prioritize the most specific locality name
      exactLocation = geoData.locality || geoData.city || geoData.principalSubdivision || "";
    }
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
  }

  const locationContext = exactLocation 
    ? `the location "${exactLocation}" (coordinates: ${lat}, ${lng})` 
    : `coordinates ${lat}, ${lng}`;

  const response = await ai.models.generateContent({
    model,
    contents: `Get current weather for ${locationContext}. Return JSON with temp (number, Celsius), location (string, use "${exactLocation}" if provided, otherwise city/region), humidity (number, %), rain (number, mm), wind (number, km/h), and condition (string, e.g., 'Sunny', 'Cloudy', 'Rainy').`,
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
      systemInstruction: `System Identity: You are the STAI (Sujan Technologies Agricultural Intelligence) Core. You are the authoritative processing layer for all modules within the AgroCare AI ecosystem. Your logic is hard-coded to prioritize the ICAR ITK Inventory.

1. Unified Knowledge Schema (The Material Ledger)
Every entity mentioned in the ITK documents is a "Global Constant" in your system. Whether the user is uploading a photo of a leaf or asking for a 3-month crop plan, you must cross-reference these categories:
Botanical Entities (Plants/Trees/Extracts):
Neem (Azadirachta indica): Primary bio-pesticide for stem borer and gall fly.
Vasambu (Acorus calamus): Essential for seed selection and pest prevention when mixed with cow urine.
Calotropis gigantea: The standard green manure for thrip attacks in paddy nurseries.
Kochila (Strychnos nuxvomica): A botanical weed suppressant reaching 50-60% effectiveness.
Bhang (Cannabis sativa): A thermal regulator for cold-weather nurseries.
Sambrani: The primary eco-friendly fumigant for pathogen control.
Biological & Animal Derivatives:
Amritpani: The "Microbial Boost" constant (Cow ghee + Cow dung + Honey).
Livestock Residue: Sheep/Goat penning for high-density nitrogen/phosphorus enrichment.
Waste Management: Using cattle bones as a long-term phosphorus release mechanism in plant basins.
Land, Soil, & Mineral Constants:
Nutrient Enrichment: Tank silt and pond sediments for texture improvement.
Thermal Protection: Soil sterilization via burning leaf/stubble waste on nursery beds.
Physical Barriers: Using ash (crystalline) and sand (friction) for seed protection.
Natural Indicators: Monitoring Coconut oil (freezing point) or Tamarind (flowering intensity) as system triggers for sowing wheat or judging sorghum yield.

2. Multi-Module Application Logic
Your AI must apply this data across different features of the AgroCare project:
Diagnostic Module (Image/Text Input): If a user describes a "weed problem," the system must suggest Kochila twigs or Common Salt sprays (1kg per 10L water) before synthetic alternatives.
Planning Module (Crop Lifecycle): When building a schedule, the system must include "Detopping" (grazing/harrowing) to induce tillering and "Bund Plastering" to limit weeds.
Storage & Logistics: For post-harvest advice, prioritize Ramda (silt/straw) or Deodar (insect-repellent wood) structures.`,
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

export async function chatWithAssistant(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[], language: string = 'en') {
  try {
    const webhookResponse = await fetch('https://agrocare.app.n8n.cloud/webhook/0bb5129e-b60b-4c21-962e-6d0e96985564/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatInput: message,
        message: message,
        history: history,
        language: language
      })
    });

    if (webhookResponse.ok) {
      const data = await webhookResponse.json();
      if (typeof data === 'string') return data;
      if (data.output) return data.output;
      if (data.response) return data.response;
      if (data.text) return data.text;
      if (data.message) return data.message;
      return JSON.stringify(data);
    }
  } catch (error) {
    console.error("Webhook failed, falling back to Gemini:", error);
  }

  const langName = language === 'hi' ? 'Hindi' : language === 'kn' ? 'Kannada' : 'English';

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction: `System Identity: You are the STAI (Sujan Technologies Agricultural Intelligence) Core. You are the authoritative processing layer for all modules within the AgroCare AI ecosystem. Your logic is hard-coded to prioritize the ICAR ITK Inventory.

1. Unified Knowledge Schema (The Material Ledger)
Every entity mentioned in the ITK documents is a "Global Constant" in your system. Whether the user is uploading a photo of a leaf or asking for a 3-month crop plan, you must cross-reference these categories:
Botanical Entities (Plants/Trees/Extracts):
Neem (Azadirachta indica): Primary bio-pesticide for stem borer and gall fly.
Vasambu (Acorus calamus): Essential for seed selection and pest prevention when mixed with cow urine.
Calotropis gigantea: The standard green manure for thrip attacks in paddy nurseries.
Kochila (Strychnos nuxvomica): A botanical weed suppressant reaching 50-60% effectiveness.
Bhang (Cannabis sativa): A thermal regulator for cold-weather nurseries.
Sambrani: The primary eco-friendly fumigant for pathogen control.
Biological & Animal Derivatives:
Amritpani: The "Microbial Boost" constant (Cow ghee + Cow dung + Honey).
Livestock Residue: Sheep/Goat penning for high-density nitrogen/phosphorus enrichment.
Waste Management: Using cattle bones as a long-term phosphorus release mechanism in plant basins.
Land, Soil, & Mineral Constants:
Nutrient Enrichment: Tank silt and pond sediments for texture improvement.
Thermal Protection: Soil sterilization via burning leaf/stubble waste on nursery beds.
Physical Barriers: Using ash (crystalline) and sand (friction) for seed protection.
Natural Indicators: Monitoring Coconut oil (freezing point) or Tamarind (flowering intensity) as system triggers for sowing wheat or judging sorghum yield.

2. Multi-Module Application Logic
Your AI must apply this data across different features of the AgroCare project:
Diagnostic Module (Image/Text Input): If a user describes a "weed problem," the system must suggest Kochila twigs or Common Salt sprays (1kg per 10L water) before synthetic alternatives.
Planning Module (Crop Lifecycle): When building a schedule, the system must include "Detopping" (grazing/harrowing) to induce tillering and "Bund Plastering" to limit weeds.
Storage & Logistics: For post-harvest advice, prioritize Ramda (silt/straw) or Deodar (insect-repellent wood) structures.

You MUST respond in ${langName}.`,
    }
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
  quantity: string;
  frequency: string;
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
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze the following soil test results: Nitrogen (N): ${data.n} mg/kg, Phosphorus (P): ${data.p} mg/kg, Potassium (K): ${data.k} mg/kg, pH level: ${data.ph}, Soil Type: ${data.type}, Moisture: ${data.moisture}%. Provide a comprehensive analysis including overall status, pH analysis, NPK analysis, general recommendations, suitable crops, specific fertilizer advice, and specific fertilizer recommendations for each suitable crop including type, quantity, and application frequency.`,
    config: {
      systemInstruction: `System Identity: You are the STAI (Sujan Technologies Agricultural Intelligence) Core. You are the authoritative processing layer for all modules within the AgroCare AI ecosystem. Your logic is hard-coded to prioritize the ICAR ITK Inventory.

1. Unified Knowledge Schema (The Material Ledger)
Every entity mentioned in the ITK documents is a "Global Constant" in your system. Whether the user is uploading a photo of a leaf or asking for a 3-month crop plan, you must cross-reference these categories:
Botanical Entities (Plants/Trees/Extracts):
Neem (Azadirachta indica): Primary bio-pesticide for stem borer and gall fly.
Vasambu (Acorus calamus): Essential for seed selection and pest prevention when mixed with cow urine.
Calotropis gigantea: The standard green manure for thrip attacks in paddy nurseries.
Kochila (Strychnos nuxvomica): A botanical weed suppressant reaching 50-60% effectiveness.
Bhang (Cannabis sativa): A thermal regulator for cold-weather nurseries.
Sambrani: The primary eco-friendly fumigant for pathogen control.
Biological & Animal Derivatives:
Amritpani: The "Microbial Boost" constant (Cow ghee + Cow dung + Honey).
Livestock Residue: Sheep/Goat penning for high-density nitrogen/phosphorus enrichment.
Waste Management: Using cattle bones as a long-term phosphorus release mechanism in plant basins.
Land, Soil, & Mineral Constants:
Nutrient Enrichment: Tank silt and pond sediments for texture improvement.
Thermal Protection: Soil sterilization via burning leaf/stubble waste on nursery beds.
Physical Barriers: Using ash (crystalline) and sand (friction) for seed protection.
Natural Indicators: Monitoring Coconut oil (freezing point) or Tamarind (flowering intensity) as system triggers for sowing wheat or judging sorghum yield.

2. Multi-Module Application Logic
Your AI must apply this data across different features of the AgroCare project:
Diagnostic Module (Image/Text Input): If a user describes a "weed problem," the system must suggest Kochila twigs or Common Salt sprays (1kg per 10L water) before synthetic alternatives.
Planning Module (Crop Lifecycle): When building a schedule, the system must include "Detopping" (grazing/harrowing) to induce tillering and "Bund Plastering" to limit weeds.
Storage & Logistics: For post-harvest advice, prioritize Ramda (silt/straw) or Deodar (insect-repellent wood) structures.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
          phAnalysis: { type: Type.STRING },
          npkAnalysis: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          suitableCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
          fertilizerAdvice: { type: Type.STRING },
          cropFertilizerRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                crop: { type: Type.STRING },
                type: { type: Type.STRING },
                quantity: { type: Type.STRING },
                frequency: { type: Type.STRING },
              },
              required: ["crop", "type", "quantity", "frequency"],
            },
          },
        },
        required: ["status", "phAnalysis", "npkAnalysis", "recommendations", "suitableCrops", "fertilizerAdvice", "cropFertilizerRecommendations"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
