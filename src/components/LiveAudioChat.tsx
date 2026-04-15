import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, X, Loader2, Volume2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { DiagnosisResult } from '../services/gemini';

interface LiveAudioChatProps {
  diagnosis: DiagnosisResult | null;
  onClose: () => void;
}

export const LiveAudioChat: React.FC<LiveAudioChatProps> = ({ diagnosis, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initLiveAPI = async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API key is missing");

        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = diagnosis 
          ? `You are AgroCare AI, an expert agricultural assistant. The user has just scanned a crop and received this diagnosis: Crop: ${diagnosis.crop}, Disease: ${diagnosis.disease}, Severity: ${diagnosis.severity}. Treatment plan: ${diagnosis.treatment.organic.name} (Organic) or ${diagnosis.treatment.chemical.name} (Chemical). Briefly summarize this finding to the user and ask if they have any questions about the treatment or prevention. Keep your responses concise and conversational.`
          : `You are AgroCare AI, an expert agricultural assistant. Help the user with their farming questions. Keep your responses concise and conversational.`;

        const sessionPromise = ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
            },
            systemInstruction,
          },
          callbacks: {
            onopen: async () => {
              if (!isMounted) return;
              setIsConnecting(false);
              setIsConnected(true);

              try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                  audio: { channelCount: 1, sampleRate: 16000 } 
                });
                streamRef.current = stream;

                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                audioContextRef.current = audioCtx;

                const source = audioCtx.createMediaStreamSource(stream);
                const processor = audioCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                processor.onaudioprocess = (e) => {
                  if (isMuted) return;
                  
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcm16 = new Int16Array(inputData.length);
                  for (let i = 0; i < inputData.length; i++) {
                    pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                  }
                  
                  const buffer = new ArrayBuffer(pcm16.length * 2);
                  const view = new DataView(buffer);
                  for (let i = 0; i < pcm16.length; i++) {
                    view.setInt16(i * 2, pcm16[i], true);
                  }
                  
                  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                  
                  sessionPromise.then((session) => {
                    session.sendRealtimeInput({
                      audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                    });
                  }).catch(console.error);
                };

                source.connect(processor);
                processor.connect(audioCtx.destination);
              } catch (err) {
                console.error("Mic error:", err);
                setError("Could not access microphone.");
              }
            },
            onmessage: (message: LiveServerMessage) => {
              if (!isMounted) return;

              // Handle interruption
              if (message.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(source => {
                  try { source.stop(); } catch (e) {}
                });
                activeSourcesRef.current = [];
                if (playbackContextRef.current) {
                  nextPlayTimeRef.current = playbackContextRef.current.currentTime;
                }
                setIsSpeaking(false);
              }

              // Handle audio output
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                setIsSpeaking(true);
                if (!playbackContextRef.current) {
                  playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                  nextPlayTimeRef.current = playbackContextRef.current.currentTime;
                }

                const ctx = playbackContextRef.current;
                
                // Decode base64 to Int16
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const pcm16 = new Int16Array(bytes.buffer);
                
                // Convert to Float32
                const float32 = new Float32Array(pcm16.length);
                for (let i = 0; i < pcm16.length; i++) {
                  float32[i] = pcm16[i] / 32768;
                }

                const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
                audioBuffer.getChannelData(0).set(float32);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                const playTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
                source.start(playTime);
                nextPlayTimeRef.current = playTime + audioBuffer.duration;
                
                activeSourcesRef.current.push(source);
                
                source.onended = () => {
                  activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                  if (activeSourcesRef.current.length === 0) {
                    setIsSpeaking(false);
                  }
                };
              }
            },
            onerror: (err) => {
              console.error("Live API Error:", err);
              if (isMounted) setError("Connection error occurred.");
            },
            onclose: () => {
              if (isMounted) setIsConnected(false);
            }
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to init Live API:", err);
        if (isMounted) {
          setError("Failed to connect to AI.");
          setIsConnecting(false);
        }
      }
    };

    initLiveAPI();

    return () => {
      isMounted = false;
      if (processorRef.current && audioContextRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
        playbackContextRef.current.close().catch(console.error);
      }
      if (sessionRef.current) {
        try {
          // The SDK doesn't expose a direct close method on the session object in the same way,
          // but we can just let it drop or send a close signal if available.
          // For now, cleaning up the audio context stops the stream.
        } catch (e) {}
      }
    };
  }, [diagnosis, isMuted]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 pb-8 flex flex-col items-center text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
          >
            <X size={20} />
          </button>
          
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
            {isSpeaking && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-primary/20 rounded-full"
              />
            )}
            <Volume2 size={40} className={`text-primary ${isSpeaking ? 'animate-pulse' : ''}`} />
          </div>
          
          <h2 className="text-2xl font-black text-earth mb-2">AgroCare Voice</h2>
          
          {isConnecting ? (
            <div className="flex items-center gap-2 text-gray-500 font-medium">
              <Loader2 size={16} className="animate-spin" />
              Connecting to AI...
            </div>
          ) : error ? (
            <p className="text-red-500 font-medium">{error}</p>
          ) : (
            <p className="text-gray-600 font-medium">
              {isSpeaking ? "AI is speaking..." : "Listening... Ask about your crop."}
            </p>
          )}
        </div>
        
        <div className="bg-gray-50 p-6 flex justify-center border-t border-gray-100">
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={isConnecting || !!error}
            className={`p-6 rounded-full shadow-lg transition-all ${
              isMuted 
                ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                : 'bg-primary text-white hover:bg-primary-dark'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
