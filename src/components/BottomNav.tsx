import React from 'react';
import { Home, Store, Users, Calendar, User, Camera, MessageSquare, History } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen, Language } from '../types';

interface BottomNavProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onScreenChange, language }) => {
  const labels = {
    en: { home: 'Home', market: 'Market', scan: 'Scan', community: 'Community', profile: 'Profile' },
    hi: { home: 'होम', market: 'बाजार', scan: 'स्कैन', community: 'समुदाय', profile: 'प्रोफ़ाइल' },
    kn: { home: 'ಮನೆ', market: 'ಮಾರುಕಟ್ಟೆ', scan: 'ಸ್ಕ್ಯಾನ್', community: 'ಸಮುದಾಯ', profile: 'ಪ್ರೊಫೈಲ್' }
  }[language];

  const navItems = [
    { id: 'home', label: labels.home, icon: Home },
    { id: 'market', label: labels.market, icon: Store },
    { id: 'scan', label: labels.scan, icon: Camera, isCenter: true },
    { id: 'community', label: labels.community, icon: Users },
    { id: 'profile', label: labels.profile, icon: User },
  ];

  // Map internal IDs to the screens we have
  const getScreenId = (id: string): Screen => {
    return id as Screen;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 pb-8 pt-3 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-end">
        {navItems.map((item) => {
          const Icon = item.icon;
          const screenId = getScreenId(item.id);
          const isActive = activeScreen === screenId;

          if (item.isCenter) {
            return (
              <div key={item.id} className="relative -top-6">
                <button
                  onClick={() => onScreenChange('scan')}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-lg shadow-primary/40 hover:scale-105 transition-transform border-4 border-white"
                >
                  <Icon size={32} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(screenId)}
              className={`flex flex-col items-center justify-end gap-1 transition-colors relative ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-primary-light'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <div className={`flex h-6 items-center justify-center transition-transform ${isActive ? '-translate-y-1' : ''}`}>
                <Icon size={24} fill={isActive ? 'currentColor' : 'none'} />
              </div>
              <p className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
