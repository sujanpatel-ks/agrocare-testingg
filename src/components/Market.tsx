import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Bell, Search, Mic, MapPin, Wheat, Heart, TrendingUp, TrendingDown, Minus, Store, Filter, X, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { toast } from 'sonner';
import { CropPrice, Language } from '../types';
import { fetchKarnatakaMarketPrices } from '../services/marketApi';

const WATCHLIST_CROPS = [
  { id: 'w1', name: 'Wheat', nameHi: 'गेहूं', price: 2250, change: 45, changePercent: 2.0, trend: 'up', icon: '🌾' },
  { id: 'w2', name: 'Soybean', nameHi: 'सोयाबीन', price: 4800, change: -120, changePercent: -2.4, trend: 'down', icon: '🫘' },
  { id: 'w3', name: 'Onion', nameHi: 'प्याज', price: 1800, change: 150, changePercent: 9.1, trend: 'up', icon: '🧅' },
  { id: 'w4', name: 'Potato', nameHi: 'आलू', price: 1200, change: 20, changePercent: 1.6, trend: 'up', icon: '🥔' },
];

const ARBITRAGE_OPPORTUNITY = {
  cropName: 'Tomato',
  localMandi: 'Pune APMC',
  localPrice: 1200,
  targetMandi: 'Mumbai Vashi',
  targetPrice: 1800,
  difference: 600,
  distance: '140 km',
  profitMargin: '50%'
};

const getMockHistoricalData = (price: number, trend: string) => {
  const base = price;
  if (trend === 'up') {
    return [
      { price: base * 0.9 }, { price: base * 0.92 }, { price: base * 0.91 },
      { price: base * 0.95 }, { price: base * 0.94 }, { price: base * 0.98 }, { price: base }
    ];
  } else if (trend === 'down') {
    return [
      { price: base * 1.1 }, { price: base * 1.08 }, { price: base * 1.09 },
      { price: base * 1.05 }, { price: base * 1.06 }, { price: base * 1.02 }, { price: base }
    ];
  } else {
    return [
      { price: base * 0.99 }, { price: base * 1.01 }, { price: base * 0.98 },
      { price: base * 1.02 }, { price: base * 0.99 }, { price: base * 1.01 }, { price: base }
    ];
  }
};

interface MarketProps {
  onBack: () => void;
  onSelectCrop: (crop: CropPrice) => void;
  language: Language;
}

type Category = 'All' | 'Grains' | 'Vegetables' | 'Oilseeds' | 'Fruits';
type SortOption = 'price-asc' | 'price-desc' | 'change-desc' | 'change-asc' | 'none';

