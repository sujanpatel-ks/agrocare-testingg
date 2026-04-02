import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CloudRain, Sun, Cloud, Wind, Star, MessageSquare, Info, Store, Filter, ChevronDown, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CropPrice, Language } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { SUPPLIERS } from '../constants';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon
const markerIcon2x = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const supplierIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map centering
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface CropDetailsProps {
  crop: CropPrice;
  onBack: () => void;
  language: Language;
  onFindSuppliers: () => void;
}

// Calculate distance between two coordinates in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const CropDetails: React.FC<CropDetailsProps> = ({ crop, onBack, language, onFindSuppliers }) => {
  const [sortBy, setSortBy] = useState<'recency' | 'rating'>('recency');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { latitude, longitude } = useGeolocation();

  // Generate deterministic supplier locations based on user location
  const mapSuppliers = useMemo(() => {
    if (!latitude || !longitude) return [];
    
    return SUPPLIERS.map((s, i) => {
      const pseudoRandom1 = Math.sin(i * 12.9898) * 43758.5453;
      const pseudoRandom2 = Math.cos(i * 78.233) * 43758.5453;
      const offsetLat = (pseudoRandom1 - Math.floor(pseudoRandom1) - 0.5) * 0.05;
      const offsetLng = (pseudoRandom2 - Math.floor(pseudoRandom2) - 0.5) * 0.05;
      
      const lat = s.lat || latitude + offsetLat;
      const lng = s.lng || longitude + offsetLng;
      const actualDistance = getDistanceKm(latitude, longitude, lat, lng).toFixed(1);
      return { ...s, lat, lng, distance: `${actualDistance} km` };
    });
  }, [latitude, longitude]);

  // Mock historical data
  const historicalData = [
    { date: 'Feb 18', price: crop.price - 100 },
    { date: 'Feb 19', price: crop.price - 50 },
    { date: 'Feb 20', price: crop.price - 80 },
    { date: 'Feb 21', price: crop.price + 20 },
    { date: 'Feb 22', price: crop.price - 10 },
    { date: 'Feb 23', price: crop.price + 40 },
    { date: 'Feb 24', price: crop.price },
  ];

  const initialReviews = [
    { id: 1, author: 'Rajesh K.', rating: 5, comment: 'Great prices this week at Azadpur Mandi. Quality was excellent.', date: '1d ago', timestamp: Date.now() - 86400000 },
    { id: 2, author: 'Suresh M.', rating: 4, comment: 'Prices are stable. Expecting a slight dip next week due to high supply.', date: '3d ago', timestamp: Date.now() - 86400000 * 3 },
    { id: 3, author: 'Amit P.', rating: 3, comment: 'Average quality arriving. Make sure to sort before selling.', date: '1w ago', timestamp: Date.now() - 86400000 * 7 },
    { id: 4, author: 'Vijay S.', rating: 5, comment: 'Very high demand for this crop right now. Sold my stock easily.', date: '2h ago', timestamp: Date.now() - 7200000 },
    { id: 5, author: 'Deepak R.', rating: 2, comment: 'Mandi was overcrowded and management was poor today.', date: '5d ago', timestamp: Date.now() - 86400000 * 5 },
  ];

  const filteredAndSortedReviews = useMemo(() => {
    let result = [...initialReviews];
    if (filterRating !== 'all') {
      result = result.filter(r => r.rating === filterRating);
    }
    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.timestamp - a.timestamp;
    });
    return result;
  }, [sortBy, filterRating]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-soil">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full bg-soil text-earth hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight text-earth">
              {language === 'hi' ? crop.nameHi : language === 'kn' ? crop.nameKn : crop.name} Details
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{crop.category}</p>
          </div>
          <div className="w-12 h-12 bg-soil rounded-2xl flex items-center justify-center text-2xl">
            {crop.icon}
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 pb-32 space-y-8">
        {/* Current Price Card */}
        <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Price</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-earth">₹{crop.price.toLocaleString()}</span>
                  <span className="text-lg font-bold text-gray-400">/q</span>
                </div>
              </div>
              <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${
                crop.trend === 'up' ? 'bg-green-500 text-white' : 
                crop.trend === 'down' ? 'bg-red-500 text-white' : 
                'bg-gray-500 text-white'
              }`}>
                {crop.trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : 
                 crop.trend === 'down' ? <TrendingDown size={14} className="mr-1" /> : 
                 <Minus size={14} className="mr-1" />}
                {crop.changePercent}%
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Store size={16} className="text-primary" />
              <span>Latest update from {crop.mandi}</span>
            </div>
          </div>
        </section>

        {/* In-Depth Information */}
        <section>
          <h2 className="text-xl font-black text-earth tracking-tight mb-5 px-2">Crop Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Soil Type</p>
              <p className="text-sm font-black text-earth">Loamy, Well-drained</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Water Needs</p>
              <p className="text-sm font-black text-earth">Moderate (400-600mm)</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Growth Stage</p>
              <p className="text-sm font-black text-earth">Vegetative</p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Est. Yield</p>
              <p className="text-sm font-black text-earth">20-25 q/acre</p>
            </div>
          </div>
        </section>

        {/* Price History Chart */}
        <section>
          <div className="flex justify-between items-center mb-5 px-2">
            <h2 className="text-xl font-black text-earth tracking-tight">Price History</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full">7D</span>
              <span className="px-3 py-1 bg-white text-gray-400 text-[10px] font-black rounded-full border border-gray-100">1M</span>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                  dy={10}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 100', 'dataMax + 100']} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, color: '#1B5E20' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2E7D32" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Weather Impact */}
        <section>
          <h2 className="text-xl font-black text-earth tracking-tight mb-5 px-2">Weather & Market Impact</h2>
          
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 px-2 -mx-2">
            <div className="min-w-[140px] bg-blue-50 rounded-3xl p-5 border border-blue-100 flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <CloudRain size={24} />
              </div>
              <h3 className="font-black text-blue-900 text-sm mb-1">Rainfall</h3>
              <p className="text-xs text-blue-700/80 font-medium">Moderate rain in 48h</p>
            </div>
            
            <div className="min-w-[140px] bg-orange-50 rounded-3xl p-5 border border-orange-100 flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3">
                <Sun size={24} />
              </div>
              <h3 className="font-black text-orange-900 text-sm mb-1">Temperature</h3>
              <p className="text-xs text-orange-700/80 font-medium">32°C High / 22°C Low</p>
            </div>

            <div className="min-w-[140px] bg-teal-50 rounded-3xl p-5 border border-teal-100 flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3">
                <Wind size={24} />
              </div>
              <h3 className="font-black text-teal-900 text-sm mb-1">Wind</h3>
              <p className="text-xs text-teal-700/80 font-medium">12 km/h NW</p>
            </div>
          </div>

          <div className="bg-[#1B5E20] rounded-[32px] p-6 text-white relative overflow-hidden mt-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-base font-black">Market Prediction</h3>
              </div>
              <p className="text-sm text-green-100/80 font-medium leading-relaxed mb-5">
                Upcoming rain may temporarily slow down arrivals at {crop.mandi}, potentially pushing prices up by 2-3%.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-200/60 mb-1">Supply Risk</p>
                  <p className="text-sm font-black">Medium</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-200/60 mb-1">Price Outlook</p>
                  <p className="text-sm font-black text-green-400">Bullish</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supplier Map */}
        <section>
          <div className="flex justify-between items-center mb-5 px-2">
            <h2 className="text-xl font-black text-earth tracking-tight">Nearby Suppliers</h2>
            <button 
              onClick={onFindSuppliers}
              className="text-primary text-xs font-black uppercase tracking-widest flex items-center"
            >
              View All <ChevronDown size={14} className="ml-1 -rotate-90" />
            </button>
          </div>
          <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-100 overflow-hidden h-64 relative">
            {latitude && longitude ? (
              <MapContainer 
                center={[latitude, longitude]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', borderRadius: '24px', zIndex: 10 }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ChangeView center={[latitude, longitude]} zoom={12} />
                
                {/* User Location */}
                <Marker position={[latitude, longitude]} icon={userIcon}>
                  <Popup className="rounded-xl">
                    <div className="font-bold text-center">Your Location</div>
                  </Popup>
                </Marker>

                {/* Suppliers */}
                {mapSuppliers.map((supplier) => (
                  <Marker 
                    key={supplier.id} 
                    position={[supplier.lat!, supplier.lng!]} 
                    icon={supplierIcon}
                  >
                    <Popup className="rounded-xl">
                      <div className="p-1">
                        <h3 className="font-black text-earth text-sm">{supplier.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{supplier.distance} away</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold">{supplier.rating}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full w-full bg-gray-50 rounded-[24px] flex flex-col items-center justify-center text-gray-400">
                <MapPin size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">Locating nearby suppliers...</p>
              </div>
            )}
          </div>
        </section>

        {/* Farmer Reviews */}
        <section>
          <div className="flex justify-between items-center mb-5 px-2">
            <h2 className="text-xl font-black text-earth tracking-tight">Farmer Insights</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-100'}`}
              >
                <Filter size={18} />
              </button>
              <button className="text-primary text-xs font-black uppercase tracking-widest flex items-center">
                Write Review <MessageSquare size={14} className="ml-1" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Sort By</p>
                    <div className="flex gap-2">
                      {[
                        { id: 'recency', label: 'Newest' },
                        { id: 'rating', label: 'Top Rated' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id as any)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${sortBy === option.id ? 'bg-primary text-white' : 'bg-soil text-earth'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Filter by Rating</p>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                      <button
                        onClick={() => setFilterRating('all')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterRating === 'all' ? 'bg-primary text-white' : 'bg-soil text-earth'}`}
                      >
                        All Ratings
                      </button>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setFilterRating(rating)}
                          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${filterRating === rating ? 'bg-primary text-white' : 'bg-soil text-earth'}`}
                        >
                          {rating} <Star size={10} fill={filterRating === rating ? "white" : "currentColor"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {filteredAndSortedReviews.length > 0 ? (
              filteredAndSortedReviews.map((review) => (
                <motion.div 
                  layout
                  key={review.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-soil rounded-full flex items-center justify-center font-black text-earth">
                        {review.author[0]}
                      </div>
                      <div>
                        <p className="font-black text-earth text-sm leading-none">{review.author}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{review.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    "{review.comment}"
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="bg-white rounded-[28px] p-10 text-center border border-dashed border-gray-200">
                <p className="text-sm font-bold text-gray-400">No reviews match your filters.</p>
                <button 
                  onClick={() => { setFilterRating('all'); setSortBy('recency'); }}
                  className="mt-2 text-primary text-xs font-black uppercase tracking-widest"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-30">
        <button 
          onClick={onFindSuppliers}
          className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/30 active:scale-95 transition-all"
        >
          <Store size={24} />
          {language === 'hi' ? 'आस-पास के आपूर्तिकर्ता खोजें' : language === 'kn' ? 'ಹತ್ತಿರದ ಸರಬರಾಜುದಾರರನ್ನು ಹುಡುಕಿ' : 'Find Nearby Suppliers'}
        </button>
      </div>
    </div>
  );
};
