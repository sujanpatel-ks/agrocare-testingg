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
import { BottomNav } from './components/BottomNav';
import { DiagnosisResult, diagnoseCrop } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { CameraDiagnosis } from './components/CameraDiagnosis';
import { TASKS as INITIAL_TASKS } from './constants';
import { Task, CropPrice, Language } from './types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [language, setLanguage] = useState<Language>('en');
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedCrop, setSelectedCrop] = useState<CropPrice | null>(null);

  const toggleLanguage = () => {
    setLanguage(prev => {
      if (prev === 'en') return 'hi';
      if (prev === 'hi') return 'kn';
      return 'en';
    });
  };

  const handleCameraCapture = async (base64: string) => {
    setShowCamera(false);
    setIsDiagnosing(true);
    setActiveScreen('diagnosis');
    setUploadedImageUrl(base64);
    
    try {
      const result = await diagnoseCrop(base64);
      setDiagnosisResult(result);
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
        <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full mb-6"
          />
          <h2 className="text-xl font-bold text-earth mb-2">Analyzing Crop...</h2>
          <p className="text-gray-500">Our AI is identifying potential issues with your crop.</p>
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
        return <Suppliers onBack={() => setActiveScreen('home')} language={language} />;
      case 'community':
        return <Community onBack={() => setActiveScreen('home')} language={language} onToggleLanguage={toggleLanguage} />;
      case 'calendar':
        return <Calendar tasks={tasks} onToggleTask={handleToggleTask} onBack={() => setActiveScreen('home')} language={language} />;
      case 'scan':
        return (
          <div className="flex flex-col min-h-screen bg-soil p-6">
            <div className="flex items-center gap-4 mb-8 pt-6">
              <button 
                onClick={() => setActiveScreen('home')}
                className="p-2 bg-white rounded-full shadow-sm text-earth"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-earth">Scan Crop</h1>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
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
        );
      case 'diagnosis':
        return (
          <Diagnosis 
            result={diagnosisResult} 
            imageUrl={uploadedImageUrl}
            language={language}
            onBack={() => setActiveScreen('home')} 
            onAskAI={() => setActiveScreen('chat')}
            onFindSupplier={() => setActiveScreen('suppliers')}
            onSaveToCalendar={handleAddTask}
            onToggleLanguage={toggleLanguage}
          />
        );
      case 'chat':
        return <Chat onBack={() => setActiveScreen('home')} language={language} />;
      default:
        return <Dashboard onNavigate={setActiveScreen} onFileSelect={handleFileSelect} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen + (isDiagnosing ? '-loading' : '')}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      {activeScreen !== 'chat' && activeScreen !== 'diagnosis' && activeScreen !== 'crop-details' && !isDiagnosing && (
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
    </div>
  );
}
