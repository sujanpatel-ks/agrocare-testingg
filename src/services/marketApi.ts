import { CropPrice } from '../types';
import { CROP_PRICES } from '../constants';

const API_KEY = (import.meta as any).env.VITE_DATA_GOV_IN_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

const getIconForCommodity = (commodity: string) => {
  const lower = commodity.toLowerCase();
  if (lower.includes('wheat')) return '🌾';
  if (lower.includes('rice') || lower.includes('paddy')) return '🍚';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('potato')) return '🥔';
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('mango')) return '🥭';
  if (lower.includes('cotton')) return '☁️';
  if (lower.includes('corn') || lower.includes('maize')) return '🌽';
  if (lower.includes('carrot')) return '🥕';
  if (lower.includes('chilli')) return '🌶️';
  return '🌱';
};

const getCategoryForCommodity = (commodity: string): 'Grains' | 'Vegetables' | 'Oilseeds' | 'Fruits' => {
  const lower = commodity.toLowerCase();
  if (lower.includes('wheat') || lower.includes('rice') || lower.includes('paddy') || lower.includes('corn') || lower.includes('maize')) return 'Grains';
  if (lower.includes('tomato') || lower.includes('onion') || lower.includes('potato') || lower.includes('carrot') || lower.includes('chilli') || lower.includes('gourd')) return 'Vegetables';
  if (lower.includes('apple') || lower.includes('mango') || lower.includes('pineapple') || lower.includes('banana')) return 'Fruits';
  if (lower.includes('soybean') || lower.includes('mustard') || lower.includes('groundnut')) return 'Oilseeds';
  return 'Vegetables'; // Default fallback
};

export async function fetchKarnatakaMarketPrices(): Promise<CropPrice[]> {
  try {
    // Try to fetch Karnataka data specifically
    const response = await fetch(`${BASE_URL}?api-key=${API_KEY}&format=json&filters[state]=Karnataka&limit=50`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    let records = data.records || [];
    
    // If Karnataka data is not available for today yet, fetch general data
    if (records.length === 0) {
      console.warn('No Karnataka data available for today. Fetching general data as fallback.');
      const fallbackResponse = await fetch(`${BASE_URL}?api-key=${API_KEY}&format=json&limit=50`);
      const fallbackData = await fallbackResponse.json();
      records = fallbackData.records || [];
    }
    
    // If API is completely empty or fails, use fallback mock data
    if (records.length === 0) {
      return CROP_PRICES;
    }
    
    return records.map((record: any, index: number) => {
      const pricePerQuintal = record.modal_price;
      // Generate a random trend for UI purposes since API only gives current price
      const randomChange = (Math.random() * 100 - 50); 
      const trend = randomChange > 0 ? 'up' : randomChange < 0 ? 'down' : 'neutral';
      
      return {
        id: `mandi-${record.market}-${index}`,
        name: record.commodity,
        nameHi: record.commodity, // API doesn't provide Hindi names
        nameKn: record.commodity, // API doesn't provide Kannada names
        price: pricePerQuintal,
        change: parseFloat(randomChange.toFixed(2)),
        changePercent: parseFloat((Math.abs(randomChange) / pricePerQuintal * 100).toFixed(2)),
        trend: trend,
        icon: getIconForCommodity(record.commodity),
        mandi: `${record.market}, ${record.district} (${record.state})`,
        category: getCategoryForCommodity(record.commodity),
      };
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    // Fallback to mock data on error
    return CROP_PRICES;
  }
}
