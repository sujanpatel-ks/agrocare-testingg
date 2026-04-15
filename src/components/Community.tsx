import React, { useState } from 'react';
import { Search, Bell, ThumbsUp, MessageSquare, Share2, Edit3, Mic, ChevronDown, Users, Image as ImageIcon, Video, BarChart2, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DISCUSSIONS } from '../constants';
import { Language, Discussion } from '../types';

interface CommunityProps {
  onBack: () => void;
  language: Language;
  onToggleLanguage: (lang?: Language) => void;
  onNavigate: (screen: any) => void;
}

export const Community: React.FC<CommunityProps> = ({ onBack, language, onToggleLanguage, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [discussions, setDiscussions] = useState<Discussion[]>(DISCUSSIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [mediaPreview, setMediaPreview] = useState<{type: 'image'|'video', url: string} | null>(null);

  const filteredDiscussions = discussions.filter(post => {
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query)) ||
      post.author.toLowerCase().includes(query)
    );
  });

  const handleUpvote = (id: string) => {
    setDiscussions(prev => prev.map(post => {
      if (post.id === id) {
        const isUpvoting = !post.hasUpvoted;
        return {
          ...post,
          hasUpvoted: isUpvoting,
          likes: post.likes + (isUpvoting ? 1 : -1)
        };
      }
      return post;
    }));
  };

  const handlePollVote = (postId: string, optionId: string) => {
    setDiscussions(prev => prev.map(post => {
      if (post.id === postId && post.poll && !post.poll.userVotedOption) {
        const updatedOptions = post.poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...post,
          poll: {
            ...post.poll,
            options: updatedOptions,
            totalVotes: post.poll.totalVotes + 1,
            userVotedOption: optionId
          }
        };
      }
      return post;
    }));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSimulateMediaUpload = (type: 'image' | 'video') => {
    if (type === 'image') {
      setMediaPreview({ type: 'image', url: 'https://picsum.photos/seed/newpost/400/300' });
    } else {
      setMediaPreview({ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' });
    }
  };

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Discussion = {
      id: Date.now().toString(),
      author: 'Current User',
      authorInitials: 'CU',
      location: 'Your Farm',
      time: 'Just now',
      title: newPostTitle,
      content: newPostContent,
      tags: ['General'],
      likes: 0,
      comments: 0,
      hasUpvoted: false,
    };

    if (mediaPreview) {
      newPost.media = [mediaPreview];
    }

    if (showPollForm && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      newPost.poll = {
        question: pollQuestion,
        options: pollOptions.filter(o => o.trim()).map((opt, i) => ({
          id: `new_p_${i}`,
          text: opt,
          votes: 0
        })),
        totalVotes: 0
      };
    }

    setDiscussions([newPost, ...discussions]);
    setIsCreateModalOpen(false);
    
    // Reset form
    setNewPostTitle('');
    setNewPostContent('');
    setShowPollForm(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setMediaPreview(null);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-soil">
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
        <div className="relative mt-6">
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-green-400/30 text-white placeholder-green-100/70 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:bg-white/20 focus:border-green-300 transition-colors backdrop-blur-sm" 
            placeholder="Search crops, pests, or topics..." 
            type="text"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200" size={20} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain pb-32 pt-4 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Scheme Finder Banner */}
        <div className="px-4 mb-6">
          <button 
            onClick={() => onNavigate('scheme-finder')}
            className="w-full bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-4 rounded-2xl shadow-lg flex items-center justify-between group hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <span className="text-2xl">🏛️</span>
              </div>
              <div className="text-left">
                <h3 className="text-white font-black text-lg leading-tight">Govt Schemes</h3>
                <p className="text-green-100 text-xs font-medium mt-0.5">Find subsidies & loans you qualify for</p>
              </div>
            </div>
            <div className="bg-white text-[#1B5E20] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
              Check Now
            </div>
          </button>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-6">
          {filteredDiscussions.length > 0 ? (
            filteredDiscussions.map((post, index) => (
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
                      post.authorInitials === 'RS' ? 'bg-orange-100 text-orange-700' : 
                      post.authorInitials === 'AS' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {post.authorInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-earth text-lg leading-tight mb-1">{post.title}</h3>
                      <p className="text-xs text-gray-500 mb-2">{post.author} • {post.location} • {post.time}</p>
                      <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                      
                      {/* Media Rendering */}
                      {post.media && post.media.length > 0 && (
                        <div className={`grid gap-2 mb-3 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {post.media.map((m, i) => (
                            <div key={i} className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-video relative">
                              {m.type === 'video' ? (
                                <video src={m.url} controls className="w-full h-full object-cover" />
                              ) : (
                                <img src={m.url} alt="Post media" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Legacy Image Rendering */}
                      {!post.media && post.image && (
                        <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-video relative mb-3">
                          <img src={post.image} alt="Post media" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Poll Rendering */}
                      {post.poll && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
                          <h4 className="font-bold text-earth text-sm mb-3 flex items-center gap-2">
                            <BarChart2 size={16} className="text-primary" />
                            {post.poll.question}
                          </h4>
                          <div className="space-y-2">
                            {post.poll.options.map((opt) => {
                              const percentage = post.poll!.totalVotes > 0 
                                ? Math.round((opt.votes / post.poll!.totalVotes) * 100) 
                                : 0;
                              const isVoted = post.poll!.userVotedOption === opt.id;
                              
                              return (
                                <button 
                                  key={opt.id}
                                  onClick={() => handlePollVote(post.id, opt.id)}
                                  disabled={!!post.poll!.userVotedOption}
                                  className={`w-full relative overflow-hidden rounded-lg border p-3 text-left transition-all ${
                                    isVoted ? 'border-primary bg-green-50' : 'border-gray-200 bg-white hover:border-primary/50'
                                  }`}
                                >
                                  {post.poll!.userVotedOption && (
                                    <div 
                                      className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  )}
                                  <div className="relative z-10 flex justify-between items-center">
                                    <span className={`text-sm font-medium ${isVoted ? 'text-primary-dark' : 'text-gray-700'}`}>
                                      {opt.text}
                                    </span>
                                    {post.poll!.userVotedOption && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500">{percentage}%</span>
                                        {isVoted && <CheckCircle2 size={16} className="text-primary" />}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-3 text-right">{post.poll.totalVotes} votes</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.tags.map((tag, i) => (
                          <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            tag === 'PestControl' || tag === 'Disease' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                          }`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-100">
                  <button 
                    onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${post.hasUpvoted ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
                  >
                    <ThumbsUp size={18} className={post.hasUpvoted ? 'fill-current' : ''} />
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
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Search className="mx-auto mb-3 opacity-50" size={32} />
              <p>No discussions found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* FAB and Voice Bar Container */}
        <div className="px-5 pb-8 flex flex-col items-end gap-4">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white rounded-full p-4 flex items-center gap-2 shadow-xl transition-transform active:scale-95 self-end"
          >
            <Edit3 size={24} />
            <span className="font-bold pr-1">Ask Community</span>
          </button>
          <div className="w-full flex justify-center">
            <button className="bg-earth rounded-full h-14 w-14 flex items-center justify-center shadow-lg border-4 border-white hover:scale-105 transition-transform">
              <Mic className="text-white" size={24} />
            </button>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-lg text-earth">Create Post</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1">
                <input 
                  type="text" 
                  placeholder="Title of your discussion..."
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="w-full text-lg font-bold text-earth placeholder-gray-400 border-none focus:ring-0 p-0 mb-4"
                />
                <textarea 
                  placeholder="Share your question, experience, or advice..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  className="w-full text-gray-700 placeholder-gray-400 border-none focus:ring-0 p-0 min-h-[100px] resize-none"
                />

                {/* Media Preview */}
                {mediaPreview && (
                  <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video">
                    <button 
                      onClick={() => setMediaPreview(null)}
                      className="absolute top-2 right-2 z-10 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                    >
                      <X size={16} />
                    </button>
                    {mediaPreview.type === 'video' ? (
                      <video src={mediaPreview.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={mediaPreview.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                {/* Poll Form */}
                {showPollForm && (
                  <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                        <BarChart2 size={16} /> Create Poll
                      </h3>
                      <button onClick={() => setShowPollForm(false)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Ask a question..."
                      value={pollQuestion}
                      onChange={e => setPollQuestion(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400"
                    />
                    <div className="space-y-2">
                      {pollOptions.map((opt, i) => (
                        <input 
                          key={i}
                          type="text" 
                          placeholder={`Option ${i + 1}`}
                          value={opt}
                          onChange={e => handlePollOptionChange(i, e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                        />
                      ))}
                    </div>
                    {pollOptions.length < 4 && (
                      <button 
                        onClick={handleAddPollOption}
                        className="text-blue-600 text-sm font-medium mt-3 hover:underline"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSimulateMediaUpload('image')}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-green-50 rounded-full transition-colors"
                      title="Add Image"
                    >
                      <ImageIcon size={22} />
                    </button>
                    <button 
                      onClick={() => handleSimulateMediaUpload('video')}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-green-50 rounded-full transition-colors"
                      title="Add Video"
                    >
                      <Video size={22} />
                    </button>
                    <button 
                      onClick={() => setShowPollForm(!showPollForm)}
                      className={`p-2 rounded-full transition-colors ${showPollForm ? 'text-primary bg-green-50' : 'text-gray-500 hover:text-primary hover:bg-green-50'}`}
                      title="Add Poll"
                    >
                      <BarChart2 size={22} />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={!newPostTitle.trim() || !newPostContent.trim()}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Post Discussion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

