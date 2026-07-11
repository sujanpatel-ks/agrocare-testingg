import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Camera, Upload, Calendar as CalendarIcon, Store, X, Sprout, Users, TrendingUp, Beaker, Landmark, CloudRain, Sun, Wind, Droplets, RefreshCw, Loader2, Info, CheckCircle, AlertTriangle, AlertCircle, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUploader } from './FileUploader';
import { LanguageSelector } from './LanguageSelector';
import { Language } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTranslation } from 'react-i18next';

import { Task, Screen } from '../types';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  onFileSelect: (file: File) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'completed'>) => void;
  language: Language;
  onToggleLanguage: (lang?: Language) => void;
  onCameraOpen: () => void;
}

interface WeatherSummaryData {
  temperature: number;
  humidity: number;
  rainVolume: number;
  rainProbability: number;
  maxRainProbability: number;
  windSpeed: number;
  weatherCode: number;
  summary: string;
  advice: string[];
  farmingIndex: 'Favorable' | 'Caution Required' | 'Hazardous';
}

const tWeather = {
  en: {
    weatherTitle: "Real-Time Weather Summary",
    subtitle: "Precision Farm Forecast",
    temperature: "Temperature",
    rainProbability: "Rain Probability",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    farmingAdvice: "AgroCare Smart Advice",
    farmingIndex: "Farming Index",
    favorable: "Favorable",
    caution: "Caution Required",
    hazardous: "Hazardous",
    fetching: "Updating local farm forecast...",
    noLocation: "Please enable location services for precise localized farming advice.",
    retry: "Refresh Weather",
    todayMax: "Today's Max",
    cropsProfile: "Profile Context"
  },
  hi: {
    weatherTitle: "वास्तविक समय मौसम सारांश",
    subtitle: "सटीक कृषि पूर्वानुमान",
    temperature: "तापमान",
    rainProbability: "बारिश की संभावना",
    humidity: "आर्द्रता (नमी)",
    windSpeed: "हवा की गति",
    farmingAdvice: "कृषि-सलाह और मार्गदर्शन",
    farmingIndex: "खेती सूचकांक",
    favorable: "अनुकूल",
    caution: "सावधानी आवश्यक",
    hazardous: "जोखिम भरा",
    fetching: "स्थानीय मौसम अपडेट किया जा रहा है...",
    noLocation: "सटीक स्थानीय कृषि सलाह के लिए स्थान सेवाओं को सक्षम करें।",
    retry: "मौसम रीफ्रेश करें",
    todayMax: "आज की अधिकतम",
    cropsProfile: "प्रोफाइल संदर्भ"
  },
  kn: {
    weatherTitle: "ನೈಜ-ಸಮಯದ ಹವಾಮಾನ ಸಾರಾಂಶ",
    subtitle: "ನಿಖರ ಕೃಷಿ ಮುನ್ಸೂಚನೆ",
    temperature: "ತಾಪಮಾನ",
    rainProbability: "ಮಳೆಯ ಸಾಧ್ಯತೆ",
    humidity: "ಆರ್ದ್ರತೆ (ತೇವಾಂಶ)",
    windSpeed: "ಗಾಳಿಯ ವೇಗ",
    farmingAdvice: "ಕೃಷಿ ತಜ್ಞರ ಜಾಣ ಸಲಹೆ",
    farmingIndex: "ಕೃಷಿ ಸೂಚ್ಯಂಕ",
    favorable: "ಅನುಕೂಲಕರ",
    caution: "ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ",
    hazardous: "ಅಪಾಯಕಾರಿ",
    fetching: "ಸ್ಥಳೀಯ ಹವಾಮಾನ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    noLocation: "ನಿಖರವಾದ ಸ್ಥಳೀಯ ಕೃಷಿ ಸಲಹೆಗಾಗಿ ದಯವಿಟ್ಟು ಜಿಪಿಎಸ್ ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    retry: "ಹವಾಮಾನ ಮರುಲೋಡ್ ಮಾಡಿ",
    todayMax: "ಇಂದಿನ ಗರಿಷ್ಠ",
    cropsProfile: "ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ"
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFileSelect, onAddTask, language, onToggleLanguage, onCameraOpen }) => {
  const [showUploader, setShowUploader] = useState(false);
  const { latitude, longitude, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<{ temp: number, condition: string, icon: React.ReactNode } | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummaryData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const { t } = useTranslation();

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

      // Fetch Real-time Weather Summary
      setWeatherLoading(true);
      fetch('/api/weather-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude,
          longitude,
          language
        })
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch weather summary");
          return res.json();
        })
        .then((data: WeatherSummaryData) => {
          setWeatherSummary(data);
          
          let conditionStr = 'Clear';
          if (data.rainProbability > 50) conditionStr = 'Rainy';
          else if (data.humidity > 80) conditionStr = 'Humid';
          else if (data.weatherCode >= 1 && data.weatherCode <= 3) conditionStr = 'Partly Cloudy';
          
          let iconComponent = <Sun size={20} className="text-yellow-300 animate-pulse" />;
          if (data.rainProbability > 50) iconComponent = <CloudRain size={20} className="text-blue-300" />;
          else if (data.weatherCode >= 1 && data.weatherCode <= 3) iconComponent = <Wind size={20} className="text-gray-300" />;

          setWeatherData({
            temp: Math.round(data.temperature),
            condition: conditionStr,
            icon: iconComponent
          });
        })
        .catch(err => {
          console.error("Error loading weather summary:", err);
        })
        .finally(() => {
          setWeatherLoading(false);
        });
    }
  }, [latitude, longitude, language]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Header Section */}
      <div className="bg-primary-dark pt-20 pb-24 px-6 rounded-b-[40px] text-white">
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
              {locationLoading ? 'Locating...' : locationError ? 'Location Error' : locationName || t('dashboard.location')}
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
      <motion.main 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="px-6 -mt-16 space-y-6 relative z-10"
      >
        {/* Crop Health Status */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('agro.cropHealth')}</p>
              <h3 className="text-lg font-black text-earth">Good</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-green-600 uppercase">Optimal</span>
          </div>
        </motion.div>

        {/* Real-Time Weather Summary Component */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-earth tracking-tight">
                  {tWeather[language]?.weatherTitle || tWeather.en.weatherTitle}
                </h3>
                {weatherLoading && (
                  <Loader2 size={16} className="text-primary animate-spin" />
                )}
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {tWeather[language]?.subtitle || tWeather.en.subtitle}
              </p>
            </div>

            {weatherSummary && (
              <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                weatherSummary.farmingIndex === 'Favorable'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : weatherSummary.farmingIndex === 'Caution Required'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {weatherSummary.farmingIndex === 'Favorable' ? (
                  <CheckCircle size={14} className="text-green-600" />
                ) : weatherSummary.farmingIndex === 'Caution Required' ? (
                  <AlertTriangle size={14} className="text-amber-600" />
                ) : (
                  <AlertCircle size={14} className="text-red-600" />
                )}
                <span>
                  {weatherSummary.farmingIndex === 'Favorable'
                    ? (tWeather[language]?.favorable || tWeather.en.favorable)
                    : weatherSummary.farmingIndex === 'Caution Required'
                      ? (tWeather[language]?.caution || tWeather.en.caution)
                      : (tWeather[language]?.hazardous || tWeather.en.hazardous)}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          {(!latitude || !longitude) ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-3 border border-amber-100">
                <MapPin size={24} />
              </div>
              <p className="text-sm font-bold text-gray-500 max-w-sm mb-4">
                {locationLoading 
                  ? (tWeather[language]?.fetching || tWeather.en.fetching)
                  : (tWeather[language]?.noLocation || tWeather.en.noLocation)}
              </p>
              <button 
                onClick={requestLocation}
                disabled={locationLoading}
                className="flex items-center gap-2 bg-primary text-white text-xs font-black px-5 py-3 rounded-2xl shadow-md hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                {locationLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                <span>{tWeather[language]?.retry || tWeather.en.retry}</span>
              </button>
            </div>
          ) : weatherLoading && !weatherSummary ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-2xl"></div>
                ))}
              </div>
              <div className="h-16 bg-gray-100 rounded-2xl"></div>
            </div>
          ) : weatherSummary ? (
            <div className="space-y-6 animate-fade-in">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Temp */}
                <div className="bg-gray-50/70 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {tWeather[language]?.temperature || tWeather.en.temperature}
                    </span>
                    <Thermometer className="text-red-500" size={16} />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-earth">{Math.round(weatherSummary.temperature)}°C</span>
                  </div>
                </div>

                {/* Rain Probability */}
                <div className="bg-gray-50/70 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {tWeather[language]?.rainProbability || tWeather.en.rainProbability}
                    </span>
                    <CloudRain className="text-blue-500" size={16} />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-earth">{weatherSummary.rainProbability}%</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      {tWeather[language]?.todayMax || tWeather.en.todayMax}: {weatherSummary.maxRainProbability}%
                    </p>
                  </div>
                </div>

                {/* Humidity */}
                <div className="bg-gray-50/70 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {tWeather[language]?.humidity || tWeather.en.humidity}
                    </span>
                    <Droplets className="text-teal-500" size={16} />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-earth">{weatherSummary.humidity}%</span>
                    {weatherSummary.rainVolume > 0 && (
                      <p className="text-[10px] text-teal-600 font-bold mt-1">
                        Rain: {weatherSummary.rainVolume} mm
                      </p>
                    )}
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-gray-50/70 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between transition-colors shadow-sm">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {tWeather[language]?.windSpeed || tWeather.en.windSpeed}
                    </span>
                    <Wind className="text-blue-400" size={16} />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-earth">{weatherSummary.windSpeed} km/h</span>
                  </div>
                </div>
              </div>

              {/* Summary Paragraph */}
              <div className="bg-green-50/40 border border-green-100/50 rounded-2xl p-4">
                <p className="text-xs text-green-900 font-medium leading-relaxed">
                  {weatherSummary.summary}
                </p>
              </div>

              {/* Actionable Advice List */}
              {weatherSummary.advice && weatherSummary.advice.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-earth uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={14} className="text-primary" />
                    <span>{tWeather[language]?.farmingAdvice || tWeather.en.farmingAdvice}</span>
                  </h4>
                  <div className="grid gap-2.5">
                    {weatherSummary.advice.map((item, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start bg-gray-50/55 p-3 rounded-xl border border-gray-100/50">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        <p className="text-xs text-[#455A64] font-semibold leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retry button to refresh manually */}
              <div className="flex justify-end pt-1">
                <button 
                  onClick={requestLocation}
                  disabled={weatherLoading}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw size={10} className={`${weatherLoading ? 'animate-spin' : ''}`} />
                  <span>{tWeather[language]?.retry || tWeather.en.retry}</span>
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Scan Card */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          className="bg-white p-3 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100"
        >
          <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-[24px] p-6 flex justify-between items-center text-white shadow-inner">
            <div>
              <h2 className="text-3xl font-black mb-1">{t('dashboard.scan')}</h2>
              <p className="text-sm font-bold text-green-100">{t('dashboard.scanDesc')}</p>
            </div>
            <button onClick={onCameraOpen} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#2E7D32] shadow-inner active:scale-95 transition-transform">
              <Camera size={32} strokeWidth={2.5} />
            </button>
          </div>
          <button onClick={() => setShowUploader(true)} className="w-full py-4 mt-2 flex items-center justify-center gap-2 text-[#455A64] font-bold active:bg-gray-50 rounded-2xl transition-colors">
            <Upload size={20} />
            {t('dashboard.upload')}
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <button onClick={() => onNavigate('calendar')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
              <CalendarIcon size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.calendar')}</span>
          </button>
          <button onClick={() => onNavigate('suppliers')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <Store size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.suppliers')}</span>
          </button>
          <button onClick={() => onNavigate('community')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
              <Users size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.community')}</span>
          </button>
          <button onClick={() => onNavigate('market')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
              <TrendingUp size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.market')}</span>
          </button>
          <button onClick={() => onNavigate('soil-analysis')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Beaker size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.soil')}</span>
          </button>
          <button onClick={() => onNavigate('scheme-finder')} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
              <Landmark size={32} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#455A64]">{t('nav.schemes')}</span>
          </button>
        </motion.div>

        {/* Quick Chat Input */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-200 relative overflow-hidden"
        >
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
        </motion.div>

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
      </motion.main>
    </div>
  );
};