export const Market: React.FC<MarketProps> = ({ onBack, onSelectCrop, language }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [crops, setCrops] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<Record<string, { threshold: number, direction: 'above' | 'below' }>>({});
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedCropForAlert, setSelectedCropForAlert] = useState<CropPrice | null>(null);
  const [alertThreshold, setAlertThreshold] = useState<string>('');
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

  const categories: Category[] = ['All', 'Grains', 'Vegetables', 'Oilseeds', 'Fruits'];

  const fetchCrops = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchKarnatakaMarketPrices();
      setCrops(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Simulate live price updates
  useEffect(() => {
    if (crops.length === 0) return;
    
    const interval = setInterval(() => {
      setCrops(prevCrops => prevCrops.map(crop => {
        // Randomly change price by -1% to +1%
        const changeFactor = 1 + (Math.random() * 0.02 - 0.01);
        const newPrice = Math.round(crop.price * changeFactor);
        const change = newPrice - crop.price;
        const changePercent = Number(((change / crop.price) * 100).toFixed(1));
        
        return {
          ...crop,
          price: newPrice,
          change: crop.change + change,
          changePercent: Number((crop.changePercent + changePercent).toFixed(1)),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : crop.trend
        };
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [crops.length]);

  // Check alerts
  useEffect(() => {
    crops.forEach(crop => {
      const alert = alerts[crop.id];
      if (alert) {
        if (alert.direction === 'above' && crop.price >= alert.threshold) {
          toast.success(`Price Alert: ${crop.name} has crossed above ₹${alert.threshold}! Current price: ₹${crop.price}`);
          setAlerts(prev => {
            const newAlerts = { ...prev };
            delete newAlerts[crop.id];
            return newAlerts;
          });
        } else if (alert.direction === 'below' && crop.price <= alert.threshold) {
          toast.success(`Price Alert: ${crop.name} has dropped below ₹${alert.threshold}! Current price: ₹${crop.price}`);
          setAlerts(prev => {
            const newAlerts = { ...prev };
            delete newAlerts[crop.id];
            return newAlerts;
          });
        }
      }
    });
  }, [crops, alerts]);

  const handleSetAlert = () => {
    if (!selectedCropForAlert || !alertThreshold) return;
    
    setAlerts(prev => ({
      ...prev,
      [selectedCropForAlert.id]: {
        threshold: Number(alertThreshold),
        direction: alertDirection
      }
    }));
    
    toast.success(`Alert set for ${selectedCropForAlert.name} ${alertDirection} ₹${alertThreshold}`);
    setAlertModalOpen(false);
    setSelectedCropForAlert(null);
    setAlertThreshold('');
  };

  const filteredCrops = useMemo(() => {
    let result = crops.filter((crop) => {
      const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           crop.nameHi.includes(searchQuery);
      const matchesCategory = selectedCategory === 'All' || crop.category === selectedCategory;
      const matchesPrice = crop.price >= priceRange[0] && crop.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy !== 'none') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'change-desc': return b.changePercent - a.changePercent;
          case 'change-asc': return a.changePercent - b.changePercent;
          default: return 0;
        }
      });
    }

    return result;
  }, [crops, searchQuery, selectedCategory, priceRange, sortBy]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-soil">
      {/* Header */}
      <header className="bg-primary-dark text-white px-5 pt-12 pb-6 rounded-b-[24px] shadow-lg z-20 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>

        <div className="flex items-center justify-between gap-4 relative z-10">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-black tracking-wide text-white">Market Prices</h1>
            <p className="text-xs font-bold text-green-200/80 uppercase tracking-widest mt-0.5">मंडी भाव</p>
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-primary-dark"></span>
          </button>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="px-4 pt-4 pb-2 bg-soil sticky top-0 z-10">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              className="block w-full pl-10 pr-10 py-3 bg-soil border-none rounded-xl text-earth placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none shadow-inner" 
              placeholder="Search crops..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-earth"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${showFilters ? 'bg-primary text-white' : 'bg-soil text-earth hover:bg-gray-200'}`}
          >
            <Filter size={20} />
          </button>
        </div>
        
        {showFilters && (
          <div className="mb-4 p-4 bg-soil rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Sort By</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'price-desc', label: 'Price: High to Low' },
                  { id: 'price-asc', label: 'Price: Low to High' },
                  { id: 'change-desc', label: 'Gainers (Change %)' },
                  { id: 'change-asc', label: 'Losers (Change %)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id as SortOption)}
                    className={`text-xs py-2 px-3 rounded-lg border transition-all font-bold ${
                      sortBy === opt.id 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-earth border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Range (₹/q)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="10000" 
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="flex-1 accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-bold text-earth min-w-[80px] text-right">Up to ₹{priceRange[1]}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setPriceRange([0, 10000]);
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setSortBy('none');
                }}
                className="text-xs font-bold text-gray-400 hover:text-earth"
              >
                Reset All
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap border transition-all ${
                selectedCategory === cat 
                  ? 'bg-primary/10 text-primary-dark border-primary/20 font-bold' 
                  : 'bg-soil text-earth border-transparent hover:border-gray-200 font-medium'
              }`}
            >
              {cat === 'All' ? <Wheat size={16} /> : null}
              <span className="text-sm">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-32 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
            />
            <p className="text-gray-500 font-medium">Loading market prices...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-3xl border border-red-100 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
            <p className="text-gray-500 mb-6">We couldn't fetch the latest market prices. Please check your internet connection and try again.</p>
            <button 
              onClick={fetchCrops}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* NEW: My Watchlist */}
            {(!searchQuery && selectedCategory === 'All') && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-earth mb-3">My Watchlist</h2>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
                  {WATCHLIST_CROPS.map(crop => (
                    <div key={crop.id} className="min-w-[140px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 shrink-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">{crop.icon}</span>
                        <div className={`flex items-center text-xs font-bold ${crop.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {crop.trend === 'up' ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                          {crop.changePercent}%
                        </div>
                      </div>
                      <h3 className="font-bold text-earth text-sm">{crop.name}</h3>
                      <p className="text-lg font-bold text-earth mt-1">₹{crop.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEW: Arbitrage Opportunities */}
            {(!searchQuery && selectedCategory === 'All') && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-earth mb-3">Arbitrage Opportunities</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                    Smart Insight
                  </div>
                  <div className="flex items-start gap-3 mt-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-base mb-1">Sell {ARBITRAGE_OPPORTUNITY.cropName} in {ARBITRAGE_OPPORTUNITY.targetMandi}</h3>
                      <p className="text-sm text-blue-800 mb-3 leading-snug">
                        Prices are <span className="font-bold text-green-700">+₹{ARBITRAGE_OPPORTUNITY.difference}/q</span> higher than your local mandi ({ARBITRAGE_OPPORTUNITY.localMandi}).
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 bg-blue-100/70 inline-flex px-3 py-1.5 rounded-lg">
                        <span className="flex items-center gap-1"><Store size={12} /> {ARBITRAGE_OPPORTUNITY.distance}</span>
                        <span className="w-1 h-1 rounded-full bg-blue-300"></span>
                        <span className="text-green-700">Est. Profit: {ARBITRAGE_OPPORTUNITY.profitMargin}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3 mt-2">
              <h2 className="text-lg font-bold text-earth">
                {searchQuery || selectedCategory !== 'All' ? 'Search Results' : 'Trending Crops'} 
                <span className="text-sm font-normal text-gray-500 ml-1">| आज के भाव</span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">{filteredCrops.length} items found</p>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredCrops.length > 0 ? (
                filteredCrops.map((crop, index) => (
                  <motion.div 
                    layout
                    key={crop.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectCrop(crop)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
                  >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    crop.category === 'Grains' ? 'bg-amber-100' : 
                    crop.category === 'Vegetables' ? 'bg-purple-100' : 
                    crop.category === 'Oilseeds' ? 'bg-yellow-100' : 'bg-orange-100'
                  }`}>
                    <span className="text-2xl">{crop.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-earth leading-tight">
                      {crop.name} 
                      <span className="text-sm font-medium text-gray-500">
                        | {language === 'hi' ? crop.nameHi : language === 'kn' ? crop.nameKn : crop.name}
                      </span>
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Store size={12} />
                        {crop.mandi}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-dark/60 bg-primary/5 px-2 py-0.5 rounded-full">
                          {crop.category}
                        </span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                          🤖 AI: {crop.trend === 'up' ? '+5%' : crop.trend === 'down' ? '-3%' : 'Stable'} next week
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-earth">₹{crop.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/q</span></p>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    crop.trend === 'up' ? 'bg-green-100 text-green-700' : 
                    crop.trend === 'down' ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {crop.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : 
                     crop.trend === 'down' ? <TrendingDown size={12} className="mr-1" /> : 
                     <Minus size={12} className="mr-1" />}
                    {crop.change > 0 ? '+' : ''}₹{Math.abs(crop.change)} ({crop.changePercent}%)
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-500">
                    <p>Price Trend (7 Days)</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCropForAlert(crop);
                      setAlertModalOpen(true);
                      setAlertThreshold(crop.price.toString());
                    }}
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      alerts[crop.id] 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <Bell size={12} className={alerts[crop.id] ? 'fill-primary' : ''} />
                    {alerts[crop.id] ? 'Alert Set' : 'Set Alert'}
                  </button>
                </div>
                <div className="h-10 w-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getMockHistoricalData(crop.price, crop.trend)}>
                      <defs>
                        <linearGradient id={`colorPrice-${crop.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={crop.trend === 'up' ? '#22c55e' : crop.trend === 'down' ? '#ef4444' : '#9ca3af'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={crop.trend === 'up' ? '#22c55e' : crop.trend === 'down' ? '#ef4444' : '#9ca3af'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={['dataMin - (dataMin * 0.1)', 'dataMax + (dataMax * 0.1)']} />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={crop.trend === 'up' ? '#22c55e' : crop.trend === 'down' ? '#ef4444' : '#9ca3af'} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#colorPrice-${crop.id})`} 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-earth">No crops found</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setPriceRange([0, 10000]);
              }}
              className="mt-4 text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
        </AnimatePresence>
        </>
        )}

        {/* Sell Smartly Tip */}
        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary-dark flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h4 className="font-bold text-earth text-sm">Sell Smartly!</h4>
            <p className="text-xs text-gray-600">Prices for Wheat are expected to rise next week. Consider holding.</p>
          </div>
        </div>
      </main>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModalOpen && selectedCropForAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setAlertModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-earth">Set Price Alert</h3>
                <button 
                  onClick={() => setAlertModalOpen(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{selectedCropForAlert.icon}</span>
                  <div>
                    <p className="font-bold text-earth">{selectedCropForAlert.name}</p>
                    <p className="text-sm text-gray-500">Current: ₹{selectedCropForAlert.price}/q</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Alert me when price goes</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAlertDirection('above')}
                        className={`flex-1 py-2 rounded-xl font-bold border-2 transition-colors ${
                          alertDirection === 'above' 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        Above
                      </button>
                      <button 
                        onClick={() => setAlertDirection('below')}
                        className={`flex-1 py-2 rounded-xl font-bold border-2 transition-colors ${
                          alertDirection === 'below' 
                            ? 'border-red-500 bg-red-50 text-red-600' 
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        Below
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Target Price (₹/q)</label>
                    <input 
                      type="number" 
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-earth focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter amount..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                {alerts[selectedCropForAlert.id] && (
                  <button 
                    onClick={() => {
                      setAlerts(prev => {
                        const newAlerts = { ...prev };
                        delete newAlerts[selectedCropForAlert.id];
                        return newAlerts;
                      });
                      setAlertModalOpen(false);
                      toast.success(`Alert removed for ${selectedCropForAlert.name}`);
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Remove
                  </button>
                )}
                <button 
                  onClick={handleSetAlert}
                  disabled={!alertThreshold}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
