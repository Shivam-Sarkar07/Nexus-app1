import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Play } from 'lucide-react';
import { AppData } from '../types';
import { getGeminiRecommendations } from '../services/geminiService';
import { Link } from 'react-router-dom';

interface FloatingChatProps {
  apps: AppData[];
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  recommendations?: AppData[];
}

export const FloatingChat: React.FC<FloatingChatProps> = ({ apps }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I am the AppVault AI. Tell me what kind of app you need, and I will find it for you.' }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const recommendedIds = await getGeminiRecommendations(userMsg, apps);
      const recommendedApps = apps.filter(a => recommendedIds.includes(a.id));
      
      const aiResponse: Message = {
        role: 'ai',
        text: recommendedApps.length > 0 
          ? `I found ${recommendedApps.length} apps that match your request!` 
          : "I couldn't find an exact match, but try checking our categories.",
        recommendations: recommendedApps
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the mainframe right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 z-40 bg-gradient-to-r from-vault-accent to-blue-600 text-white p-4 rounded-full shadow-lg shadow-purple-500/30 transition-transform hover:scale-105 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 right-4 z-40 w-full max-w-sm bg-vault-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-vault-800 p-4 border-b border-white/5 flex justify-between items-center">
               <div className="flex items-center space-x-2">
                 <Sparkles className="w-5 h-5 text-vault-accent" />
                 <span className="font-bold text-white">AppVault AI</span>
               </div>
               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-vault-900">
               {messages.map((m, idx) => (
                 <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-xl text-sm max-w-[85%] ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-vault-800 text-gray-200 rounded-bl-none border border-white/5'
                    }`}>
                       {m.text}
                    </div>
                    {/* Render Apps if any */}
                    {m.recommendations && m.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2 w-full">
                        {m.recommendations.map(app => (
                          <Link to={`/runner?id=${app.id}`} onClick={() => setIsOpen(false)} key={app.id} className="flex items-center p-2 bg-vault-800/80 border border-vault-700 rounded-lg hover:border-vault-accent transition-colors">
                            <img src={app.icon} className="w-8 h-8 rounded mr-3 bg-gray-700" alt="" />
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-xs truncate">{app.name}</p>
                               <p className="text-[10px] text-gray-400 truncate">{app.category}</p>
                            </div>
                            <Play className="w-3 h-3 text-vault-accent" />
                          </Link>
                        ))}
                      </div>
                    )}
                 </div>
               ))}
               {loading && (
                 <div className="flex items-center space-x-1 text-gray-500 text-xs ml-2">
                   <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                   <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                 </div>
               )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-vault-800 border-t border-white/5 flex gap-2">
              <input 
                className="flex-1 bg-vault-900 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-vault-accent"
                placeholder="Type your request..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button disabled={loading} type="submit" className="bg-vault-accent hover:bg-vault-accentHover text-white p-2 rounded-full">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};