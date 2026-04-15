import React, { useState } from 'react';
import { ArrowLeft, Droplets, Leaf, Beaker, Sprout, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { analyzeSoil, SoilData, SoilAnalysisResult } from '../services/gemini';

interface SoilAnalysisProps {
  onBack: () => void;
  language: Language;
}

export const SoilAnalysis: React.FC<SoilAnalysisProps> = ({ onBack, language }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SoilData>({
    n: 50,
    p: 30,
    k: 40,
    ph: 6.5,
    type: 'Loam',
    moisture: 40,
  });

  const soilTypes = ['Sandy', 'Clay', 'Loam', 'Silt', 'Peaty', 'Chalky'];

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeSoil(formData);
      setResult(analysis);
    } catch (err) {
      console.error("Soil analysis failed:", err);
      setError("Failed to analyze soil data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 w-full overflow-x-hidden shadow-2xl">
      {/* Header */}
      <header className="flex items-center px-5 pt-12 pb-4 bg-white sticky top-0 z-20 shadow-sm">
        <button onClick={onBack} className="bg-[#E8F5E9] p-2.5 rounded-2xl text-[#1B5E20] shadow-sm mr-4">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-earth">Soil Analysis</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Test & Recommendations</p>
        </div>
      </header>

      <main className="flex-1 p-5 overflow-y-auto pb-24 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10"
            >
              <div className="space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-earth mb-4 flex items-center gap-2">
                  <Beaker className="text-[#1B5E20]" size={20} />
                  Enter Soil Data
                </h2>
                
                <div className="space-y-5">
                  {/* NPK Inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Nitrogen (N)</label>
                      <input 
                        type="number" 
                        value={formData.n}
                        onChange={(e) => setFormData({...formData, n: Number(e.target.value)})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-earth focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Phosphorus (P)</label>
                      <input 
                        type="number" 
                        value={formData.p}
                        onChange={(e) => setFormData({...formData, p: Number(e.target.value)})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-earth focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Potassium (K)</label>
                      <input 
                        type="number" 
                        value={formData.k}
                        onChange={(e) => setFormData({...formData, k: Number(e.target.value)})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-earth focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20 focus:border-[#1B5E20]"
                      />
                    </div>
                  </div>

                  {/* pH & Moisture */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">pH Level</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0" max="14" step="0.1"
                          value={formData.ph}
                          onChange={(e) => setFormData({...formData, ph: Number(e.target.value)})}
                          className="w-full accent-[#1B5E20]"
                        />
                        <span className="text-sm font-black text-earth w-8">{formData.ph}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Moisture (%)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0" max="100" step="1"
                          value={formData.moisture}
                          onChange={(e) => setFormData({...formData, moisture: Number(e.target.value)})}
                          className="w-full accent-blue-500"
                        />
                        <span className="text-sm font-black text-earth w-8">{formData.moisture}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Soil Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Soil Type</label>
                    <div className="flex flex-wrap gap-2">
                      {soilTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => setFormData({...formData, type})}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            formData.type === type 
                              ? 'bg-[#1B5E20] text-white shadow-md' 
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full mt-6 bg-[#1B5E20] text-white font-black py-4 rounded-2xl shadow-lg shadow-green-900/20 hover:bg-[#144d18] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing Soil...
                    </>
                  ) : (
                    <>
                      <Leaf size={20} />
                      Analyze Soil
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Enter the values from your latest soil test report. If you don't have exact numbers, you can estimate or use a basic home testing kit.
                </p>
              </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10"
            >
              <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-6 rounded-[32px] border-2 ${getStatusColor(result.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-sm font-black uppercase tracking-widest opacity-80">Overall Health</h2>
                  {result.status === 'Excellent' || result.status === 'Good' ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <AlertCircle size={24} />
                  )}
                </div>
                <p className="text-4xl font-black tracking-tight">{result.status}</p>
              </div>

              {/* Analysis Cards */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Beaker size={16} className="text-purple-500" />
                    pH Analysis
                  </h3>
                  <p className="text-earth font-medium text-sm leading-relaxed">{result.phAnalysis}</p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Leaf size={16} className="text-green-500" />
                    NPK Analysis
                  </h3>
                  <p className="text-earth font-medium text-sm leading-relaxed">{result.npkAnalysis}</p>
                </div>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Droplets size={16} className="text-blue-500" />
                    Fertilizer Advice
                  </h3>
                  <p className="text-earth font-medium text-sm leading-relaxed">{result.fertilizerAdvice}</p>
                </div>
              </div>
              </div>
              <div className="space-y-4">

              {/* Recommendations */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Action Plan</h3>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-earth font-medium leading-relaxed">{rec}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suitable Crops */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sprout size={16} className="text-[#1B5E20]" />
                  Suitable Crops
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.suitableCrops.map((crop, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-[#E8F5E9] text-[#1B5E20] rounded-lg text-sm font-bold border border-[#A5D6A7]">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              {/* Crop Fertilizer Recommendations */}
              {result.cropFertilizerRecommendations && result.cropFertilizerRecommendations.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Droplets size={16} className="text-blue-500" />
                    Crop-Specific Fertilizer Guide
                  </h3>
                  <div className="space-y-4">
                    {result.cropFertilizerRecommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h4 className="font-black text-earth text-lg mb-2">{rec.crop}</h4>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-gray-500 min-w-[80px]">Type:</span>
                            <span className="text-earth font-medium">{rec.type}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Qty / Acre</span>
                              <span className="block text-blue-900 font-black text-base leading-tight">{rec.quantityPerAcre}</span>
                            </div>
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                              <span className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Frequency</span>
                              <span className="block text-green-900 font-black text-base leading-tight">{rec.frequency}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 mt-1">
                            <span className="font-bold text-gray-500 min-w-[80px]">Method:</span>
                            <span className="text-earth font-medium">{rec.applicationMethod}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full mt-4 bg-white text-earth border-2 border-gray-200 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all"
              >
                Test Another Sample
              </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
