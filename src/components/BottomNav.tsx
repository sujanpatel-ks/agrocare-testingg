import React from 'react';
import { Sprout, TrendingUp, MessageSquare, User, Scan } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen, Language } from '../types';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onScreenChange, language }) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Sprout },
    { id: 'market', label: t('nav.market'), icon: TrendingUp },
    { id: 'scan', label: t('nav.scan'), icon: Scan, isCenter: true },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none md:top-0 md:bottom-auto md:w-24 md:h-screen">
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 pb-8 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-[32px] pointer-events-auto relative md:h-full md:rounded-none md:border-t-0 md:border-r md:px-4 md:py-8 md:flex md:flex-col md:shadow-[10px_0_40px_rgba(0,0,0,0.08)]">
        <div className="flex justify-between items-center relative z-10 md:flex-col md:h-full md:justify-start md:gap-12">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            if (item.isCenter) {
              return (
                <div key={item.id} className="relative flex flex-col items-center justify-center -mt-12 md:mt-0 md:mb-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onScreenChange('scan')}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-[0_8px_30px_rgba(46,125,50,0.4)] border-4 border-white z-20"
                  >
                    <Icon size={28} strokeWidth={2.5} />
                  </motion.button>
                  <span className="text-[10px] font-bold text-primary mt-1.5 hidden md:block">{item.label}</span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id as Screen)}
                className={`flex flex-col items-center justify-center gap-1.5 w-12 transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-full scale-150"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                  )}
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                  />
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? 'font-bold opacity-100' : 'font-medium opacity-70'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
