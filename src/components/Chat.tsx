import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Bot, Send, Mic, Camera, Volume2, CheckCheck, Leaf, AlertTriangle, Square, Loader2, Globe } from 'lucide-react';
import { chatWithAssistant, generateSpeech } from '../services/gemini';
import { Language } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  time: string;
  isAlternative?: boolean;
}

interface ChatProps {
  onBack: () => void;
  language: Language;
  onToggleLanguage: (lang?: Language) => void;
}

export const Chat: React.FC<ChatProps> = ({ onBack, language, onToggleLanguage }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [
          {
            role: 'model',
            text: language === 'hi' 
              ? "नमस्ते! 🙏 मैं आपका एग्रोकेयर सहायक हूं। आपके द्वारा अपलोड की गई तस्वीर के आधार पर, मुझे आपकी टमाटर की फसल पर लेट ब्लाइट के लक्षण दिखाई दे रहे हैं। मैं इसे ठीक करने में आपकी कैसे मदद कर सकता हूं?" 
              : language === 'kn'
              ? "ನಮಸ್ಕಾರ! 🙏 ನಾನು ನಿಮ್ಮ ಅಗ್ರೋಕೇರ್ ಸಹಾಯಕ. ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೋಟೋ ಆಧಾರದ ಮೇಲೆ, ನಿಮ್ಮ ಟೊಮೆಟೊ ಬೆಳೆಯಲ್ಲಿ ಲೇಟ್ ಬ್ಲೈಟ್ ಲಕ್ಷಣಗಳು ಕಾಣಿಸುತ್ತಿವೆ. ಇದನ್ನು ಗುಣಪಡಿಸಲು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
              : "Namaste! 🙏 I'm your AgroCare assistant. Based on the photo you uploaded, I see signs of Late Blight on your tomato crop. How can I help you treat it?",
            time: '10:30 AM'
          }
        ];
      }
      return prev;
    });
  }, [language]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const [loadingAudioIndex, setLoadingAudioIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioRequestRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      // Note: We can't easily stop the native recognition instance here without keeping a ref to it,
      // but setting isListening to false will update the UI.
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handlePlayAudio = async (text: string, index: number) => {
    // If clicking the currently playing or loading audio, stop it
    if (playingAudioIndex === index || loadingAudioIndex === index) {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {}
        audioSourceRef.current = null;
      }
      setPlayingAudioIndex(null);
      setLoadingAudioIndex(null);
      currentAudioRequestRef.current = null;
      return;
    }

    // Stop any currently playing audio
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setPlayingAudioIndex(null);

    try {
      setLoadingAudioIndex(index);
      
      // Generate a unique ID for this request to handle race conditions
      const requestId = Date.now();
      currentAudioRequestRef.current = requestId;
      
      const base64Audio = await generateSpeech(text);
      
      // If the user clicked stop or started another audio while this was loading
      if (currentAudioRequestRef.current !== requestId) {
        return;
      }
      
      setLoadingAudioIndex(null);
      
      if (base64Audio) {
        setPlayingAudioIndex(index);
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        }
        
        const audioCtx = audioContextRef.current;
        
        // Decode base64 to binary string
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Convert to 16-bit PCM
        const int16Array = new Int16Array(bytes.buffer);
        
        // Create audio buffer
        const audioBuffer = audioCtx.createBuffer(1, int16Array.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        // Convert Int16 to Float32 (-1.0 to 1.0)
        for (let i = 0; i < int16Array.length; i++) {
          channelData[i] = int16Array[i] / 32768.0;
        }
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
          if (currentAudioRequestRef.current === requestId) {
            setPlayingAudioIndex(null);
            audioSourceRef.current = null;
            currentAudioRequestRef.current = null;
          }
        };
        
        audioSourceRef.current = source;
        source.start();
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setLoadingAudioIndex(null);
      setPlayingAudioIndex(null);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      role: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m, i) => !(i === 0 && m.role === 'model'))
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await chatWithAssistant(inputText, history, language);
      
      const botMessage: Message = {
        role: 'model',
        text: response || "I'm sorry, I couldn't process that.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F0F2F5] relative shadow-xl overflow-hidden">
      <header className="bg-primary-dark text-white px-4 py-3 flex items-center shadow-md z-10 shrink-0 pt-12">
        <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-primary transition">
          <ArrowLeft size={28} />
        </button>
        <div className="flex items-center flex-1">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-dark font-bold border-2 border-white overflow-hidden">
              <Bot size={24} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary-dark rounded-full"></div>
          </div>
          <div className="ml-3">
            <h1 className="font-bold text-lg leading-tight">AgroCare Bot</h1>
            <p className="text-green-100 text-xs flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-green-300 rounded-full mr-1.5"></span>
              Online • {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Kannada'}
            </p>
          </div>
        </div>
        <button onClick={onToggleLanguage} className="p-2 mr-1 rounded-full hover:bg-primary transition flex items-center justify-center" aria-label="Toggle Language">
          <Globe size={24} />
        </button>
        <button className="p-2 rounded-full hover:bg-primary transition">
          <MoreVertical size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-32">
        <div className="flex justify-center">
          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">Today</span>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 bg-primary-dark rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                <Bot size={18} />
              </div>
            )}
            <div className={`${msg.role === 'user' ? 'mr-2' : 'ml-2'} max-w-[85%]`}>
              <div className={`p-4 rounded-2xl shadow-sm text-earth border ${
                msg.role === 'user' 
                  ? 'bg-[#dcf8c6] rounded-tr-none border-green-100' 
                  : 'bg-white rounded-tl-none border-gray-100'
              }`}>
                {msg.isAlternative && (
                  <p className="text-base leading-relaxed font-bold text-green-800 mb-2 flex items-center">
                    <Leaf size={18} className="mr-1" /> Organic Alternative
                  </p>
                )}
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => handlePlayAudio(msg.text, i)}
                    className="mt-2 flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors"
                  >
                    {playingAudioIndex === i ? (
                      <><Square size={16} className="fill-current" /> Stop</>
                    ) : loadingAudioIndex === i ? (
                      <><Loader2 size={16} className="animate-spin" /> Loading...</>
                    ) : (
                      <><Volume2 size={16} /> Listen</>
                    )}
                  </button>
                )}
              </div>
              <span className={`text-[10px] text-gray-500 mt-1 block flex items-center gap-1 ${msg.role === 'user' ? 'justify-end' : 'ml-1'}`}>
                {msg.time}
                {msg.role === 'user' && <CheckCheck size={14} className="text-blue-500" />}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="w-8 h-8 bg-primary-dark rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
              <Bot size={18} />
            </div>
            <div className="ml-2 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-3 py-3 z-20 pb-8">
        <div className="flex items-end gap-2">
          <button 
            onClick={handleMicClick}
            className={`p-3 rounded-full shadow-lg transition flex-shrink-0 mb-1 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
            }`}
          >
            {isListening ? <Square size={24} className="fill-current" /> : <Mic size={24} />}
          </button>
          <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-2 border border-gray-200 focus-within:border-primary focus-within:bg-white transition mb-1">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              className="w-full bg-transparent border-none focus:ring-0 p-0 text-base resize-none text-gray-800 placeholder-gray-500 max-h-24 overflow-y-auto" 
              placeholder={language === 'hi' ? "हिंदी में पूछें..." : language === 'kn' ? "ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ..." : "Ask in English..."} 
              rows={1}
            />
            <button className="text-gray-400 hover:text-primary ml-2 transition">
              <Camera size={24} />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-full transition flex-shrink-0 mb-1 ${
              inputText.trim() && !isLoading ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            <Send size={24} />
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400">AgroCare AI can make mistakes. Consult an expert for critical issues.</p>
        </div>
      </footer>
    </div>
  );
};
