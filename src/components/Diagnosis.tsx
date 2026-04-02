import React, { useState, useRef } from 'react';
import { ArrowLeft, Share2, Volume2, Droplets, Layers, Stethoscope, Store, Bot, CloudRain, CheckCircle, Clock, ChevronDown, Bug, Info, ShieldCheck, AlertTriangle, PhoneCall, MapPin, Calendar, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { DiagnosisResult, generateSpeech } from '../services/gemini';
import { Task, Language } from '../types';

interface DiagnosisProps {
  result: DiagnosisResult | null;
  imageUrl: string | null;
  language: Language;
  onBack: () => void;
  onAskAI: () => void;
  onFindSupplier: () => void;
  onSaveToCalendar: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleLanguage: () => void;
}

export const Diagnosis: React.FC<DiagnosisProps> = ({ result, imageUrl, language, onBack, onAskAI, onFindSupplier, onSaveToCalendar, onToggleLanguage }) => {
  const [savedTasks, setSavedTasks] = useState<Set<string>>(new Set());
  const [treatmentType, setTreatmentType] = useState<'organic' | 'chemical'>('organic');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const t = {
    en: {
      title: "Diagnosis Result",
      severity: "Severity",
      symptoms: "Symptoms",
      prevention: "Prevention Tips",
      immediate: "Immediate Actions",
      longTerm: "Long-term Measures",
      treatment: "Recommended Treatment",
      organic: "Organic",
      chemical: "Chemical",
      recommended: "RECOMMENDED",
      dosage: "Dosage",
      freq: "Freq",
      precaution: "Precaution",
      severeTitle: "Severe Infection Detected",
      severeDesc: "This case requires professional intervention to prevent crop loss.",
      contactExpert: "Contact Local Expert",
      findSupplier: "Find Nearby Supplier",
      askAI: "Ask AI Assistant",
      noDiagnosis: "No Diagnosis Yet",
      scanPrompt: "Scan a crop leaf to see results here.",
      goBack: "Go Back"
    },
    hi: {
      title: "निदान परिणाम",
      severity: "गंभीरता",
      symptoms: "लक्षण",
      prevention: "बचाव के उपाय",
      immediate: "तत्काल कार्रवाई",
      longTerm: "दीर्घकालिक उपाय",
      treatment: "अनुशंसित उपचार",
      organic: "जैविक",
      chemical: "रासायनिक",
      recommended: "अनुशंसित",
      dosage: "खुराक",
      freq: "आवृत्ति",
      precaution: "सावधानी",
      severeTitle: "गंभीर संक्रमण का पता चला",
      severeDesc: "फसल के नुकसान को रोकने के लिए इस मामले में पेशेवर हस्तक्षेप की आवश्यकता है।",
      contactExpert: "स्थानीय विशेषज्ञ से संपर्क करें",
      findSupplier: "आस-पास के आपूर्तिकर्ता खोजें",
      askAI: "एआई सहायक से पूछें",
      noDiagnosis: "अभी तक कोई निदान नहीं",
      scanPrompt: "परिणाम देखने के लिए फसल की पत्ती को स्कैन करें।",
      goBack: "वापस जाएं"
    },
    kn: {
      title: "ರೋಗನಿರ್ಣಯದ ಫಲಿತಾಂಶ",
      severity: "ತೀವ್ರತೆ",
      symptoms: "ಲಕ್ಷಣಗಳು",
      prevention: "ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು",
      immediate: "ತಕ್ಷಣದ ಕ್ರಮಗಳು",
      longTerm: "ದೀರ್ಘಕಾಲದ ಕ್ರಮಗಳು",
      treatment: "ಶಿಫಾರಸು ಮಾಡಿದ ಚಿಕಿತ್ಸೆ",
      organic: "ಸಾವಯವ",
      chemical: "ರಾಸಾಯನಿಕ",
      recommended: "ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ",
      dosage: "ಡೋಸೇಜ್",
      freq: "ಆವರ್ತನ",
      precaution: "ಮುನ್ನೆಚ್ಚರಿಕೆ",
      severeTitle: "ತೀವ್ರ ಸೋಂಕು ಪತ್ತೆಯಾಗಿದೆ",
      severeDesc: "ಬೆಳೆ ನಷ್ಟವನ್ನು ತಡೆಗಟ್ಟಲು ಈ ಸಂದರ್ಭದಲ್ಲಿ ವೃತ್ತಿಪರ ಹಸ್ತಕ್ಷೇಪದ ಅಗತ್ಯವಿದೆ.",
      contactExpert: "ಸ್ಥಾನಿಕ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ",
      findSupplier: "ಹತ್ತಿರದ ಸರಬರಾಜುದಾರರನ್ನು ಹುಡುಕಿ",
      askAI: "AI ಸಹಾಯಕರನ್ನು ಕೇಳಿ",
      noDiagnosis: "ಇನ್ನೂ ಯಾವುದೇ ರೋಗನಿರ್ಣಯವಿಲ್ಲ",
      scanPrompt: "ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಲು ಬೆಳೆಯ ಎಲೆಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.",
      goBack: "ಹಿಂದಕ್ಕೆ ಹೋಗಿ"
    }
  }[language];

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-soil p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-bold text-earth mb-2">{t.noDiagnosis}</h2>
        <p className="text-gray-500 mb-6">{t.scanPrompt}</p>
        <button onClick={onBack} className="text-primary font-bold">{t.goBack}</button>
      </div>
    );
  }

  const confidence = result.confidence;
  const confidenceColor = confidence > 85 ? 'text-green-600' : confidence > 60 ? 'text-yellow-600' : 'text-red-600';
  const confidenceStroke = confidence > 85 ? '#16a34a' : confidence > 60 ? '#ca8a04' : '#dc2626';
  const confidenceLabel = confidence > 85 ? 'High Match' : confidence > 60 ? 'Possible Match' : 'Low Confidence';

  const severityColor = 
    result.severity === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 
    result.severity === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
    'bg-blue-100 text-blue-700 border-blue-200';

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = language === 'hi' 
      ? `${result.crop} ${result.diseaseHi}. ${result.description}`
      : language === 'kn'
      ? `${result.crop} ${result.diseaseKn}. ${result.description}`
      : `${result.crop} ${result.disease}. ${result.description}`;

    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(textToSpeak);
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        
        const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
        const int16Array = new Int16Array(arrayBuffer);
        const float32Array = new Float32Array(int16Array.length);
        
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768;
        }
        
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsSpeaking(false);
          audioContextRef.current = null;
        };
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Speech generation failed:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-soil max-w-md mx-auto bg-white overflow-hidden relative">
      <header className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 pt-12">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h1 className="font-semibold text-lg text-gray-800">{t.title}</h1>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 rounded-full p-1 flex items-center border border-gray-200 relative w-24 h-7 cursor-pointer" onClick={onToggleLanguage}>
            <motion.div 
              className="absolute bg-white rounded-full h-5 w-7 shadow-sm"
              animate={{ x: language === 'en' ? 0 : language === 'hi' ? 28 : 56 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'en' ? 'text-primary' : 'text-gray-400'}`}>EN</button>
            <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'hi' ? 'text-primary' : 'text-gray-400'}`}>HI</button>
            <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'kn' ? 'text-primary' : 'text-gray-400'}`}>KN</button>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Share2 size={24} className="text-gray-700" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-48 bg-[#f8f9fa]">
        <div className="relative w-full h-72 bg-black overflow-hidden border-b-4 border-primary/20">
          <img 
            src={imageUrl || "https://picsum.photos/seed/leaf/600/400"} 
            alt="Analyzed Leaf" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          {/* Scanning Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30"></div>

          {/* Technical Corner Markers */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-primary/70"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-primary/70"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-primary/70"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-primary/70"></div>

          {/* Scan Metadata */}
          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-primary/80 uppercase tracking-widest">
            <div>SCAN ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
            <div>RES: HIGH</div>
            <div>MODE: SPECTRAL</div>
          </div>

          {result.boundingBox && result.boundingBox.length === 4 && (
            <div 
              className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none flex justify-center backdrop-blur-[1px]"
              style={{
                top: `${(result.boundingBox[0] / 1000) * 100}%`,
                left: `${(result.boundingBox[1] / 1000) * 100}%`,
                height: `${((result.boundingBox[2] - result.boundingBox[0]) / 1000) * 100}%`,
                width: `${((result.boundingBox[3] - result.boundingBox[1]) / 1000) * 100}%`,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.2)',
              }}
            >
              {/* Target Crosshairs */}
              <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
              <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
              <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

              <div className="absolute -top-8 bg-red-600 text-white text-[10px] font-mono font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 tracking-wider uppercase border border-red-400">
                <AlertTriangle size={10} />
                TARGET AQUIRED: {language === 'hi' ? result.diseaseHi : language === 'kn' ? result.diseaseKn : result.disease}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-red-600"></div>
              </div>
            </div>
          )}

          <div className={`absolute top-4 right-4 px-3 py-1 rounded-sm text-[10px] font-mono font-bold border uppercase tracking-widest backdrop-blur-md ${severityColor.replace('bg-', 'bg-').replace('100', '900/80').replace('text-', 'text-').replace('700', '100')}`}>
            {result.severity} {t.severity}
          </div>
        </div>

        <div className="px-5 pt-6 pb-6 bg-white border-b border-gray-200 shadow-sm relative z-10 -mt-2 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Analysis Complete</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">{result.crop} {result.disease}</h2>
              <h3 className="text-sm font-mono text-gray-500 mt-2 font-medium uppercase tracking-widest border-l-2 border-primary pl-3 py-0.5 bg-gray-50">
                {language === 'hi' ? result.diseaseHi : language === 'kn' ? result.diseaseKn : result.disease}
              </h3>
            </div>
            <button 
              onClick={handleSpeak}
              className={`p-3 rounded-xl transition-all shadow-sm border ${isSpeaking ? 'bg-blue-600 text-white border-blue-700 animate-pulse' : 'bg-white text-blue-600 border-gray-200 hover:bg-blue-50'}`}
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="mt-5 p-4 bg-green-50 rounded-xl border border-green-100 font-roboto text-sm text-green-900 leading-relaxed shadow-inner">
            <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 border-b border-green-200 pb-1">Diagnostic Summary</div>
            {result.description}
          </div>
        </div>

        <div className="h-2 bg-gray-50 border-t border-b border-gray-100"></div>

        {result.actionRequired && (
          <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
              <CloudRain size={20} />
            </div>
            <div>
              <h4 className="font-bold text-orange-800 text-sm">Action Required: {result.actionRequired}</h4>
              <p className="text-xs text-orange-700 mt-1">Heavy rain expected in 3 hours. Spraying now will wash away chemicals.</p>
            </div>
          </div>
        )}

        <div className="px-5 py-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Bug className="text-primary" size={20} /> {t.symptoms}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {result.symptoms.map((symptom, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center shadow-sm">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  {i === 0 ? <Droplets className="text-green-700" size={24} /> : <Layers className="text-green-700" size={24} />}
                </div>
                <span className="text-xs font-medium text-gray-700">{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-2 bg-gray-50 border-t border-b border-gray-100"></div>

        {/* Prevention Tips Section */}
        <div className="px-5 py-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="text-green-600" size={20} /> {t.prevention}
          </h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{t.immediate}</p>
              <div className="space-y-3">
                {result.prevention.immediate.map((tip, i) => (
                  <motion.div 
                    key={`imm-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 bg-orange-50/50 p-3 rounded-xl border border-orange-100"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-snug">{tip}</p>
                    </div>
                    <button 
                      onClick={() => {
                        onSaveToCalendar({
                          title: `Action: ${tip.substring(0, 20)}...`,
                          titleHi: 'तत्काल कार्रवाई',
                          titleKn: 'ತಕ್ಷಣದ ಕ್ರಮ',
                          description: tip,
                          icon: 'AlertTriangle',
                          color: 'orange'
                        });
                        setSavedTasks(prev => new Set(prev).add(`imm-${i}`));
                      }}
                      disabled={savedTasks.has(`imm-${i}`)}
                      className={`p-2 rounded-lg transition-colors ${savedTasks.has(`imm-${i}`) ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-400 hover:text-primary border border-gray-100'}`}
                    >
                      {savedTasks.has(`imm-${i}`) ? <Check size={16} /> : <Calendar size={16} />}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{t.longTerm}</p>
              <div className="space-y-3">
                {result.prevention.longTerm.map((tip, i) => (
                  <motion.div 
                    key={`lt-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 bg-green-50/50 p-3 rounded-xl border border-green-100"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-snug">{tip}</p>
                    </div>
                    <button 
                      onClick={() => {
                        onSaveToCalendar({
                          title: `Measure: ${tip.substring(0, 20)}...`,
                          titleHi: 'दीर्घकालिक उपाय',
                          titleKn: 'ದೀರ್ಘಕಾಲದ ಕ್ರಮ',
                          description: tip,
                          icon: 'ShieldCheck',
                          color: 'green'
                        });
                        setSavedTasks(prev => new Set(prev).add(`lt-${i}`));
                      }}
                      disabled={savedTasks.has(`lt-${i}`)}
                      className={`p-2 rounded-lg transition-colors ${savedTasks.has(`lt-${i}`) ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 hover:text-primary border border-gray-100'}`}
                    >
                      {savedTasks.has(`lt-${i}`) ? <Check size={16} /> : <Calendar size={16} />}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 bg-gray-50 border-t border-b border-gray-100"></div>

        <div className="px-5 py-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Stethoscope className="text-primary" size={20} /> {t.treatment}
          </h3>
          <div className="bg-gray-100 p-1 rounded-lg flex mb-4">
            <button 
              onClick={() => setTreatmentType('organic')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all ${treatmentType === 'organic' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.organic}
            </button>
            <button 
              onClick={() => setTreatmentType('chemical')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold transition-all ${treatmentType === 'chemical' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.chemical}
            </button>
          </div>
          <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
              {t.recommended}
            </div>
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-3xl">{treatmentType === 'organic' ? '🧴' : '🧪'}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">
                  {result.treatment[treatmentType].name}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {result.treatment[treatmentType].nameHi}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-600 uppercase tracking-wider">
                    {t.dosage}: {result.treatment[treatmentType].dosage}
                  </span>
                  <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded font-bold text-blue-600 uppercase tracking-wider">
                    {t.freq}: {result.treatment[treatmentType].frequency}
                  </span>
                </div>
                <p className="text-sm font-bold text-primary">
                  {result.treatment[treatmentType].costEstimate}
                </p>
              </div>
              <button 
                onClick={() => {
                  const treatment = result.treatment[treatmentType];
                  onSaveToCalendar({
                    title: `Apply ${treatment.name}`,
                    titleHi: 'उपचार लागू करें',
                    titleKn: 'ಚಿಕಿತ್ಸೆಯನ್ನು ಅನ್ವಯಿಸಿ',
                    description: `Apply ${treatment.name} (${treatment.dosage}). Freq: ${treatment.frequency}. Precautions: ${treatment.precautions}`,
                    icon: 'Stethoscope',
                    color: treatmentType === 'organic' ? 'blue' : 'red'
                  });
                  setSavedTasks(prev => new Set(prev).add(`treat-${treatmentType}`));
                }}
                disabled={savedTasks.has(`treat-${treatmentType}`)}
                className={`p-2 rounded-xl transition-colors self-start ${savedTasks.has(`treat-${treatmentType}`) ? 'bg-green-100 text-green-600' : 'bg-soil text-gray-400 hover:text-primary'}`}
              >
                {savedTasks.has(`treat-${treatmentType}`) ? <Check size={20} /> : <Calendar size={20} />}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                  <span className="font-black uppercase tracking-tighter mr-1">{t.precaution}:</span>
                  {result.treatment[treatmentType].precautions}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="text-primary" size={16} />
                <span>Effective for {treatmentType === 'organic' ? 'early' : 'advanced'} stage</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <Clock className="text-blue-500" size={16} />
                <span>Apply as per frequency: {result.treatment[treatmentType].frequency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Severe Case Section */}
        {result.severity === 'High' && (
          <div className="px-5 pb-10">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-red-800">{t.severeTitle}</h4>
                  <p className="text-xs text-red-700">{t.severeDesc}</p>
                </div>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors">
                <PhoneCall size={20} />
                {t.contactExpert}
              </button>
            </div>
          </div>
        )}
      </main>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-12 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 flex flex-col gap-3">
        <button 
          onClick={onFindSupplier}
          className="w-full bg-primary-dark hover:bg-primary text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <Store size={20} />
          {t.findSupplier}
        </button>
        <button 
          onClick={onAskAI}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Bot size={20} className="text-blue-600" />
          {t.askAI}
        </button>
      </div>
    </div>
  );
};
