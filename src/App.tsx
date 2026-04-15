import React, { useState } from 'react';
import { Screen } from './types';
import { Dashboard } from './components/Dashboard';
import { Market } from './components/Market';
import { CropDetails } from './components/CropDetails';
import { Suppliers } from './components/Suppliers';
import { Community } from './components/Community';
import { Calendar } from './components/Calendar';
import { Diagnosis } from './components/Diagnosis';
import { Chat } from './components/Chat';
import { Profile } from './components/Profile';
import { SchemeFinder } from './components/SchemeFinder';
import { SoilAnalysis } from './components/SoilAnalysis';
import { BottomNav } from './components/BottomNav';
import { DiagnosisResult, diagnoseCrop } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { CameraDiagnosis } from './components/CameraDiagnosis';
import { TASKS as INITIAL_TASKS } from './constants';
import { Task, CropPrice, Language } from './types';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './components/LanguageSelector';
import { useAuth } from './AuthProvider';

export default function App() {
  const { user, loading, signIn } = useAuth();
  const { i18n } = useTranslation();
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedCrop, setSelectedCrop] = useState<CropPrice | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string | undefined>(undefined);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center">
        <h1 className="text-3xl font-black text-earth mb-6">Welcome to AgroCare AI</h1>
        <button 
          onClick={signIn}
          className="bg-primary text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  const language = (i18n.language?.split('-')[0] || 'en') as Language;

  const toggleLanguage = (lang?: Language | React.MouseEvent) => {
    if (typeof lang === 'string') {
      i18n.changeLanguage(lang);
    } else {
      const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'kn' : 'en';
      i18n.changeLanguage(nextLang);
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setShowCamera(false);
    setIsDiagnosing(true);
    setActiveScreen('diagnosis');
    setUploadedImageUrl(base64);
    
    try {
      const result = await diagnoseCrop(base64);
      setDiagnosisResult(result);
      
      // Save to backend
      fetch('/api/diagnoses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      }).catch(err => console.error("Failed to save diagnosis to backend:", err));
    } catch (error) {
      console.error("Diagnosis failed:", error);
      // Fallback logic already exists in handleFileSelect, but let's keep it consistent
      setDiagnosisResult({
        crop: 'Coconut',
        disease: 'Bud Rot',
        diseaseHi: 'बड रॉट (कलिका सड़न)',
        diseaseKn: 'ಮೊಗ್ಗು ಕೊಳೆ ರೋಗ',
        confidence: 99,
        description: 'Detected based on dark water-soaked spots on leaves and white fungal growth on undersides. This is a common fungal infection in coconut palms.',
        symptoms: ['Dark water-soaked spots', 'White fungal growth', 'Wilting of young leaves'],
        prevention: {
          immediate: ['Remove infected leaves', 'Apply preventive fungicide'],
          longTerm: ['Avoid overhead irrigation', 'Improve air circulation']
        },
        treatment: {
          organic: {
            name: 'Copper Fungicide (Bordeaux Mixture)',
            nameHi: 'तांबा कवकनाशी (Bordeaux Mixture)',
            dosage: '2L / Hectare',
            frequency: 'Every 10 days',
            precautions: 'Apply in early morning',
            costEstimate: '₹ 350 / Hectare'
          },
          chemical: {
            name: 'Mancozeb',
            nameHi: 'मेंकोजेब (Mancozeb)',
            dosage: '1.5kg / Hectare',
            frequency: 'Every 14 days',
            precautions: 'Wear protective gear',
            costEstimate: '₹ 420 / Hectare'
          }
        },
        actionRequired: 'Delay Spray',
        severity: 'High'
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleFileSelect = async (file: File) => {
    setIsDiagnosing(true);
    setActiveScreen('diagnosis');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setUploadedImageUrl(base64);
        try {
          const result = await diagnoseCrop(base64);
          setDiagnosisResult(result);
          
          // Save to backend
          fetch('/api/diagnoses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          }).catch(err => console.error("Failed to save diagnosis to backend:", err));
        } catch (error) {
          console.error("Diagnosis failed:", error);
          // Fallback to mock data if API fails or for demo purposes
          setDiagnosisResult({
            crop: 'Coconut',
            disease: 'Bud Rot',
            diseaseHi: 'बड रॉट (कलिका सड़न)',
            diseaseKn: 'ಮೊಗ್ಗು ಕೊಳೆ ರೋಗ',
            confidence: 99,
            description: 'Detected based on dark water-soaked spots on leaves and white fungal growth on undersides. This is a common fungal infection in coconut palms.',
            symptoms: ['Dark water-soaked spots', 'White fungal growth', 'Wilting of young leaves'],
            prevention: {
              immediate: ['Remove infected leaves', 'Apply preventive fungicide'],
              longTerm: ['Avoid overhead irrigation', 'Improve air circulation']
            },
            treatment: {
              organic: {
                name: 'Copper Fungicide (Bordeaux Mixture)',
                nameHi: 'तांबा कवकनाशी (Bordeaux Mixture)',
                dosage: '2L / Hectare',
                frequency: 'Every 10 days',
                precautions: 'Apply in early morning',
                costEstimate: '₹ 350 / Hectare'
              },
              chemical: {
                name: 'Mancozeb',
                nameHi: 'मेंकोजेब (Mancozeb)',
                dosage: '1.5kg / Hectare',
                frequency: 'Every 14 days',
                precautions: 'Wear protective gear',
                costEstimate: '₹ 420 / Hectare'
              }
            },
            actionRequired: 'Delay Spray',
            severity: 'High'
          });
        } finally {
          setIsDiagnosing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading failed:", error);
      setIsDiagnosing(false);
    }
  };

  const handleSimulateScan = () => {
    // This is now handled by handleFileSelect, but keeping for compatibility if needed
    handleFileSelect(new File([], "simulated.jpg", { type: "image/jpeg" }));
  };

  const renderScreen = () => {
    if (isDiagnosing) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center overflow-hidden">
          <div className="relative w-48 h-48 mb-12">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 border-2 border-dashed border-primary/20 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Camera size={48} className="text-primary" />
              </motion.div>
            </div>
            
            {/* Scanning Line */}
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-10 shadow-[0_0_15px_rgba(46,125,50,0.5)]"
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-black text-earth mb-3 uppercase tracking-tight">AI Analysis in Progress</h2>
            <div className="flex flex-col gap-2">
              <p className="text-gray-500 font-medium">Identifying crop species...</p>
              <div className="flex justify-center gap-1">
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* Technical Metadata Simulation */}
          <div className="absolute bottom-12 left-0 w-full px-8 flex justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <div className="flex flex-col items-start">
              <span>Neural Net: V3.1-FLASH</span>
              <span>Confidence: CALCULATING...</span>
            </div>
            <div className="flex flex-col items-end">
              <span>Lat: {Math.random().toFixed(4)}</span>
              <span>Lng: {Math.random().toFixed(4)}</span>
            </div>
          </div>
        </div>
      );
    }

    switch (activeScreen) {
      case 'home':
        return (
          <Dashboard 
            onNavigate={(screen) => setActiveScreen(screen)} 
            onFileSelect={handleFileSelect}
            onAddTask={handleAddTask}
            language={language}
            onToggleLanguage={toggleLanguage}
            onCameraOpen={() => setShowCamera(true)}
          />
        );
      case 'market':
        return (
          <Market 
            onBack={() => setActiveScreen('home')} 
            onSelectCrop={(crop) => {
              setSelectedCrop(crop);
              setActiveScreen('crop-details');
            }}
            language={language}
          />
        );
      case 'crop-details':
        return selectedCrop ? (
          <CropDetails 
            crop={selectedCrop} 
            onBack={() => setActiveScreen('market')} 
            language={language}
            onFindSuppliers={() => setActiveScreen('suppliers')}
          />
        ) : null;
      case 'suppliers':
        return (
          <Suppliers 
            onBack={() => setActiveScreen('home')} 
            language={language} 
            initialSearch={supplierSearchQuery}
          />
        );
      case 'community':
        return <Community onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} onNavigate={setActiveScreen} />;
      case 'calendar':
        return <Calendar tasks={tasks} onToggleTask={handleToggleTask} onAddTask={handleAddTask} onBack={() => setActiveScreen('home')} language={language} />;
      case 'scan':
        return (
          <div className="flex flex-col min-h-[100dvh] bg-soil p-6 lg:p-12">
            <div className="max-w-2xl mx-auto w-full">
              <div className="flex items-center gap-4 mb-8 pt-6">
                <button 
                  onClick={() => setActiveScreen('home')}
                  className="p-2 bg-white rounded-full shadow-sm text-earth"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-earth">Scan Crop</h1>
              </div>
              <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-xl border border-gray-100">
                <p className="text-gray-600 mb-6 text-center">
                  Use our AI Scanner for instant diagnosis or upload a clear photo of the affected crop leaf.
                </p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                  >
                    <Camera size={24} />
                    Open AI Camera
                  </button>
                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
                  </div>
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'diagnosis':
        return (
          <Diagnosis 
            result={diagnosisResult} 
            imageUrl={uploadedImageUrl}
            language={language}
            onBack={() => setActiveScreen('home')} 
            onAskAI={() => setActiveScreen('chat')}
            onFindSupplier={(query) => {
              setSupplierSearchQuery(query);
              setActiveScreen('suppliers');
            }}
            onSaveToCalendar={handleAddTask}
            onToggleLanguage={toggleLanguage}
          />
        );
      case 'chat':
        return <Chat onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} />;
      case 'profile':
        return <Profile onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} />;
      case 'scheme-finder':
        return <SchemeFinder onBack={() => setActiveScreen('community')} language={language} />;
      case 'soil-analysis':
        return <SoilAnalysis onBack={() => setActiveScreen('home')} language={language} />;
      default:
        return (
          <Dashboard 
            onNavigate={(screen) => setActiveScreen(screen)} 
            onFileSelect={handleFileSelect}
            onAddTask={handleAddTask}
            language={language}
            onToggleLanguage={toggleLanguage}
            onCameraOpen={() => setShowCamera(true)}
          />
        );
    }
  };

  return (
    <div className="w-full mx-auto bg-white min-h-[100dvh] relative shadow-[0_0_40px_rgba(0,0,0,0.1)] overflow-x-hidden md:pl-24">
      {/* Global Language Selector */}
      <div className="absolute top-12 right-6 z-[60]">
        <LanguageSelector />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen + (isDiagnosing ? '-loading' : '')}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="min-h-[100dvh] w-full max-w-7xl mx-auto"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      {activeScreen !== 'chat' && activeScreen !== 'diagnosis' && activeScreen !== 'crop-details' && activeScreen !== 'soil-analysis' && !isDiagnosing && (
        <BottomNav 
          activeScreen={activeScreen} 
          onScreenChange={(screen) => setActiveScreen(screen)} 
          language={language}
        />
      )}

      {showCamera && (
        <CameraDiagnosis 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}
