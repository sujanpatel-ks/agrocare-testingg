import React from 'react';
import { Search, Bell, ThumbsUp, MessageSquare, Share2, Edit3, Mic, ChevronDown, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { DISCUSSIONS } from '../constants';

import { Language } from '../types';

interface CommunityProps {
  onBack: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const Community: React.FC<CommunityProps> = ({ onBack, language, onToggleLanguage }) => {
  return (
    <div className="flex flex-col h-screen bg-soil max-w-md mx-auto relative overflow-hidden">
      <header className="bg-primary-dark text-white p-4 pt-12 pb-6 rounded-b-[24px] shadow-lg z-10 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users size={32} />
            <div>
              <h1 className="font-bold text-xl leading-none">Community</h1>
              <p className="text-xs text-green-200 opacity-90">Peer-to-Peer Advice</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-1 flex items-center border border-green-400 relative w-24 h-8 cursor-pointer" onClick={onToggleLanguage}>
              <motion.div 
                className="absolute bg-white rounded-full h-6 w-7 shadow-sm"
                animate={{ x: language === 'en' ? 0 : language === 'hi' ? 30 : 60 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'en' ? 'text-primary-dark' : 'text-white'}`}>EN</button>
              <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'hi' ? 'text-primary-dark' : 'text-white'}`}>HI</button>
              <button className={`relative z-10 flex-1 text-[8px] font-black transition-colors ${language === 'kn' ? 'text-primary-dark' : 'text-white'}`}>KN</button>
            </div>
            <button className="p-2 rounded-full hover:bg-primary transition">
              <Bell size={24} />
            </button>
          </div>
        </div>
        <div className="relative">
          <input 
            className="w-full bg-white/10 border border-green-400/30 text-white placeholder-green-100/70 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:bg-white/20 focus:border-green-300 transition-colors backdrop-blur-sm" 
            placeholder="Search crops, pests, or topics..." 
            type="text"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200" size={20} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar pt-4">
        <div className="flex overflow-x-auto gap-3 px-4 mb-6 hide-scrollbar">
          <button className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shadow-sm">All Topics</button>
          {['Disease Control', 'Fertilizers', 'Market Prices'].map((topic, i) => (
            <button key={i} className="bg-white text-earth border border-gray-200 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
              {topic}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-end px-5 mb-4">
          <h2 className="text-lg font-bold text-earth">Top Discussions</h2>
          <button className="text-primary text-sm font-semibold flex items-center">
            Sort by: Newest <ChevronDown size={16} className="ml-1" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {DISCUSSIONS.map((post, index) => (
            <motion.article 
              key={post.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    post.authorInitials === 'RS' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {post.authorInitials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-earth text-lg leading-tight mb-1">{post.title}</h3>
                    <p className="text-xs text-gray-500 mb-2">{post.author} • {post.location} • {post.time}</p>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-2 mb-3">
                      {post.tags.map((tag, i) => (
                        <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          tag === 'PestControl' || tag === 'Disease' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
                <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary">
                  <ThumbsUp size={18} />
                  <span className="text-xs font-semibold">{post.likes} Helpful</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-600 hover:text-primary">
                  <MessageSquare size={18} />
                  <span className="text-xs font-semibold">{post.comments} Comments</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-primary">
                  <Share2 size={18} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </main>

      {/* FAB */}
      <div className="absolute bottom-32 right-5 z-40">
        <button className="bg-primary hover:bg-primary-dark text-white rounded-full p-4 flex items-center gap-2 shadow-xl transition-transform active:scale-95">
          <Edit3 size={24} />
          <span className="font-bold pr-1">Ask Community</span>
        </button>
      </div>

      {/* Voice Bar */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button className="bg-earth rounded-full h-14 w-14 flex items-center justify-center shadow-lg border-4 border-white hover:scale-105 transition-transform">
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};
