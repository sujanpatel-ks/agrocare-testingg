export type Screen = 'home' | 'market' | 'suppliers' | 'community' | 'calendar' | 'diagnosis' | 'chat' | 'scan' | 'crop-details' | 'profile' | 'scheme-finder' | 'soil-analysis';

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
  address?: string;
  lat?: number;
  lng?: number;
  originalName?: string;
  officialNameDiffered?: boolean;
  nameVerified?: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOption?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Discussion {
  id: string;
  author: string;
  authorInitials: string;
  authorReputation?: number;
  authorBadge?: string;
  location: string;
  time: string;
  title: string;
  content: string;
  tags: string[];
  image?: string;
  media?: MediaItem[];
  poll?: Poll;
  likes: number;
  downvotes?: number;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
  comments: number;
  isReported?: boolean;
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
  actionEn: string;
  actionHi: string;
  actionKn: string;
}
