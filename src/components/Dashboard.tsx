import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Camera, Upload, Calendar as CalendarIcon, Store, X, Sprout, Users, TrendingUp, Beaker, Landmark, CloudRain, Sun, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUploader } from './FileUploader';
import { Language } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';

interface DashboardProps {
  onNavigate: (screen: any) => void;
  onFileSelect: (file: File) => void;
  onAddTask?: (task: any) => void;
  language: Language;
  onToggleLanguage: () => void;
  onCameraOpen: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFileSelect, onAddTask, language, onToggleLanguage, onCameraOpen }) => {
  const [showUploader, setShowUploader] = useState(false);
  const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<{ temp: number, condition: string, icon: any } | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const state = data.address.state;
            if (city && state) {
              setLocationName(`${city}, ${state}`);
            } else if (city) {
              setLocationName(city);
            } else {
              setLocationName('Location Found');
            }
          }
        })
        .catch(() => setLocationName('Location Found'));

      // Simulate fetching weather data based on location
      // In a real app, you would call a weather API like OpenWeatherMap here
      setTimeout(() => {
        setWeatherData({
          temp: 28,
          condition: 'Partly Cloudy',
          icon: <Sun size={20} className="text-yellow-300" />
        });
      }, 1000);
    }
  }, [latitude, longitude]);

  const t = {
    en: {
      scan: "Scan Crop",
      scanDesc: "Open AI Camera",
      upload: "Upload from Gallery",
      calendar: "My Calendar",
      suppliers: "Suppliers",
      community: "Community",
      market: "Market Prices",
      soil: "Soil Test",
      schemes: "Govt Schemes",
      location: "Unknown Location",
    },
    hi: {
      scan: "फसल स्कैन करें",
      scanDesc: "एआई कैमरा खोलें",
      upload: "गैलरी से अपलोड करें",
      calendar: "मेरा कैलेंडर",
      suppliers: "आपूर्तिकर्ता",
      community: "समुदाय",
      market: "बाजार भाव",
      soil: "मिट्टी परीक्षण",
      schemes: "सरकारी योजनाएं",
      location: "अज्ञात स्थान",
    },
    kn: {
      scan: "ಬೆಳೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      scanDesc: "ಎಐ ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ",
      upload: "ಗ್ಯಾಲರಿಯಿಂದ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
      calendar: "ನನ್ನ ಕ್ಯಾಲೆಂಡರ್",
      suppliers: "ಸರಬರಾಜುದಾರರು",
      community: "ಸಮುದಾಯ",
      market: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
      soil: "ಮಣ್ಣು ಪರೀಕ್ಷೆ",
      schemes: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು",
      location: "ಅಜ್ಞಾತ ಸ್ಥಳ",
    }
  }[language];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA] pb-24">
      {/* Header Section */}
      <div className="bg-primary-dark pt-12 pb-24 px-6 rounded-b-[40px] text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#4CAF50] rounded-2xl flex items-center justify-center shadow-sm">
              <Sprout size={28} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AgroCare AI</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-green-100 uppercase">Precision Farming</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-black/20 rounded-full p-1 border border-white/10">
              <button onClick={() => language !== 'en' && onToggleLanguage()} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${language === 'en' ? 'bg-white text-primary-dark' : 'text-white'}`}>EN</button>
              <button onClick={() => language !== 'hi' && onToggleLanguage()} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${language === 'hi' ? 'bg-white text-primary-dark' : 'text-white'}`}>HI</button>
              <button onClick={() => language !== 'kn' && onToggleLanguage()} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${language === 'kn' ? 'bg-white text-primary-dark' : 'text-white'}`}>KN</button>
            </div>
            <button className="relative">
              <Bell size={24} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary-dark"></span>
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-100">
            <MapPin size={16} />
            <span className="text-sm font-bold">
              {locationLoading ? 'Locating...' : locationError ? 'Location Error' : locationName || t.location}
            </span>
          </div>
          
          {weatherData && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
              {weatherData.icon}
              <span className="text-sm font-bold">{weatherData.temp}°C</span>
              <span className="text-xs text-green-100 ml-1 hidden sm:inline">{weatherData.condition}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 -mt-16 space-y-6 relative z-10">
        {/* Scan Card */}
        <div className="bg-white p-2 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="bg-[#2E7D32] rounded-[24px] p-6 flex justify-between items-center text-white">
            <div>
              <h2 className="text-3xl font-black mb-1">{t.scan}</h2>
              <p className="text-sm font-bold text-green-100">{t.scanDesc}</p>
            </div>
            <button onClick={onCameraOpen} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#2E7D32] shadow-inner active:scale-95 transition-transform">
              <Camera size={32} strokeWidth={2.5} />
            </button>
          </div>
          <button onClick={() => setShowUploader(true)} className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-[#455A64] font-bold active:bg-gray-50 rounded-2xl transition-colors">
            <Upload size={20} />
            {t.upload}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => onNavigate('calendar')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
              <CalendarIcon size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.calendar}</span>
          </button>
          <button onClick={() => onNavigate('suppliers')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <Store size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.suppliers}</span>
          </button>
          <button onClick={() => onNavigate('community')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
              <Users size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.community}</span>
          </button>
          <button onClick={() => onNavigate('market')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
              <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.market}</span>
          </button>
          <button onClick={() => onNavigate('soil-analysis')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Beaker size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.soil}</span>
          </button>
          <button onClick={() => onNavigate('scheme-finder')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
              <Landmark size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t.schemes}</span>
          </button>
        </div>

        {/* Quick Chat Input */}
        <div className="bg-white p-4 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-60 pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#2E7D32]">
              <Sprout size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#455A64]">Ask AgroCare AI</h3>
              <p className="text-xs text-gray-500">Get instant farming advice</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100 focus-within:border-green-300 focus-within:bg-white transition-colors relative z-10">
            <input 
              type="text" 
              placeholder="E.g., How to treat tomato blight?" 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-gray-700 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  // We can navigate to chat and pass the initial message if needed
                  // For now, just navigate to chat
                  onNavigate('chat');
                }
              }}
            />
            <button 
              onClick={() => onNavigate('chat')}
              className="w-10 h-10 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>

        {/* Uploader Modal */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            >
              <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-[#455A64] text-lg">Upload Crop Photo</h3>
                  <button 
                    onClick={() => setShowUploader(false)}
                    className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-[#455A64] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <FileUploader onFileSelect={(file) => {
                    setShowUploader(false);
                    onFileSelect(file);
                  }} onCameraOpen={() => {
                    setShowUploader(false);
                    onCameraOpen();
                  }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
