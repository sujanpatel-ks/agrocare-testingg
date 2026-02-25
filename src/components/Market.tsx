import React, { useState, useMemo } from 'react';
import { ArrowLeft, Bell, Search, Mic, MapPin, Wheat, Heart, TrendingUp, TrendingDown, Minus, Store, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CROP_PRICES } from '../constants';
import { CropPrice, Language } from '../types';

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

  const categories: Category[] = ['All', 'Grains', 'Vegetables', 'Oilseeds', 'Fruits'];

  const filteredCrops = useMemo(() => {
    let result = CROP_PRICES.filter((crop) => {
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
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  return (
    <div className="flex flex-col min-h-screen bg-soil">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-full bg-soil text-earth hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight text-earth">Market Prices</h1>
            <p className="text-sm font-medium text-gray-500">मंडी भाव</p>
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-soil text-earth hover:bg-gray-200 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="px-4 pt-4 pb-2 bg-white sticky top-[88px] z-10 shadow-sm rounded-b-2xl">
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
        <div className="flex items-center justify-between mb-2">
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-dark/60 bg-primary/5 px-2 py-0.5 rounded-full self-start">
                        {crop.category}
                      </span>
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
                <div className="text-xs text-gray-500">
                  <p>Price Trend (7 Days)</p>
                </div>
                <div className="h-8 w-24">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30">
                    <path 
                      className={`fill-none stroke-2 ${crop.trend === 'up' ? 'stroke-green-500' : crop.trend === 'down' ? 'stroke-red-500' : 'stroke-gray-400'}`} 
                      d={crop.trend === 'up' ? "M0,25 Q20,28 40,15 T100,5" : crop.trend === 'down' ? "M0,5 Q20,5 40,15 T100,25" : "M0,15 L30,15 L50,12 L70,15 L100,15"} 
                    />
                    <circle 
                      className={crop.trend === 'up' ? 'fill-green-600' : crop.trend === 'down' ? 'fill-red-600' : 'fill-gray-400'} 
                      cx="100" cy={crop.trend === 'up' ? 5 : crop.trend === 'down' ? 25 : 15} r="2" 
                    />
                  </svg>
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
    </div>
  );
};
