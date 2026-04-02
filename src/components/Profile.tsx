import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, MapPin, Edit3, Globe, Save, X, Camera, MessageSquare, Award, Star, Phone, Droplets, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';

interface ProfileProps {
  onBack: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

const INITIAL_DATA = {
  name: 'Ramesh Kumar',
  address: 'Karnataka, India',
  phone: '+91 98765 43210',
  size: '5 Acres',
  crops: 'Tomato, Corn, Potato',
  soilType: 'Red Loamy',
  irrigation: 'Drip Irrigation'
};

export const Profile: React.FC<ProfileProps> = ({ onBack, language, onToggleLanguage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [savedData, setSavedData] = useState(INITIAL_DATA);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const storedData = localStorage.getItem('agrocare_profile');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setSavedData(parsedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('agrocare_profile', JSON.stringify(formData));
      setSavedData(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditing(false);
  };

  const t = {
    en: {
      profile: 'Profile',
      editProfile: 'Edit Profile',
      farmDetails: 'Farm Details',
      location: 'Location',
      phone: 'Phone Number',
      farmSize: 'Farm Size',
      primaryCrops: 'Primary Crops',
      soilType: 'Soil Type',
      irrigation: 'Irrigation',
      settings: 'Settings',
      language: 'Language',
      notifications: 'Notifications',
      privacy: 'Privacy & Security',
      help: 'Help & Support',
      logout: 'Log Out',
      save: 'Save Changes',
      cancel: 'Cancel',
      currentLang: 'English',
      upgradeTitle: 'AgroCare Premium',
      upgradeDesc: 'Get advanced weather forecasts and unlimited AI scans.',
      upgradeBtn: 'Upgrade'
    },
    hi: {
      profile: 'प्रोफ़ाइल',
      editProfile: 'प्रोफ़ाइल संपादित करें',
      farmDetails: 'खेत का विवरण',
      location: 'स्थान',
      phone: 'फ़ोन नंबर',
      farmSize: 'खेत का आकार',
      primaryCrops: 'मुख्य फसलें',
      soilType: 'मिट्टी का प्रकार',
      irrigation: 'सिंचाई',
      settings: 'सेटिंग्स',
      language: 'भाषा',
      notifications: 'सूचनाएं',
      privacy: 'गोपनीयता और सुरक्षा',
      help: 'मदद और समर्थन',
      logout: 'लॉग आउट',
      save: 'परिवर्तन सहेजें',
      cancel: 'रद्द करें',
      currentLang: 'हिंदी',
      upgradeTitle: 'एग्रोकेयर प्रीमियम',
      upgradeDesc: 'उन्नत मौसम पूर्वानुमान और असीमित एआई स्कैन प्राप्त करें।',
      upgradeBtn: 'अपग्रेड करें'
    },
    kn: {
      profile: 'ಪ್ರೊಫೈಲ್',
      editProfile: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
      farmDetails: 'ಕೃಷಿ ವಿವರಗಳು',
      location: 'ಸ್ಥಳ',
      phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
      farmSize: 'ಕೃಷಿ ಗಾತ್ರ',
      primaryCrops: 'ಮುಖ್ಯ ಬೆಳೆಗಳು',
      soilType: 'ಮಣ್ಣಿನ ಪ್ರಕಾರ',
      irrigation: 'ನೀರಾವರಿ',
      settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      language: 'ಭಾಷೆ',
      notifications: 'ಅಧಿಸೂಚನೆಗಳು',
      privacy: 'ಗೌಪ್ಯತೆ ಮತ್ತು ಭದ್ರತೆ',
      help: 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
      logout: 'ಲಾಗ್ ಔಟ್',
      save: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
      currentLang: 'ಕನ್ನಡ',
      upgradeTitle: 'ಆಗ್ರೋಕೇರ್ ಪ್ರೀಮಿಯಂ',
      upgradeDesc: 'ಸುಧಾರಿತ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಳು ಮತ್ತು ಅನಿಯಮಿತ AI ಸ್ಕ್ಯಾನ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ.',
      upgradeBtn: 'ಅಪ್‌ಗ್ರೇಡ್ ಮಾಡಿ'
    }
  }[language];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA] max-w-md mx-auto relative">
      {/* 
        Header Section
        Using shrink-0 and compact padding to prevent overlap with the main content.
      */}
      <header className="bg-primary-dark text-white px-5 pt-6 pb-5 rounded-b-[24px] shadow-lg z-10 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg tracking-wide">{isEditing ? t.editProfile : t.profile}</h1>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition backdrop-blur-sm shrink-0"
            >
              <Edit3 size={16} />
            </button>
          ) : (
            <div className="w-8"></div>
          )}
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary-dark font-bold text-2xl border-2 border-green-400 overflow-hidden shadow-inner shrink-0 relative">
            <User size={32} />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
              <Star size={10} className="fill-white text-white" />
            </div>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-1.5">
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border-b border-green-400 bg-transparent text-white placeholder-white/50 px-1 py-0.5 text-base font-bold focus:outline-none focus:border-white transition-colors"
                  placeholder="Your Name"
                />
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-green-200 shrink-0" />
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full border-b border-green-400 bg-transparent text-green-50 placeholder-green-200/50 px-1 py-0.5 text-xs focus:outline-none focus:border-white transition-colors"
                      placeholder="Your Location"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-green-200 shrink-0" />
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border-b border-green-400 bg-transparent text-green-50 placeholder-green-200/50 px-1 py-0.5 text-xs focus:outline-none focus:border-white transition-colors"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black leading-tight flex items-center gap-2 mb-1">
                  {savedData.name}
                </h2>
                <div className="flex flex-col gap-0.5">
                  <p className="text-green-50 text-xs flex items-center gap-1.5 font-medium">
                    <MapPin size={12} className="text-green-300" /> {savedData.address}
                  </p>
                  <p className="text-green-50 text-xs flex items-center gap-1.5 font-medium">
                    <Phone size={12} className="text-green-300" /> {savedData.phone}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 
        Main Content Section
        Reduced padding and spacing to make better use of whitespace and prevent overlap.
      */}
      <main className="flex-1 overflow-y-auto overscroll-contain pb-24 px-4 pt-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Stats Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
              <Camera size={20} />
            </div>
            <span className="text-xl font-black text-earth">24</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Scans</span>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <MessageSquare size={20} />
            </div>
            <span className="text-xl font-black text-earth">12</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Posts</span>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
              <Award size={20} />
            </div>
            <span className="text-xl font-black text-earth">Pro</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Status</span>
          </motion.div>
        </motion.section>

        {/* Upgrade Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={18} className="fill-white" />
                  <h3 className="font-black text-lg tracking-tight">{t.upgradeTitle}</h3>
                </div>
                <p className="text-white/90 text-xs font-medium leading-relaxed">{t.upgradeDesc}</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} className="bg-white text-orange-600 px-4 py-2.5 rounded-xl font-black text-xs shadow-sm hover:bg-orange-50 transition-colors shrink-0">
                {t.upgradeBtn}
              </motion.button>
            </div>
          </motion.div>
        </motion.section>

        {/* Farm Details */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{t.farmDetails}</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <div className="bg-green-50 p-2 rounded-xl text-green-600"><Sprout size={18} /></div>
                <span className="text-sm">{t.farmSize}</span>
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="text-right font-bold text-earth bg-transparent border-b border-green-500 px-1 py-0.5 w-24 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              ) : (
                <span className="font-bold text-earth text-base">{savedData.size}</span>
              )}
            </div>
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Globe size={18} /></div>
                <span className="text-sm">{t.soilType}</span>
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  name="soilType"
                  value={formData.soilType}
                  onChange={handleChange}
                  className="text-right font-bold text-earth bg-transparent border-b border-green-500 px-1 py-0.5 w-24 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              ) : (
                <span className="font-bold text-earth text-base">{savedData.soilType}</span>
              )}
            </div>
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Droplets size={18} /></div>
                <span className="text-sm">{t.irrigation}</span>
              </div>
              {isEditing ? (
                <input 
                  type="text" 
                  name="irrigation"
                  value={formData.irrigation}
                  onChange={handleChange}
                  className="text-right font-bold text-earth bg-transparent border-b border-green-500 px-1 py-0.5 w-24 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              ) : (
                <span className="font-bold text-earth text-base">{savedData.irrigation}</span>
              )}
            </div>
            <div className="p-4 flex justify-between items-center">
              <span className="text-gray-600 font-medium text-sm pl-12">{t.primaryCrops}</span>
              {isEditing ? (
                <input 
                  type="text" 
                  name="crops"
                  value={formData.crops}
                  onChange={handleChange}
                  className="text-right font-bold text-earth bg-transparent border-b border-green-500 px-1 py-0.5 w-32 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              ) : (
                <span className="font-bold text-earth text-base text-right">{savedData.crops}</span>
              )}
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 pt-2 overflow-hidden"
            >
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm"
              >
                <X size={18} />
                {t.cancel}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary-dark transition text-sm"
              >
                <Save size={18} />
                {t.save}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">{t.settings}</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="w-full p-4 border-b border-gray-50 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                    <Globe size={18} />
                  </div>
                  <span className="font-medium text-sm">{t.language}</span>
                </div>
                <span className="text-sm font-bold text-primary">{t.currentLang}</span>
              </div>
              <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                <button 
                  onClick={() => language !== 'en' && onToggleLanguage()}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => language !== 'hi' && onToggleLanguage()}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'hi' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  हिंदी
                </button>
                <button 
                  onClick={() => language !== 'kn' && onToggleLanguage()}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${language === 'kn' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>
            
            <motion.button whileTap={{ scale: 0.98, backgroundColor: '#f9fafb' }} className="w-full p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                  <Bell size={18} />
                </div>
                <span className="font-medium text-sm">{t.notifications}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </motion.button>
            
            <motion.button whileTap={{ scale: 0.98, backgroundColor: '#f9fafb' }} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-green-50 p-2 rounded-xl text-green-600">
                  <Shield size={18} />
                </div>
                <span className="font-medium text-sm">{t.privacy}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </motion.button>
          </div>
        </motion.section>

        {/* Support */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <motion.button whileTap={{ scale: 0.98, backgroundColor: '#f9fafb' }} className="w-full p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                  <HelpCircle size={18} />
                </div>
                <span className="font-medium text-sm">{t.help}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </motion.button>
            
            <motion.button whileTap={{ scale: 0.98, backgroundColor: '#fef2f2' }} className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition group">
              <div className="flex items-center gap-3 text-red-600">
                <div className="bg-red-50 p-2 rounded-xl group-hover:bg-red-100 transition">
                  <LogOut size={18} />
                </div>
                <span className="font-bold text-sm">{t.logout}</span>
              </div>
            </motion.button>
          </div>
        </motion.section>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-4 pb-8"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">AgroCare App v1.0.0</p>
        </motion.div>
      </main>
    </div>
  );
};
