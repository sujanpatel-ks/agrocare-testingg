export type Screen = 'home' | 'market' | 'suppliers' | 'community' | 'calendar' | 'diagnosis' | 'chat' | 'scan' | 'crop-details';

export type Language = 'en' | 'hi' | 'kn';

export interface CropPrice {
  id: string;
  name: string;
  nameHi: string;
  nameKn: string;
  price: number;
  change: number;
  changePercent: number;
  mandi: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  category: 'Grains' | 'Vegetables' | 'Oilseeds' | 'Fruits';
}

export interface Supplier {
  id: string;
  name: string;
  distance: string;
  status: 'open' | 'closing' | 'closed';
  rating: number;
  reviews: number;
  tags: string[];
  verified: boolean;
  phone: string;
}

export interface Discussion {
  id: string;
  author: string;
  authorInitials: string;
  location: string;
  time: string;
  title: string;
  content: string;
  tags: string[];
  image: string;
  likes: number;
  comments: number;
}

export interface Task {
  id: string;
  title: string;
  titleHi: string;
  titleKn: string;
  description: string;
  icon: string;
  color: string;
  completed: boolean;
  urgent?: boolean;
}

export interface RecommendedCrop {
  id: string;
  name: string;
  nameHi: string;
  nameKn: string;
  status: string;
  planting: string;
  harvest: string;
  icon: string;
  color: string;
}
