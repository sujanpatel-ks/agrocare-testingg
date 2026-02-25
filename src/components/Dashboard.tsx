import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight, Camera, Calendar as CalendarIcon, Store, TrendingUp, TrendingDown, Minus, Info, PiggyBank, Upload, Loader2, MapPin, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TASKS } from '../constants';
import { FileUploader } from './FileUploader';
import { WeatherForecast } from './WeatherForecast';
import { getWeatherForecast, ForecastDay, getRealTimeWeather, WeatherData } from '../services/gemini';
import { Task, Language } from '../types';

interface DashboardProps {
  onNavigate: (screen: any) => void;
  onFileSelect: (file: File) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  language: Language;
  onToggleLanguage: () => void;
  onCameraOpen: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFileSelect, onAddTask, language, onToggleLanguage, onCameraOpen }) => {
  const [showUploader, setShowUploader] = useState(false);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const t = {
    en: {
      welcome: "Welcome back,",
      status: "Your farm is looking healthy today.",
      scan: "Scan Crop",
      scanDesc: "Detect diseases instantly",
      calendar: "My Calendar",
      suppliers: "Suppliers",
      activity: "Recent Activity",
      history: "History",
      impact: "Season Impact",
      saved: "Saved",
      pesticide: "Pesticide",
      water: "Water",
      locating: "Locating...",
    },
    hi: {
      welcome: "वापसी पर स्वागत है,",
      status: "आपका खेत आज स्वस्थ दिख रहा है।",
      scan: "फसल स्कैन करें",
      scanDesc: "बीमारियों का तुरंत पता लगाएं",
      calendar: "मेरा कैलेंडर",
      suppliers: "आपूर्तिकर्ता",
      activity: "हाल की गतिविधि",
      history: "इतिहास",
      impact: "सीजन का प्रभाव",
      saved: "बचत",
      pesticide: "कीटनाशक",
      water: "पानी",
      locating: "खोज रहे हैं...",
    },
    kn: {
      welcome: "ಮರಳಿ ಸ್ವಾಗತ,",
      status: "ನಿಮ್ಮ ತೋಟ ಇಂದು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿದೆ.",
      scan: "ಬೆಳೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
      scanDesc: "ರೋಗಗಳನ್ನು ತಕ್ಷಣ ಪತ್ತೆಹಚ್ಚಿ",
      calendar: "ನನ್ನ ಕ್ಯಾಲೆಂಡರ್",
      suppliers: "ಸರಬರಾಜುದಾರರು",
      activity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
      history: "ಇತಿಹಾಸ",
      impact: "ಋತುವಿನ ಪ್ರಭಾವ",
      saved: "ಉಳಿತಾಯ",
      pesticide: "ಕೀಟನಾಶಕ",
      water: "ನೀರು",
      locating: "ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
    }
  }[language];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const [forecastData, weatherData] = await Promise.all([
              getWeatherForecast(position.coords.latitude, position.coords.longitude),
              getRealTimeWeather(position.coords.latitude, position.coords.longitude)
            ]);
            setForecast(forecastData);
            setWeather(weatherData);
          } catch (error) {
            console.error("Weather fetch failed:", error);
          } finally {
            setForecastLoading(false);
            setWeatherLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation failed:", error);
          setForecastLoading(false);
          setWeatherLoading(false);
        }
      );
    } else {
      setForecastLoading(false);
      setWeatherLoading(false);
    }
  }, []);

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear')) return '☀️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('storm')) return '⛈️';
    return '☀️';
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-[#1B5E20] text-white p-6 pt-12 pb-16 rounded-b-[40px] shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#4CAF50] p-2.5 rounded-2xl shadow-inner border border-white/10 flex items-center justify-center">
              <Sprout size={32} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight leading-none">AgroCare AI</h1>
              <p className="text-[10px] text-green-200/80 font-bold uppercase tracking-widest mt-1">Precision Farming</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-black/20 backdrop-blur-md rounded-full p-1 flex items-center border border-white/10 relative w-32 h-8 cursor-pointer" onClick={onToggleLanguage}>
              <motion.div 
                className="absolute bg-white rounded-full h-6 w-10 shadow-sm"
                animate={{ x: language === 'en' ? 0 : language === 'hi' ? 42 : 84 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <button className={`relative z-10 flex-1 text-[10px] font-black transition-colors ${language === 'en' ? 'text-[#1B5E20]' : 'text-white'}`}>EN</button>
              <button className={`relative z-10 flex-1 text-[10px] font-black transition-colors ${language === 'hi' ? 'text-[#1B5E20]' : 'text-white'}`}>HI</button>
              <button className={`relative z-10 flex-1 text-[10px] font-black transition-colors ${language === 'kn' ? 'text-[#1B5E20]' : 'text-white'}`}>KN</button>
            </div>
            <button className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors">
              <Bell size={24} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1B5E20]"></span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="mt-4">
            <h2 className="text-3xl font-black tracking-tight">{t.welcome}</h2>
            <p className="text-green-100/80 font-bold">{t.status}</p>
            
            {weatherLoading ? (
              <div className="flex items-center gap-2 mt-4 opacity-70">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">{t.locating}</span>
              </div>
            ) : (
              <p className="text-green-100 text-sm font-bold mt-3 flex items-center gap-1 opacity-90">
                <MapPin size={14} /> {weather ? weather.location : 'Magadi, Karnataka'}
              </p>
            )}
          </div>

          {!weatherLoading && weather && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black tracking-tighter">{Math.round(weather.temp)}°C</span>
                <span className="text-3xl drop-shadow-md">{getWeatherIcon(weather.condition)}</span>
              </div>
              <div className="flex gap-3 text-right">
                <div className="flex flex-col items-center">
                  <span className="text-green-200/60 text-[7px] font-black uppercase tracking-wider">Hum</span>
                  <span className="text-xs font-black">{weather.humidity}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-green-200/60 text-[7px] font-black uppercase tracking-wider">Rain</span>
                  <span className="text-xs font-black">{weather.rain}mm</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-green-200/60 text-[7px] font-black uppercase tracking-wider">Wind</span>
                  <span className="text-xs font-black">{weather.wind}k/h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 -mt-10 relative z-20">
        {/* Scan Section */}
        <div className="px-5 mb-8">
          <AnimatePresence mode="wait">
            {!showUploader ? (
              <motion.div
                key="scan-options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[32px] p-2 flex flex-col gap-2 shadow-2xl shadow-green-900/10 border border-gray-100"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onCameraOpen}
                  className="bg-[#2E7D32] rounded-[28px] p-6 flex items-center justify-between group relative overflow-hidden"
                >
                  <div className="flex flex-col items-start text-left relative z-10">
                    <span className="text-white font-black text-2xl tracking-tight">{t.scan}</span>
                    <span className="text-green-50 text-xs font-medium mt-1 opacity-90">Open AI Camera</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 h-16 w-16 flex items-center justify-center shadow-xl relative z-10">
                    <Camera className="text-[#2E7D32]" size={32} />
                  </div>
                </motion.button>
                <button 
                  onClick={() => setShowUploader(true)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-gray-500 font-bold text-sm hover:text-primary transition-colors"
                >
                  <Upload size={18} />
                  Upload from Gallery
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[32px] shadow-2xl border-[6px] border-white overflow-hidden"
              >
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-earth text-lg">Upload Crop Photo</h3>
                  <button 
                    onClick={() => setShowUploader(false)}
                    className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-earth transition-colors"
                  >
                    <ChevronRight size={20} className="rotate-90" />
                  </button>
                </div>
                <div className="p-2">
                  <FileUploader onFileSelect={onFileSelect} onCameraOpen={onCameraOpen} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-5 px-5 mb-10">
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('calendar')}
            className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col items-center justify-center gap-3 active:bg-gray-50 border border-gray-100/50 group transition-all"
          >
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <CalendarIcon size={32} />
            </div>
            <span className="font-bold text-earth text-lg">{t.calendar}</span>
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('suppliers')}
            className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col items-center justify-center gap-3 active:bg-gray-50 border border-gray-100/50 group transition-all"
          >
            <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
              <Store size={32} />
            </div>
            <span className="font-bold text-earth text-lg">{t.suppliers}</span>
          </motion.button>
        </div>

        {/* Weather Forecast */}
        <WeatherForecast 
          forecast={forecast} 
          loading={forecastLoading} 
          onAddTask={onAddTask}
        />

        {/* Recent Scans */}
        <section className="mb-10">
          <div className="flex justify-between items-center px-6 mb-5">
            <h2 className="text-xl font-black text-earth tracking-tight">{t.activity}</h2>
            <button className="text-[#2E7D32] text-xs font-black uppercase tracking-widest flex items-center hover:opacity-70 transition-opacity">
              {t.history} <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-6 px-6 pb-6 hide-scrollbar">
            {[
              { crop: 'Tomato', disease: 'Late Blight', status: 'Critical', color: 'red', date: '2h ago' },
              { crop: 'Corn', disease: 'Healthy', status: 'Optimal', color: 'green', date: '5h ago' },
              { crop: 'Potato', disease: 'Early Blight', status: 'Warning', color: 'orange', date: '1d ago' },
            ].map((scan, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                whileHover={{ y: -8 }}
                className="min-w-[220px] bg-white rounded-[32px] overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 relative flex-shrink-0 transition-all"
              >
                <div className="h-40 bg-gray-100 relative group overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=400&q=80&sig=${i}`} 
                    alt={scan.crop} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-black border flex items-center gap-1 shadow-lg backdrop-blur-md ${
                    scan.color === 'red' ? 'bg-red-500/90 text-white border-red-400' : 
                    scan.color === 'green' ? 'bg-green-500/90 text-white border-green-400' : 
                    'bg-orange-500/90 text-white border-orange-400'
                  }`}>
                    {scan.status.toUpperCase()}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-lg text-earth leading-tight">{scan.crop}</p>
                      <p className={`text-xs font-bold mt-1 ${scan.color === 'red' ? 'text-red-600' : scan.color === 'green' ? 'text-green-600' : 'text-orange-600'}`}>{scan.disease}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{scan.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Impact Summary */}
        <section className="px-5 mb-12">
          <div className="bg-[#1B5E20] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-green-900/40">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <PiggyBank className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-green-200/80">{t.impact}</h2>
                  <p className="text-2xl font-black">₹1,090 {t.saved}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-3xl p-4 backdrop-blur-sm border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-200/60 mb-1">{t.pesticide}</p>
                  <p className="text-xl font-black">2.4L <span className="text-xs font-bold text-green-200/80">{t.saved}</span></p>
                </div>
                <div className="bg-white/10 rounded-3xl p-4 backdrop-blur-sm border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-200/60 mb-1">{t.water}</p>
                  <p className="text-xl font-black">120L <span className="text-xs font-bold text-green-200/80">{t.saved}</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
