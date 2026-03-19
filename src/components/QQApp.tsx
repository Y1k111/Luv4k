import { useState, ReactNode, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, MessageCircle, Users, CircleDashed, User, 
  Search, Edit, Camera, UserPlus, Tags, ChevronRight, BookOpen,
  Send, Image as ImageIcon, Mic, Plus as PlusIcon, X, Check, Video
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface Chat {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  avatar: string;
  isImage?: boolean;
  persona?: string;
  nickname?: string;
  displayId?: string;
  isPinned?: boolean;
  background?: string;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  persona?: string;
}

interface NewFriend {
  id: string;
  name: string;
  avatar: string;
  greeting: string;
  persona: string;
}

export default function QQApp({ onBack }: { onBack: () => void, key?: string }) {
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'discover' | 'me'>('contacts');
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showNewFriends, setShowNewFriends] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const [chats, setChats] = useState<Chat[]>([
    { id: '1', name: 'AI 助手 (GPT-4)', message: '我已经准备好协助你了。', time: '14:20', unread: 3, avatar: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
    { id: '2', name: 'Claude 3 Opus', message: '关于你刚才提到的代码架构...', time: '昨天', unread: 0, avatar: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { id: '3', name: 'Gemini Pro', message: '这是一张根据你描述生成的图片。', time: '星期二', unread: 0, avatar: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
    { id: '4', name: 'DeepSeek Coder', message: '这个 Bug 的原因在于异步状态更新...', time: '星期一', unread: 0, avatar: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    { id: 'c1', name: 'Claude 3 Opus', avatar: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { id: 'c2', name: 'DeepSeek Coder', avatar: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
    { id: 'c3', name: 'Gemini Pro', avatar: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
    { id: 'c4', name: 'GPT-4', avatar: 'bg-gradient-to-br from-indigo-500 to-purple-500' }
  ]);

  const [newFriends, setNewFriends] = useState<NewFriend[]>([]);

  // Group contacts by first letter
  const contactGroups = contacts.reduce((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sortedGroups = Object.keys(contactGroups).sort().map(letter => ({
    letter,
    items: contactGroups[letter].sort((a, b) => a.name.localeCompare(b.name))
  }));

  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleAddPersona = (persona: any, asNewFriend: boolean, greeting: string) => {
    const newId = Date.now().toString();
    const avatarClass = persona.avatar || 'bg-gradient-to-br from-pink-500 to-rose-500';
    
    if (asNewFriend) {
      setNewFriends(prev => [{
        id: newId,
        name: persona.name,
        avatar: avatarClass,
        greeting: greeting,
        persona: persona.details
      }, ...prev]);
    } else {
      setContacts(prev => [...prev, {
        id: newId,
        name: persona.name,
        avatar: avatarClass,
        persona: persona.details
      }]);
    }
    setIsAddingPersona(false);
  };

  const handleStartNewChat = (contact: Contact) => {
    const existingChat = chats.find(c => c.id === contact.id);
    if (existingChat) {
      setActiveChat(existingChat);
    } else {
      const newChat: Chat = {
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        message: '开始聊天吧...',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        unread: 0,
        persona: contact.persona
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChat(newChat);
    }
    setShowNewChat(false);
  };

  const handleAcceptFriend = (friend: NewFriend) => {
    setContacts(prev => [...prev, {
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      persona: friend.persona
    }]);
    setChats(prev => [{
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      message: friend.greeting,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      unread: 1,
      persona: friend.persona
    }, ...prev]);
    setNewFriends(prev => prev.filter(f => f.id !== friend.id));
  };

  const handleUpdateChat = (id: string, updates: Partial<Chat>) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setActiveChat(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    
    // 同步更新联系人列表中的备注名和头像
    if (updates.name || updates.avatar) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-neutral-950 z-40 flex flex-col text-white overflow-hidden"
    >
      {/* Main App Content */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pt-8 bg-neutral-950/90 backdrop-blur-xl z-10 border-b border-white/5">
          <button onClick={onBack} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors rounded-full active:bg-white/5">
            <ChevronLeft size={26} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-semibold tracking-wide">
            {activeTab === 'chats' && '聊天'}
            {activeTab === 'contacts' && '联系人'}
            {activeTab === 'discover' && '动态'}
            {activeTab === 'me' && '我'}
          </h1>
          <div className="flex items-center gap-3">
            {activeTab === 'chats' && (
              <>
                <button className="text-white/70 hover:text-white transition-colors"><Camera size={22} strokeWidth={1.5} /></button>
                <button onClick={() => setShowNewChat(true)} className="text-white/70 hover:text-white transition-colors"><Edit size={22} strokeWidth={1.5} /></button>
              </>
            )}
            {activeTab === 'contacts' && (
              <button onClick={() => setIsAddingPersona(true)} className="text-white/70 hover:text-white transition-colors">
                <Search size={22} strokeWidth={1.5} />
              </button>
            )}
            {(activeTab === 'discover' || activeTab === 'me') && (
              <button className="text-white/70 hover:text-white transition-colors"><Search size={22} strokeWidth={1.5} /></button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-neutral-950">
          <AnimatePresence mode="wait">
            
            {/* Chats Tab */}
            {activeTab === 'chats' && (
              <motion.div 
                key="chats"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-2 space-y-1"
              >
                {/* Search Bar */}
                <div className="mb-4 mt-2">
                  <div className="bg-white/5 rounded-xl flex items-center px-3 py-2 border border-white/5">
                    <Search size={18} className="text-white/40 mr-2" />
                    <input 
                      type="text" 
                      placeholder="搜索" 
                      className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
                    />
                  </div>
                </div>

                {/* Chat List */}
                {sortedChats.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => setActiveChat(chat)}
                    className={`flex items-center gap-3 py-3 active:scale-[0.98] transition-transform cursor-pointer group ${chat.isPinned ? 'bg-white/5 px-2 -mx-2 rounded-xl' : ''}`}
                  >
                    <Avatar src={chat.avatar} name={chat.name} />
                    <div className="flex-1 min-w-0 border-b border-white/5 pb-4 pt-1 group-last:border-none">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-[15px] font-medium text-white/90 truncate">{chat.name}</h3>
                        <span className={`text-xs shrink-0 ml-2 ${chat.unread > 0 ? 'text-indigo-400 font-medium' : 'text-white/40'}`}>
                          {chat.time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] text-white/50 truncate pr-4">{chat.message}</p>
                        {chat.unread > 0 && (
                          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <motion.div 
                key="contacts"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="pb-6"
              >
                {/* Search Bar */}
                <div className="px-4 mb-2 mt-4">
                  <div className="bg-white/5 rounded-xl flex items-center px-3 py-2 border border-white/5">
                    <Search size={18} className="text-white/40 mr-2" />
                    <input 
                      type="text" 
                      placeholder="搜索" 
                      className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="px-4 py-2">
                  <CategoryItem 
                    icon={<UserPlus size={22} className="text-white" />} 
                    bg="bg-orange-500" 
                    label="新的朋友" 
                    badge={newFriends.length}
                    onClick={() => setShowNewFriends(true)}
                  />
                  <CategoryItem icon={<Users size={22} className="text-white" />} bg="bg-emerald-500" label="群聊" />
                  <CategoryItem icon={<Tags size={22} className="text-white" />} bg="bg-blue-500" label="标签" />
                </div>

                {/* Alphabetical List */}
                <div className="mt-2">
                  {sortedGroups.map(group => (
                    <div key={group.letter}>
                      <div className="px-4 py-1 bg-white/5 text-white/40 text-xs font-medium">
                        {group.letter}
                      </div>
                      <div className="px-4">
                        {group.items.map((contact) => (
                          <div key={contact.id} className="flex items-center gap-3 py-3 active:bg-white/5 transition-colors cursor-pointer group">
                            <Avatar src={contact.avatar} name={contact.name} size="sm" />
                            <div className="flex-1 min-w-0 border-b border-white/5 pb-3 pt-1 group-last:border-none">
                              <h3 className="text-[15px] font-medium text-white/90 truncate mt-1">{contact.name}</h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Other tabs placeholders */}
            {(activeTab === 'discover' || activeTab === 'me') && (
              <motion.div 
                key="other"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-white/30"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {activeTab === 'discover' && <CircleDashed size={32} className="text-white/20" />}
                  {activeTab === 'me' && <User size={32} className="text-white/20" />}
                </div>
                <p className="text-sm font-medium">内容开发中...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-around items-center pb-6 pt-3 px-2 bg-neutral-950/90 backdrop-blur-xl border-t border-white/5">
          <NavItem 
            icon={<MessageCircle size={24} strokeWidth={activeTab === 'chats' ? 2.5 : 1.5} />} 
            label="聊天" 
            active={activeTab === 'chats'} 
            onClick={() => setActiveTab('chats')} 
            badge={chats.reduce((acc, chat) => acc + chat.unread, 0)}
          />
          <NavItem 
            icon={<Users size={24} strokeWidth={activeTab === 'contacts' ? 2.5 : 1.5} />} 
            label="联系人" 
            active={activeTab === 'contacts'} 
            onClick={() => setActiveTab('contacts')} 
            badge={newFriends.length}
          />
          <NavItem 
            icon={<CircleDashed size={24} strokeWidth={activeTab === 'discover' ? 2.5 : 1.5} />} 
            label="动态" 
            active={activeTab === 'discover'} 
            onClick={() => setActiveTab('discover')} 
          />
          <NavItem 
            icon={<User size={24} strokeWidth={activeTab === 'me' ? 2.5 : 1.5} />} 
            label="我" 
            active={activeTab === 'me'} 
            onClick={() => setActiveTab('me')} 
          />
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {isAddingPersona && (
          <AddPersonaView 
            key="add-persona"
            onBack={() => setIsAddingPersona(false)} 
            onComplete={handleAddPersona} 
          />
        )}
        {showNewFriends && (
          <NewFriendsView 
            key="new-friends"
            friends={newFriends} 
            onBack={() => setShowNewFriends(false)} 
            onAccept={handleAcceptFriend} 
          />
        )}
        {showNewChat && (
          <NewChatView 
            key="new-chat-view"
            contacts={contacts}
            chats={chats}
            onBack={() => setShowNewChat(false)}
            onSelect={handleStartNewChat}
          />
        )}
        {activeChat && (
          <ChatView 
            key="chat-view"
            chat={activeChat} 
            onBack={() => setActiveChat(null)} 
            onUpdateChat={handleUpdateChat}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Sub-components

function Avatar({ src, name, size = 'md' }: { src: string, name: string, size?: 'sm' | 'md' | 'lg' }) {
  const isUrl = src.startsWith('http') || src.startsWith('data:');
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-3xl'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full shrink-0 flex items-center justify-center shadow-lg relative overflow-hidden ${!isUrl ? src : 'bg-neutral-800'}`}>
      {isUrl ? (
        <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="text-white font-medium">{name[0]}</span>
      )}
    </div>
  );
}

function CategoryItem({ icon, bg, label, badge, onClick }: { icon: ReactNode, bg: string, label: string, badge?: number, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-4 py-3 active:bg-white/5 transition-colors cursor-pointer group">
      <div className={`w-12 h-12 rounded-xl ${bg} shrink-0 flex items-center justify-center shadow-md relative`}>
        {icon}
        {badge ? (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-neutral-950">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="flex-1 min-w-0 border-b border-white/5 pb-4 pt-1 group-last:border-none flex justify-between items-center">
        <h3 className="text-[16px] font-medium text-white/90 mt-1">{label}</h3>
        <ChevronRight size={18} className="text-white/20" />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: { icon: ReactNode, label: string, active: boolean, onClick: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 transition-colors w-16 ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
    >
      <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform duration-300 relative`}>
        {icon}
        {badge ? (
          <div className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white border-2 border-neutral-950">
            {badge}
          </div>
        ) : null}
      </div>
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </button>
  );
}

function AddPersonaView({ onBack, onComplete }: { onBack: () => void, onComplete: (persona: any, asNewFriend: boolean, greeting: string) => void, key?: string }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('secret');
  const [dob, setDob] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [avatar, setAvatar] = useState('');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    const url = prompt('请输入头像URL (留空则使用本地上传):');
    if (url) {
      setAvatar(url);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDone = () => {
    if (!name) {
      alert('请输入姓名');
      return;
    }
    setShowConfirm(true);
  };

  const submitPersona = async (asNewFriend: boolean) => {
    const persona = { name, gender, dob, location, details, avatar };
    let greeting = '';

    if (asNewFriend) {
      setIsGenerating(true);
      try {
        const apiKey = localStorage.getItem('ai_api_key') || process.env.GEMINI_API_KEY;
        const model = localStorage.getItem('ai_model') || 'gemini-3.1-pro-preview';
        
        if (!apiKey) {
          greeting = `你好，我是${name}！`; // Fallback
        } else {
          // Initialize Gemini API
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: model,
            contents: `你是一个新添加好友的AI，你的名字是${name}。你的人设是：${details}。请根据你的人设，生成一句不超过15个字的打招呼内容，表现出你是第一次和用户加上联系方式。`,
          });
          greeting = response.text || `你好，我是${name}！`;
        }
      } catch (error) {
        console.error('Failed to generate greeting:', error);
        greeting = `你好，我是${name}！`;
      }
      setIsGenerating(false);
    }

    onComplete(persona, asNewFriend, greeting);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-950 z-50 flex flex-col text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-8 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">返回</span>
        </button>
        <h1 className="text-base font-medium">添加人设</h1>
        <button onClick={handleDone} className="text-indigo-400 text-sm font-medium pr-2 hover:text-indigo-300 active:scale-95 transition-transform">完成</button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-12 scrollbar-hide relative">
        
        {/* Avatar Upload */}
        <div className="flex justify-center pt-2">
          <div 
            onClick={handleAvatarClick}
            className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} className="text-white/20" />
            )}
            <div className="absolute bottom-0 inset-x-0 h-6 bg-black/50 flex items-center justify-center">
              <span className="text-[9px] text-white/70">编辑</span>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Basic Info */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-lg">
          <FormInput label="姓名" placeholder="例如：李白" value={name} onChange={setName} />
          
          <div className="flex items-center px-4 py-3.5">
            <label className="w-20 text-sm text-white/80">性别</label>
            <select 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none text-right appearance-none cursor-pointer dir-rtl"
            >
              <option value="male" className="bg-neutral-900">男</option>
              <option value="female" className="bg-neutral-900">女</option>
              <option value="other" className="bg-neutral-900">其他</option>
              <option value="secret" className="bg-neutral-900">保密</option>
            </select>
          </div>

          <FormInput label="出生日期" placeholder="YYYY-MM-DD" value={dob} onChange={setDob} />
          <FormInput label="所在地" placeholder="例如：长安" value={location} onChange={setLocation} />
        </div>

        {/* Detailed Persona */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden p-4 shadow-lg">
          <label className="block text-sm text-white/80 mb-3 font-medium">详细人设</label>
          <textarea 
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="描述这个 AI 的性格、背景、说话方式、口头禅等..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none leading-relaxed"
          ></textarea>
        </div>

        {/* World Book Association */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <button className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <BookOpen size={18} />
              </div>
              <span className="text-sm text-white/90 font-medium">关联世界书</span>
            </div>
            <div className="flex items-center gap-1 text-white/40 group-hover:text-white/60 transition-colors">
              <span className="text-xs">未关联</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-lg font-medium text-white mb-2 text-center">是否作为新朋友添加？</h3>
              <p className="text-sm text-white/60 text-center mb-6">
                选择“是”将在“新的朋友”中收到好友申请，AI会根据人设向你打招呼。选择“否”将直接添加到联系人列表。
              </p>
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm text-white/60">正在生成打招呼内容...</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => submitPersona(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    否
                  </button>
                  <button 
                    onClick={() => submitPersona(true)}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                  >
                    是
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FormInput({ label, placeholder, type = "text", value, onChange }: { label: string, placeholder?: string, type?: string, value?: string, onChange?: (val: string) => void }) {
  return (
    <div className="flex items-center px-4 py-3.5">
      <label className="w-20 text-sm text-white/80">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none text-right" 
      />
    </div>
  );
}

function NewFriendsView({ friends, onBack, onAccept }: { friends: NewFriend[], onBack: () => void, onAccept: (friend: NewFriend) => void, key?: string }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-950 z-50 flex flex-col text-white"
    >
      <div className="flex items-center px-4 py-3 pt-8 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">联系人</span>
        </button>
        <h1 className="text-base font-medium ml-4">新的朋友</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/40">
            <UserPlus size={48} className="mb-4 opacity-20" />
            <p>暂无新的好友申请</p>
          </div>
        ) : (
          <div className="space-y-4">
            {friends.map(friend => (
              <div key={friend.id} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                <Avatar src={friend.avatar} name={friend.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[15px] font-medium text-white/90 truncate">{friend.name}</h3>
                    <button 
                      onClick={() => onAccept(friend)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      接受
                    </button>
                  </div>
                  <p className="text-[13px] text-white/60 bg-white/5 p-2 rounded-lg mt-2 inline-block">
                    "{friend.greeting}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NewChatView({ contacts, chats, onBack, onSelect }: { contacts: Contact[], chats: Chat[], onBack: () => void, onSelect: (contact: Contact) => void, key?: string }) {
  const contactGroups = contacts.reduce((acc, contact) => {
    const letter = contact.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sortedGroups = Object.keys(contactGroups).sort().map(letter => ({
    letter,
    items: contactGroups[letter].sort((a, b) => a.name.localeCompare(b.name))
  }));

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-950 z-50 flex flex-col text-white"
    >
      <div className="flex items-center px-4 py-3 pt-8 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">返回</span>
        </button>
        <h1 className="text-base font-medium ml-4">选择联系人</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-4 mb-2 mt-4">
          <div className="bg-white/5 rounded-xl flex items-center px-3 py-2 border border-white/5">
            <Search size={18} className="text-white/40 mr-2" />
            <input 
              type="text" 
              placeholder="搜索" 
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 w-full"
            />
          </div>
        </div>

        <div className="mt-2">
          {sortedGroups.map(group => (
            <div key={group.letter}>
              <div className="px-4 py-1 bg-white/5 text-white/40 text-xs font-medium">
                {group.letter}
              </div>
              <div className="px-4">
                {group.items.map((contact) => {
                  const isAlreadyInChat = chats.some(c => c.id === contact.id);
                  return (
                    <div 
                      key={contact.id} 
                      onClick={() => !isAlreadyInChat && onSelect(contact)}
                      className={`flex items-center gap-3 py-3 transition-colors group ${isAlreadyInChat ? 'opacity-40 cursor-not-allowed' : 'active:bg-white/5 cursor-pointer'}`}
                    >
                      <Avatar src={contact.avatar} name={contact.name} size="sm" />
                      <div className="flex-1 min-w-0 border-b border-white/5 pb-3 pt-1 group-last:border-none flex justify-between items-center">
                        <h3 className="text-[15px] font-medium text-white/90 truncate mt-1">{contact.name}</h3>
                        {isAlreadyInChat && <span className="text-xs text-white/40">已添加</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ChatView({ chat, onBack, onUpdateChat }: { chat: Chat, onBack: () => void, onUpdateChat: (id: string, updates: Partial<Chat>) => void, key?: string }) {
  const [messages, setMessages] = useState([
    { id: '1', text: chat.message, isSelf: false, time: chat.time }
  ]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    const newMsg = {
      id: Date.now().toString(),
      text: userText,
      isSelf: true,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = localStorage.getItem('ai_api_key') || process.env.GEMINI_API_KEY;
      const model = localStorage.getItem('ai_model') || 'gemini-3.1-pro-preview';
      
      if (!apiKey) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: '请先在设置中配置API Key。',
            isSelf: false,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
          setIsTyping(false);
        }, 1000);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      if (!chat.nickname || !chat.displayId) {
        const userPersonaDetails = localStorage.getItem('userPersonaDetails') || '';
        const userNickname = localStorage.getItem('userNickname') || '用户';
        const prompt = `你是一个AI，你的备注名是"${chat.name}"，你的人设是：${chat.persona || '一个乐于助人的AI助手'}。
用户（昵称：${userNickname}，人设：${userPersonaDetails || '无'}）刚才对你说："${userText}"。
请根据你的人设回复用户。同时，为你自己生成一个符合人设的网名（昵称）和一个6到15位的数字、字母或下划线组成的ID。
请严格以JSON格式返回，不要包含其他内容，格式如下：
{
  "reply": "你的回复内容",
  "nickname": "生成的昵称",
  "id": "生成的ID"
}`;
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        const data = JSON.parse(response.text || '{}');
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: data.reply || '你好！',
          isSelf: false,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
        
        onUpdateChat(chat.id, { 
          nickname: data.nickname || '未命名', 
          displayId: data.id || Math.floor(100000 + Math.random() * 900000).toString() 
        });
      } else {
        const userPersonaDetails = localStorage.getItem('userPersonaDetails') || '';
        const userNickname = localStorage.getItem('userNickname') || '用户';
        const prompt = `你是一个AI，你的名字是"${chat.name}"，昵称是"${chat.nickname}"，你的人设是：${chat.persona || '一个乐于助人的AI助手'}。
用户（昵称：${userNickname}，人设：${userPersonaDetails || '无'}）刚才对你说："${userText}"。
请根据你的人设回复用户。`;
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: response.text || '...',
          isSelf: false,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '抱歉，网络开小差了...',
        isSelf: false,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-950 z-50 flex flex-col text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pt-8 bg-neutral-900/90 backdrop-blur-xl border-b border-white/5 z-10">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-medium">{chat.name}</h1>
          <span className="text-[10px] text-emerald-400">在线</span>
        </div>
        <div className="flex items-center gap-1 -mr-2">
          <button className="text-white/70 hover:text-white p-2">
            <Video size={22} strokeWidth={1.5} />
          </button>
          <button onClick={() => setShowSettings(true)} className="text-white/70 hover:text-white p-2">
            <User size={22} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-neutral-950 bg-cover bg-center bg-no-repeat relative"
        style={chat.background ? { backgroundImage: `url(${chat.background})` } : {}}
      >
        {chat.background && <div className="absolute inset-0 bg-black/60 z-0" />}
        <div className="relative z-10 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'} mb-4`}>
              {!msg.isSelf && (
                <div className="mr-2 mt-1">
                  <Avatar src={chat.avatar} name={chat.name} size="sm" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.isSelf ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-neutral-800 text-white/90 rounded-tl-sm'}`}>
                <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="mr-2 mt-1">
                <Avatar src={chat.avatar} name={chat.name} size="sm" />
              </div>
              <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-neutral-800 text-white/90 rounded-tl-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-neutral-900/90 backdrop-blur-xl border-t border-white/5 pb-6">
        <div className="flex items-end gap-2">
          <button className="p-2 text-white/50 hover:text-white transition-colors rounded-full">
            <PlusIcon size={24} strokeWidth={1.5} />
          </button>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-end px-3 py-1.5 min-h-[40px]">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="发送消息..."
              className="w-full bg-transparent text-white placeholder:text-white/30 outline-none resize-none max-h-24 py-1 text-[15px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          {input.trim() ? (
            <button 
              onClick={handleSend}
              className="p-2.5 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 mb-0.5"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          ) : (
            <button className="p-2 text-white/50 hover:text-white transition-colors rounded-full mb-0.5">
              <Mic size={24} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      
      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <ChatSettingsView 
            chat={chat} 
            onBack={() => setShowSettings(false)} 
            onUpdateChat={onUpdateChat}
            onClearHistory={() => setMessages([])}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChatSettingsView({ chat, onBack, onUpdateChat, onClearHistory }: { chat: Chat, onBack: () => void, onUpdateChat: (id: string, updates: Partial<Chat>) => void, onClearHistory: () => void }) {
  const [name, setName] = useState(chat.name || '');
  const [nickname, setNickname] = useState(chat.nickname || '');
  const [displayId, setDisplayId] = useState(chat.displayId || '');
  const [isPinned, setIsPinned] = useState(chat.isPinned || false);
  const [isDnd, setIsDnd] = useState(false);
  const [background, setBackground] = useState(chat.background || '');
  
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');
  const [userNickname, setUserNickname] = useState(localStorage.getItem('userNickname') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userPersonaDetails, setUserPersonaDetails] = useState(localStorage.getItem('userPersonaDetails') || '');

  const bgInputRef = useRef<HTMLInputElement>(null);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (displayId && !/^[a-zA-Z0-9_]{6,15}$/.test(displayId)) {
      alert('AI ID必须是6-15位字母、数字或下划线');
      return;
    }
    if (userId && !/^[a-zA-Z0-9_]{6,15}$/.test(userId)) {
      alert('用户 ID必须是6-15位字母、数字或下划线');
      return;
    }
    
    onUpdateChat(chat.id, {
      name,
      nickname,
      displayId,
      isPinned,
      background
    });

    localStorage.setItem('userAvatar', userAvatar);
    localStorage.setItem('userNickname', userNickname);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userPersonaDetails', userPersonaDetails);

    alert('设置已保存');
    onBack();
  };

  const handleBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBackground(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUserAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-neutral-950 z-50 flex flex-col text-white"
    >
      <div className="flex items-center px-4 py-3 pt-8 bg-neutral-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">返回</span>
        </button>
        <h1 className="text-base font-medium ml-4">聊天设置</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* AI Info */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex items-start gap-4 shadow-lg">
          <Avatar src={chat.avatar} name={name || chat.name} size="lg" />
          <div className="flex flex-col flex-1 gap-2 py-1">
            <div className="relative flex items-center">
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full text-lg font-bold text-white/90 bg-transparent border-b border-white/10 outline-none focus:border-indigo-500 pb-1 pr-6" 
                placeholder="备注名"
              />
              <Edit size={14} className="text-white/30 absolute right-1 bottom-2 pointer-events-none" />
            </div>
            <div className="flex items-center text-sm text-white/60 relative">
              <span className="w-12 shrink-0">昵称：</span>
              <input 
                value={nickname} 
                onChange={e => setNickname(e.target.value)} 
                className="flex-1 bg-transparent border-b border-white/10 outline-none focus:border-indigo-500 pb-0.5 pr-5" 
                placeholder="待生成..."
              />
              <Edit size={12} className="text-white/30 absolute right-1 bottom-1.5 pointer-events-none" />
            </div>
            <div className="flex items-center text-sm text-white/60 relative">
              <span className="w-12 shrink-0">ID：</span>
              <input 
                value={displayId} 
                onChange={e => setDisplayId(e.target.value)} 
                className="flex-1 bg-transparent border-b border-white/10 outline-none focus:border-indigo-500 pb-0.5 pr-5" 
                placeholder="待生成..."
              />
              <Edit size={12} className="text-white/30 absolute right-1 bottom-1.5 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Chat Settings */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden shadow-lg divide-y divide-white/5">
          <div className="px-4 py-3.5 flex justify-between items-center active:bg-white/5 cursor-pointer">
            <span className="text-sm text-white/80">查找聊天记录</span>
            <ChevronRight size={18} className="text-white/20" />
          </div>
          <div 
            className="px-4 py-3.5 flex justify-between items-center active:bg-white/5 cursor-pointer"
            onClick={() => setIsPinned(!isPinned)}
          >
            <span className="text-sm text-white/80">置顶聊天</span>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${isPinned ? 'bg-indigo-500' : 'bg-white/10'}`}>
              <motion.div 
                layout
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                initial={false}
                animate={{ left: isPinned ? '26px' : '2px' }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
          <div 
            className="px-4 py-3.5 flex justify-between items-center active:bg-white/5 cursor-pointer"
            onClick={() => setIsDnd(!isDnd)}
          >
            <span className="text-sm text-white/80">消息免打扰</span>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${isDnd ? 'bg-indigo-500' : 'bg-white/10'}`}>
              <motion.div 
                layout
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
                initial={false}
                animate={{ left: isDnd ? '26px' : '2px' }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Chat Background */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80 font-medium">设置当前聊天背景</span>
            <button onClick={() => setBackground('')} className="text-xs text-white/50 hover:text-white px-2 py-1 rounded bg-white/5">恢复默认</button>
          </div>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => bgInputRef.current?.click()}
              className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 shrink-0 overflow-hidden relative"
            >
              {background ? (
                <img src={background} alt="bg" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-white/20" />
              )}
            </div>
            <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
            <div className="flex-1">
              <input 
                value={background}
                onChange={e => setBackground(e.target.value)}
                placeholder="或输入图片URL..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* User Persona */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 shadow-lg space-y-4">
          <span className="text-sm text-white/80 font-medium block">用户人设 (AI读取)</span>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => userAvatarInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 shrink-0 overflow-hidden relative"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-white/20" />
              )}
            </div>
            <input type="file" ref={userAvatarInputRef} className="hidden" accept="image/*" onChange={handleUserAvatarUpload} />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center text-sm">
                <span className="w-12 text-white/60 shrink-0">昵称：</span>
                <input 
                  value={userNickname}
                  onChange={e => setUserNickname(e.target.value)}
                  placeholder="你的昵称"
                  className="flex-1 bg-transparent border-b border-white/10 outline-none focus:border-indigo-500 pb-0.5 text-white"
                />
              </div>
              <div className="flex items-center text-sm">
                <span className="w-12 text-white/60 shrink-0">ID：</span>
                <input 
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="6-15位字母数字下划线"
                  className="flex-1 bg-transparent border-b border-white/10 outline-none focus:border-indigo-500 pb-0.5 text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <textarea 
              value={userPersonaDetails}
              onChange={e => setUserPersonaDetails(e.target.value)}
              placeholder="详细描述你的人设，AI会根据这些信息与你互动..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none h-24"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors">
            拉黑
          </button>
          <button 
            onClick={() => {
              if (confirm('确定要清空聊天记录吗？')) {
                onClearHistory();
                alert('已清空');
              }
            }}
            className="w-full py-3 rounded-xl bg-white/5 text-white/90 font-medium text-sm hover:bg-white/10 transition-colors"
          >
            清空聊天记录
          </button>
          <button 
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
          >
            保存设置
          </button>
        </div>
      </div>
    </motion.div>
  );
}
