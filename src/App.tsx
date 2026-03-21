/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Battery, 
  Wifi, 
  Signal, 
  Settings, 
  MessageCircle, 
  Music, 
  CloudRain, 
  Bot,
  Sparkles,
  BookOpen
} from 'lucide-react';
import SettingsApp from './components/Settings';
import QQApp from './components/QQApp';
import MusicApp from './components/MusicApp';

export default function App() {
  const [time, setTime] = useState(new Date());
  const [activeApp, setActiveApp] = useState<'home' | 'settings' | 'qq' | 'music' | 'worldbook'>('home');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });

  const formattedDate = time.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  return (
    <div className="h-screen w-full bg-black font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      {/* Screen Content */}
      <div className="flex-1 relative overflow-hidden bg-neutral-900">
          {/* Premium Atmospheric Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-black to-neutral-950 z-0"></div>
          <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[50%] bg-indigo-600/20 blur-[100px] rounded-full mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen"></div>

          <AnimatePresence mode="wait">
            {activeApp === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex flex-col h-full p-6 pt-[max(env(safe-area-inset-top),2rem)]"
              >
                
                <div className="flex flex-col gap-4 mb-auto mt-8">
                  {/* Widget 1: Time & Weather (Glassmorphism) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                      <CloudRain size={64} />
                    </div>
                    <h1 className="text-5xl font-display font-light tracking-tighter text-white mb-2">
                      {formattedTime}
                    </h1>
                    <p className="text-white/60 text-sm font-medium">{formattedDate}</p>
                    <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                      <CloudRain size={16} className="text-blue-400" />
                      <span>18°C · 小雨转阴</span>
                    </div>
                  </motion.div>

                  {/* Widget 2: AI Status (Premium glowing card) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-5 shadow-lg relative overflow-hidden group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={14} className="text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI Assistant</span>
                        </div>
                        <h2 className="text-lg font-medium text-white mt-1">随时准备对话</h2>
                        <p className="text-white/50 text-xs mt-1">API 已连接 · 延迟 24ms</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Bot size={20} className="text-indigo-300" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-y-6 gap-x-4 mt-8">
                  {/* App 1: Settings */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setActiveApp('settings')}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="w-[60px] h-[60px] bg-gradient-to-b from-neutral-600 to-neutral-800 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-active:scale-95 transition-transform">
                      <Settings size={28} className="text-white/90" />
                    </div>
                    <span className="text-white/80 text-[11px] font-medium">设置</span>
                  </motion.div>

                  {/* App 2: QQ (Chat) */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setActiveApp('qq')}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="w-[60px] h-[60px] bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-active:scale-95 transition-transform relative">
                      <MessageCircle size={28} className="text-white fill-white/20" />
                    </div>
                    <span className="text-white/80 text-[11px] font-medium">QQ</span>
                  </motion.div>

                  {/* App 3: Music */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => setActiveApp('music')}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="w-[60px] h-[60px] bg-gradient-to-b from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-active:scale-95 transition-transform">
                      <Music size={28} className="text-white" />
                    </div>
                    <span className="text-white/80 text-[11px] font-medium">音乐</span>
                  </motion.div>

                  {/* App 4: World Book */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => setActiveApp('worldbook')}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="w-[60px] h-[60px] bg-gradient-to-b from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-active:scale-95 transition-transform">
                      <BookOpen size={28} className="text-white" />
                    </div>
                    <span className="text-white/80 text-[11px] font-medium">世界书</span>
                  </motion.div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-[max(env(safe-area-inset-bottom),8px)] left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full"></div>
              </motion.div>
            )}

            {activeApp === 'settings' && (
              <SettingsApp key="settings" onBack={() => setActiveApp('home')} />
            )}

            {activeApp === 'qq' && (
              <QQApp key="qq" onBack={() => setActiveApp('home')} />
            )}

            {activeApp === 'music' && (
              <MusicApp key="music" onBack={() => setActiveApp('home')} />
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}
