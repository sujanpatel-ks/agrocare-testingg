import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Calendar as CalendarIcon, ChevronRight, Droplets, Bug, Sprout, Camera, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TASKS, RECOMMENDED_CROPS } from '../constants';
import { Task, Language } from '../types';
import { getRealTimeWeather, WeatherData } from '../services/gemini';

interface CalendarProps {
  onBack: () => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  language: Language;
}

export const Calendar: React.FC<CalendarProps> = ({ onBack, tasks, onToggleTask, language }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await getRealTimeWeather(position.coords.latitude, position.coords.longitude);
            setWeather(data);
          } catch (error) {
            console.error("Weather fetch failed:", error);
          } finally {
            setWeatherLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation failed:", error);
          setWeatherLoading(false);
        }
      );
    } else {
      setWeatherLoading(false);
    }
  }, []);

  const currentMonth = new Date().toLocaleString('default', { month: 'short' });
  const months = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    months.push({
      name: d.toLocaleString('default', { month: 'short' }),
      day: String(d.getDate()).padStart(2, '0')
    });
  }

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('sun') || c.includes('clear')) return '☀️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('storm')) return '⛈️';
    return '☀️';
  };

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto overflow-x-hidden shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="bg-[#E8F5E9] p-2.5 rounded-2xl text-[#1B5E20] shadow-sm">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-earth">AgroCare AI</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Smart Farming Assistant</p>
          </div>
        </div>
        <button className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 text-earth hover:bg-gray-100 transition-colors border border-gray-100 shadow-sm">
          <Bell size={22} />
        </button>
      </header>

      {/* Weather Widget */}
      <div className="px-5 py-2">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border-[6px] border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-50 to-transparent opacity-50"></div>
          
          {weatherLoading ? (
            <div className="flex items-center justify-center py-4 gap-3">
              <Loader2 className="animate-spin text-[#1B5E20]" size={24} />
              <span className="text-sm font-bold text-gray-400">Updating weather...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                  {weather ? weather.location : 'Pune, India'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-earth tracking-tighter">
                    {weather ? Math.round(weather.temp) : '28'}°C
                  </span>
                  <span className="text-sm font-bold text-gray-400">
                    {weather ? weather.condition : 'Sunny'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className="text-5xl drop-shadow-md">
                  {weather ? getWeatherIcon(weather.condition) : '☀️'}
                </span>
                <span className="text-[10px] font-black text-[#1B5E20] bg-[#E8F5E9] px-3 py-1.5 rounded-full border border-[#A5D6A7] shadow-sm uppercase tracking-wider">
                  Good for Sowing
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Month Selector */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-earth tracking-tight">
            Select Month <span className="text-sm font-bold text-gray-400 ml-1">/ {language === 'hi' ? 'महीना चुनें' : language === 'kn' ? 'ತಿಂಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Month'}</span>
          </h2>
          <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
            <CalendarIcon size={20} />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {months.map((m, i) => (
            <button 
              key={m.name}
              className={`flex flex-col items-center justify-center min-w-[4.5rem] h-20 rounded-[24px] border-2 transition-all shrink-0 ${
                m.name === currentMonth 
                  ? 'bg-[#1B5E20] text-white border-[#1B5E20] shadow-xl shadow-green-900/20 scale-105' 
                  : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${m.name === currentMonth ? 'text-green-200' : 'text-gray-400'}`}>{m.name}</span>
              <span className={`text-xl font-black ${m.name === currentMonth ? 'text-white' : 'text-gray-300'}`}>{m.day}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Crops */}
      <div className="px-5 pb-6">
        <h2 className="text-lg font-black text-earth tracking-tight mb-4">
          Recommended Crops <span className="block text-sm font-bold text-gray-400 tracking-normal">{language === 'hi' ? 'इस महीने के लिए सर्वश्रेष्ठ फसलें' : language === 'kn' ? 'ಈ ತಿಂಗಳ ಅತ್ಯುತ್ತಮ ಬೆಳೆಗಳು' : 'Best crops for this month'}</span>
        </h2>
        <div className="flex flex-col gap-4">
          {RECOMMENDED_CROPS.map((crop, index) => (
            <motion.div 
              key={crop.id} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-center bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`absolute right-0 top-0 w-32 h-full bg-gradient-to-l ${crop.color === 'orange' ? 'from-orange-50' : 'from-yellow-50'} to-transparent opacity-60`}></div>
              <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shrink-0 shadow-inner ${crop.color === 'orange' ? 'bg-orange-100' : 'bg-yellow-100'}`}>
                <span className="text-3xl">{crop.icon}</span>
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-earth leading-tight">
                      {crop.name} 
                      <span className="text-xs font-bold text-gray-400 ml-1">
                        ({language === 'hi' ? crop.nameHi : language === 'kn' ? crop.nameKn : crop.name})
                      </span>
                    </h3>
                    <p className={`text-[10px] font-black uppercase tracking-wider mt-1.5 px-2 py-0.5 rounded-md inline-block ${crop.color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'}`}>{crop.status}</p>
                  </div>
                  <ChevronRight className="text-gray-300" size={20} />
                </div>
                <div className="flex gap-6 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Planting</span>
                    <span className="text-xs font-black text-earth mt-0.5">{crop.planting}</span>
                  </div>
                  <div className="w-px bg-gray-100 h-8"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Harvest</span>
                    <span className="text-xs font-black text-earth mt-0.5">{crop.harvest}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="px-5 pb-32 flex-1">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-lg font-black text-earth tracking-tight">
            Tasks for Today <span className="block text-sm font-bold text-gray-400 tracking-normal">{language === 'hi' ? 'आज के कार्य' : language === 'kn' ? 'ಇಂದಿನ ಕೆಲಸಗಳು' : "Today's tasks"}</span>
          </h2>
          <button className="text-xs font-black text-[#1B5E20] hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.label 
                layout
                key={task.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-start p-5 rounded-[28px] border transition-all cursor-pointer hover:bg-gray-50 group ${task.urgent ? 'border-l-[6px] border-l-red-500 bg-red-50/30' : 'border-gray-100 bg-white shadow-sm'}`}
              >
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="w-6 h-6 rounded-lg border-2 border-gray-200 text-[#1B5E20] focus:ring-[#1B5E20] transition-all cursor-pointer"
                  />
                  {task.completed && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute pointer-events-none"
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </motion.div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`p-2 rounded-xl shadow-sm transition-transform group-active:scale-90 ${
                      task.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                      task.color === 'red' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {task.icon === 'Droplets' ? <Droplets size={18} /> : 
                       task.icon === 'Bug' ? <Bug size={18} /> : 
                       task.icon === 'ShieldCheck' ? <Info size={18} /> : <Sprout size={18} />}
                    </div>
                    <span className={`text-base font-black text-earth tracking-tight transition-all ${task.completed ? 'line-through opacity-40' : ''}`}>
                      {language === 'hi' ? task.titleHi : language === 'kn' ? task.titleKn : task.title}
                    </span>
                  </div>
                  <p className={`text-xs text-gray-500 leading-relaxed transition-all ${task.completed ? 'opacity-40' : ''}`}>{task.description}</p>
                </div>
                {task.urgent && !task.completed && (
                  <motion.span 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest self-start shadow-sm"
                  >
                    Urgent
                  </motion.span>
                )}
              </motion.label>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
