import { CropPrice } from '../types';
import { CROP_PRICES } from '../constants';
import localMarketData from '../data/market_data.json';

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
  if (lower.includes('brinjal')) return '🍆';
  if (lower.includes('peas')) return '🫛';
  if (lower.includes('garlic')) return '🧄';
  if (lower.includes('cabbage')) return '🥬';
  return '🌱';
};

const getCategoryForCommodity = (commodity: string): 'Grains' | 'Vegetables' | 'Oilseeds' | 'Fruits' => {
  const lower = commodity.toLowerCase();
  if (lower.includes('wheat') || lower.includes('rice') || lower.includes('paddy') || lower.includes('corn') || lower.includes('maize')) return 'Grains';
  if (lower.includes('tomato') || lower.includes('onion') || lower.includes('potato') || lower.includes('carrot') || lower.includes('chilli') || lower.includes('gourd') || lower.includes('brinjal') || lower.includes('peas') || lower.includes('cabbage') || lower.includes('garlic')) return 'Vegetables';
  if (lower.includes('apple') || lower.includes('mango') || lower.includes('pineapple') || lower.includes('banana')) return 'Fruits';
  if (lower.includes('soybean') || lower.includes('mustard') || lower.includes('groundnut')) return 'Oilseeds';
  return 'Vegetables'; // Default fallback
};

const formatRecordsToCropPrices = (records: any[]): CropPrice[] => {
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
};

export async function fetchKarnatakaMarketPrices(): Promise<CropPrice[]> {
  try {
    // Fetch Karnataka data specifically, prioritizing Tumkur from our secure server-side proxy
    const response = await fetch(`/api/mandi-prices?state=Karnataka&district=Tumkur&limit=50`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    let records = data.records || [];
    
    // If Karnataka data is not available for today yet, fetch general data via fallback parameter on our proxy
    if (records.length === 0) {
      console.warn('No Karnataka data available for today. Fetching general data as fallback.');
      const fallbackResponse = await fetch(`/api/mandi-prices?fallback=true&limit=50`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        records = fallbackData.records || [];
      }
    }
    
    // If API is completely empty or fails, use the newly added local market data
    if (records.length === 0) {
      return formatRecordsToCropPrices(localMarketData.records);
    }
    
    return formatRecordsToCropPrices(records);
  } catch (error) {
    // Graceful fallback to local JSON data on network error (e.g. CORS, offline)
    if (localMarketData && localMarketData.records) {
      return formatRecordsToCropPrices(localMarketData.records);
    }
    return CROP_PRICES;
  }
}
