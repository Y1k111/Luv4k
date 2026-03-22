import { useState, ReactNode, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, MessageCircle, Users, CircleDashed, User, 
  Search, Edit, Camera, UserPlus, Tags, ChevronRight, BookOpen,
  Send, Image as ImageIcon, Mic, Plus as PlusIcon, X, Check, Video,
  Wallet, Star, Edit2, FileText, RefreshCw, MoreHorizontal, Music, Play
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { pinyin } from 'pinyin-pro';

interface Chat {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  avatar: string;
  isImage?: boolean;
  persona?: string;
  gender?: string;
  dob?: string;
  location?: string;
  nickname?: string;
  displayId?: string;
  isPinned?: boolean;
  background?: string;
  userAvatar?: string;
  userNickname?: string;
  userId?: string;
  userPersonaDetails?: string;
  contextCount?: number;
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  persona?: string;
  gender?: string;
  dob?: string;
  location?: string;
  nickname?: string;
  displayId?: string;
}

interface NewFriend {
  id: string;
  name: string;
  avatar: string;
  greeting: string;
  persona: string;
  gender?: string;
  dob?: string;
  location?: string;
}

const getInitialLetter = (name: string) => {
  if (!name) return '#';
  const firstChar = name.charAt(0);
  if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase();
  const py = pinyin(firstChar, { pattern: 'first', toneType: 'none' });
  if (py && /[a-zA-Z]/.test(py[0])) return py[0].toUpperCase();
  return '#';
};

export default function QQApp({ onBack }: { onBack: () => void, key?: string }) {
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'discover' | 'me'>('contacts');
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showNewFriends, setShowNewFriends] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [accounts, setAccounts] = useState<any[]>(() => {
    const saved = localStorage.getItem('qq_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const oldProfile = localStorage.getItem('qq_user_profile');
    if (oldProfile) {
      try {
        const p = JSON.parse(oldProfile);
        return [{ ...p, id: 'default', personaDetails: localStorage.getItem('userPersonaDetails') || '' }];
      } catch (e) {}
    }
    return [{
      id: 'default',
      name: 'User',
      qqId: '12345678',
      avatar: 'https://picsum.photos/seed/user/200/200',
      background: 'https://picsum.photos/seed/bg/600/400',
      statusIcon: '👋',
      statusText: 'Hello World',
      personaDetails: ''
    }];
  });

  const [activeAccountId, setActiveAccountId] = useState(() => {
    return localStorage.getItem('qq_active_account_id') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('qq_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('qq_active_account_id', activeAccountId);
  }, [activeAccountId]);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const updateActiveAccount = (updates: any) => {
    setAccounts(prev => prev.map(a => a.id === activeAccount.id ? { ...a, ...updates } : a));
  };

  const switchAccount = (id: string) => {
    setActiveAccountId(id);
  };

  const createAccount = () => {
    const newId = Date.now().toString();
    const newAcc = {
      id: newId,
      name: `User_${newId.slice(-4)}`,
      qqId: Math.floor(Math.random() * 100000000).toString(),
      avatar: `https://picsum.photos/seed/${newId}/200/200`,
      background: `https://picsum.photos/seed/bg_${newId}/600/400`,
      statusIcon: '✨',
      statusText: 'New Account',
      personaDetails: ''
    };
    setAccounts(prev => [...prev, newAcc]);
    setActiveAccountId(newId);
  };

  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('qq_chats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('qq_contacts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [newFriends, setNewFriends] = useState<NewFriend[]>(() => {
    const saved = localStorage.getItem('qq_new_friends');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('qq_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('qq_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('qq_new_friends', JSON.stringify(newFriends));
  }, [newFriends]);

  // Group contacts by first letter
  const contactGroups = contacts.reduce((acc, contact) => {
    const letter = getInitialLetter(contact.name);
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sortedGroups = Object.keys(contactGroups).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  }).map(letter => ({
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
        persona: persona.details,
        gender: persona.gender,
        dob: persona.dob,
        location: persona.location
      }, ...prev]);
    } else {
      setContacts(prev => [...prev, {
        id: newId,
        name: persona.name,
        avatar: avatarClass,
        persona: persona.details,
        gender: persona.gender,
        dob: persona.dob,
        location: persona.location
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
        persona: contact.persona,
        gender: contact.gender,
        dob: contact.dob,
        location: contact.location,
        nickname: contact.nickname,
        displayId: contact.displayId
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
      persona: friend.persona,
      gender: friend.gender,
      dob: friend.dob,
      location: friend.location
    }]);
    setChats(prev => [{
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      message: friend.greeting,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      unread: 1,
      persona: friend.persona,
      gender: friend.gender,
      dob: friend.dob,
      location: friend.location
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
        <div className="flex items-center justify-between px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-950/90 backdrop-blur-xl z-10 border-b border-white/5">
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
                className="px-4 py-2 space-y-1 pb-[max(env(safe-area-inset-bottom),2rem)]"
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
                    onClick={() => {
                      setActiveChat(chat);
                      if (chat.unread > 0) {
                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                      }
                    }}
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
                <div className="mt-2 pb-[max(env(safe-area-inset-bottom),2rem)]">
                  {sortedGroups.map(group => (
                    <div key={group.letter}>
                      <div className="px-4 py-1 bg-white/5 text-white/40 text-xs font-medium">
                        {group.letter}
                      </div>
                      <div className="px-4">
                        {group.items.map((contact) => (
                          <div 
                            key={contact.id} 
                            onClick={() => setSelectedContact(contact)}
                            className="flex items-center gap-3 py-3 active:bg-white/5 transition-colors cursor-pointer group"
                          >
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
            
            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <motion.div 
                key="other"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full text-white/30"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CircleDashed size={32} className="text-white/20" />
                </div>
                <p className="text-sm font-medium">内容开发中...</p>
              </motion.div>
            )}

            {activeTab === 'me' && (
              <MeTab 
                profile={activeAccount} 
                onUpdateProfile={updateActiveAccount} 
                accounts={accounts}
                activeAccountId={activeAccountId}
                onSwitchAccount={switchAccount}
                onCreateAccount={createAccount}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-around items-center pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-3 px-2 bg-neutral-950/90 backdrop-blur-xl border-t border-white/5">
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
            accounts={accounts}
            activeAccountId={activeAccountId}
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
        {selectedContact && (
          <ContactProfileView
            contact={selectedContact}
            onBack={() => setSelectedContact(null)}
            onSendMessage={() => {
              setSelectedContact(null);
              handleStartNewChat(selectedContact);
            }}
            onUpdateContact={(id, updates) => {
              setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
              setChats(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
              setSelectedContact(prev => prev?.id === id ? { ...prev, ...updates } : prev);
            }}
          />
        )}
        {activeChat && (
          <ChatView 
            key="chat-view"
            chat={activeChat} 
            onBack={() => setActiveChat(null)} 
            onUpdateChat={handleUpdateChat}
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSwitchAccount={switchAccount}
            onCreateAccount={createAccount}
            onUpdateActiveAccount={updateActiveAccount}
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

function AddPersonaView({ onBack, onComplete, accounts, activeAccountId }: { onBack: () => void, onComplete: (persona: any, asNewFriend: boolean, greeting: string) => void, accounts?: any[], activeAccountId?: string, key?: string }) {
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
        const apiProvider = localStorage.getItem('ai_api_provider') || 'gemini';
        const apiKey = localStorage.getItem('ai_api_key') || process.env.GEMINI_API_KEY;
        const apiUrl = localStorage.getItem('ai_api_url') || 'https://api.openai.com';
        const model = localStorage.getItem('ai_model') || 'gemini-3-flash-preview';
        const temperature = parseFloat(localStorage.getItem('ai_temperature') || '0.7');
        
        if (!apiKey && apiProvider === 'gemini') {
          greeting = `你好，我是${name}！`; // Fallback
        } else {
          const activeAccount = accounts?.find(a => a.id === activeAccountId) || accounts?.[0];
          const userPersonaText = activeAccount?.personaDetails ? `\n另外，添加你为好友的用户人设是：${activeAccount.personaDetails}。你可以根据这个用户的特点来调整你的打招呼方式。` : '';
          const prompt = `你是一个新添加好友的AI，你的名字是${name}。你的人设是：${details}。${userPersonaText}请根据你的人设，生成一句不超过15个字的打招呼内容，表现出你是第一次和用户加上联系方式。`;
          
          if (apiProvider === 'gemini') {
            // Initialize Gemini API
            const ai = new GoogleGenAI({ apiKey: apiKey! });
            const response = await ai.models.generateContent({
              model: model,
              contents: prompt,
              config: { temperature }
            });
            greeting = response.text || `你好，我是${name}！`;
          } else {
            // Custom API (OpenAI compatible)
            const baseUrl = apiUrl.replace(/\/$/, '');
            const res = await fetch(`${baseUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: temperature
              })
            });
            
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            const data = await res.json();
            greeting = data.choices?.[0]?.message?.content || `你好，我是${name}！`;
          }
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
      <div className="flex items-center justify-between px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">返回</span>
        </button>
        <h1 className="text-base font-medium">添加人设</h1>
        <button onClick={handleDone} className="text-indigo-400 text-sm font-medium pr-2 hover:text-indigo-300 active:scale-95 transition-transform">完成</button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-[max(env(safe-area-inset-bottom),3rem)] scrollbar-hide relative">
        
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
      <div className="flex items-center px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">联系人</span>
        </button>
        <h1 className="text-base font-medium ml-4">新的朋友</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),2rem)]">
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
    const letter = getInitialLetter(contact.name);
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sortedGroups = Object.keys(contactGroups).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  }).map(letter => ({
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
      <div className="flex items-center px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-900/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center -ml-2 p-2">
          <ChevronLeft size={26} strokeWidth={1.5} />
          <span className="text-sm font-medium -ml-1">返回</span>
        </button>
        <h1 className="text-base font-medium ml-4">选择联系人</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),1.5rem)]">
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

function ChatView({ chat, onBack, onUpdateChat, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onUpdateActiveAccount }: { chat: Chat, onBack: () => void, onUpdateChat: (id: string, updates: Partial<Chat>) => void, accounts: any[], activeAccountId: string, onSwitchAccount: (id: string) => void, onCreateAccount: () => void, onUpdateActiveAccount: (updates: any) => void, key?: string }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`qq_messages_${chat.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{ id: '1', text: chat.message, isSelf: false, time: chat.time }];
  });

  useEffect(() => {
    localStorage.setItem(`qq_messages_${chat.id}`, JSON.stringify(messages));
  }, [messages, chat.id]);

  useEffect(() => {
    // Check for pending AI responses
    const pendingResponsesStr = localStorage.getItem('qq_pending_ai_responses');
    if (pendingResponsesStr) {
      try {
        const pendingResponses = JSON.parse(pendingResponsesStr);
        const myPending = pendingResponses.filter((p: any) => p.chatId === chat.id);
        if (myPending.length > 0) {
          // Process the first pending response
          const pending = myPending[0];
          
          // Remove it from the queue
          const remaining = pendingResponses.filter((p: any) => p !== pending);
          localStorage.setItem('qq_pending_ai_responses', JSON.stringify(remaining));

          // Trigger AI reply with the prompt
          handleRequestAIReply(pending.prompt);
        }
      } catch (e) {}
    }
  }, [messages, chat.id]);

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
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
  };

  const handleRequestAIReply = async (customPrompt?: string) => {
    if (isTyping) return;
    setIsTyping(true);

    try {
      const apiProvider = localStorage.getItem('ai_api_provider') || 'gemini';
      const apiKey = localStorage.getItem('ai_api_key') || process.env.GEMINI_API_KEY;
      const apiUrl = localStorage.getItem('ai_api_url') || 'https://api.openai.com';
      const model = localStorage.getItem('ai_model') || 'gemini-3-flash-preview';
      const temperature = parseFloat(localStorage.getItem('ai_temperature') || '0.7');
      
      if (!apiKey && apiProvider === 'gemini') {
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

      const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
      const userPersonaDetails = chat.userPersonaDetails || activeAccount.personaDetails || '';
      const userNickname = chat.userNickname || activeAccount.name || '用户';
      
      const contextCount = chat.contextCount || 10;
      const recentMessages = messages.slice(-contextCount).map(m => `${m.isSelf ? userNickname : chat.nickname || chat.name}: ${m.text}`).join('\n');
      
      if (!chat.nickname || !chat.displayId) {
        const prompt = `你是一个AI，你的备注名是"${chat.name}"，你的人设是：${chat.persona || '一个乐于助人的AI助手'}。
用户（昵称：${userNickname}，人设：${userPersonaDetails || '无'}）正在手机上和你进行线上聊天。
请像真人发微信/QQ一样回复，不要包含任何动作描写（如*笑了笑*、括号里的动作等）。请简短回复，一条一条发，绝对不要发一大段长篇大论。如果有多句话，请拆分成多条回复。

以下是最近的聊天记录：
${recentMessages}

${customPrompt ? `【系统提示】：${customPrompt}\n` : ''}
请根据你的人设，顺着聊天记录回复用户最新的一句话。同时，为你自己生成一个符合人设的网名（昵称）和一个6到15位的数字、字母或下划线组成的ID。
请严格以JSON格式返回，不要包含其他内容，格式如下：
{
  "replies": ["第一条回复", "第二条回复"],
  "nickname": "生成的昵称",
  "id": "生成的ID"
}`;

        let responseText = '';
        if (apiProvider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: apiKey! });
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature
            }
          });
          responseText = response.text || '{}';
        } else {
          const baseUrl = apiUrl.replace(/\/$/, '');
          const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: prompt }],
              temperature: temperature,
              response_format: { type: "json_object" }
            })
          });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content || '{}';
        }
        
        let data;
        try {
          const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          data = JSON.parse(cleanedText);
        } catch (e) {
          console.error("Failed to parse JSON:", responseText);
          data = { replies: [responseText], nickname: chat.name, id: Math.floor(100000 + Math.random() * 900000).toString() };
        }
        
        const replies = Array.isArray(data.replies) ? data.replies : (data.reply ? [data.reply] : ['你好！']);
        
        for (let i = 0; i < replies.length; i++) {
          const replyText = replies[i];
          if (!replyText.trim()) continue;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-' + i,
            text: replyText,
            isSelf: false,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
          
          if (i < replies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // Simulate typing delay between messages
          }
        }
        
        onUpdateChat(chat.id, { 
          nickname: data.nickname || '未命名', 
          displayId: data.id || Math.floor(100000 + Math.random() * 900000).toString() 
        });
      } else {
        const prompt = `你是一个AI，你的名字是"${chat.name}"，昵称是"${chat.nickname}"，你的人设是：${chat.persona || '一个乐于助人的AI助手'}。
用户（昵称：${userNickname}，人设：${userPersonaDetails || '无'}）正在手机上和你进行线上聊天。
请像真人发微信/QQ一样回复，不要包含任何动作描写（如*笑了笑*、括号里的动作等）。请简短回复，一条一条发，绝对不要发一大段长篇大论。如果有多句话，请拆分成多条回复。

以下是最近的聊天记录：
${recentMessages}

${customPrompt ? `【系统提示】：${customPrompt}\n` : ''}
请根据你的人设，顺着聊天记录回复用户最新的一句话。
请严格以JSON格式返回，不要包含其他内容，格式如下：
{
  "replies": ["第一条回复", "第二条回复"]
}`;

        let responseText = '';
        if (apiProvider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: apiKey! });
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature
            }
          });
          responseText = response.text || '{"replies":["..."]}';
        } else {
          const baseUrl = apiUrl.replace(/\/$/, '');
          const res = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: prompt }],
              temperature: temperature,
              response_format: { type: "json_object" }
            })
          });
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content || '{"replies":["..."]}';
        }
        
        let data;
        try {
          const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          data = JSON.parse(cleanedText);
        } catch (e) {
          console.error("Failed to parse JSON:", responseText);
          data = { replies: [responseText] };
        }
        
        const replies = Array.isArray(data.replies) ? data.replies : (data.reply ? [data.reply] : ['你好！']);
        
        for (let i = 0; i < replies.length; i++) {
          const replyText = replies[i];
          if (!replyText.trim()) continue;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-' + i,
            text: replyText,
            isSelf: false,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
          
          if (i < replies.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // Simulate typing delay between messages
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `抱歉，网络开小差了... (${error?.message || '未知错误'})`,
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
      <div className="flex items-center justify-between px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-900/90 backdrop-blur-xl border-b border-white/5 z-10">
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
                <div className="mr-2 mt-1 shrink-0">
                  <Avatar src={chat.avatar} name={chat.name} size="sm" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${(msg as any).isSelf ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-neutral-800 text-white/90 rounded-tl-sm'}`}>
                {(msg as any).type === 'listen_together' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Music size={16} className="text-white/80" />
                      <span className="text-sm font-medium text-white/90">邀请你一起听</span>
                    </div>
                    <div className="bg-black/20 rounded-xl p-2 flex items-center gap-3">
                      <img src={(msg as any).song?.coverUrl || 'https://picsum.photos/seed/music/100/100'} alt="cover" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{(msg as any).song?.title || '未知歌曲'}</p>
                        <p className="text-xs text-white/60 truncate">{(msg as any).song?.artist || '未知歌手'}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Play size={14} className="text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed break-words">{(msg as any).text}</p>
                )}
              </div>
              {msg.isSelf && (
                <div className="ml-2 mt-1 shrink-0">
                  <Avatar 
                    src={chat.userAvatar || (accounts.find(a => a.id === activeAccountId) || accounts[0]).avatar} 
                    name={chat.userNickname || (accounts.find(a => a.id === activeAccountId) || accounts[0]).name} 
                    size="sm" 
                  />
                </div>
              )}
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
      <div className="p-3 bg-neutral-900/90 backdrop-blur-xl border-t border-white/5 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
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
          <button className="p-2 text-white/50 hover:text-white transition-colors rounded-full mb-0.5">
            <Mic size={24} strokeWidth={1.5} />
          </button>
          <button 
            onClick={input.trim() ? handleSend : handleRequestAIReply}
            className={`p-2.5 rounded-full transition-colors shadow-lg mb-0.5 ${input.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            title={input.trim() ? "发送" : "等待回复"}
          >
            <Send size={18} className={input.trim() ? "ml-0.5" : "-ml-0.5 mt-0.5"} />
          </button>
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
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSwitchAccount={onSwitchAccount}
            onCreateAccount={onCreateAccount}
            onUpdateActiveAccount={onUpdateActiveAccount}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChatSettingsView({ chat, onBack, onUpdateChat, onClearHistory, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onUpdateActiveAccount }: { chat: Chat, onBack: () => void, onUpdateChat: (id: string, updates: Partial<Chat>) => void, onClearHistory: () => void, accounts: any[], activeAccountId: string, onSwitchAccount: (id: string) => void, onCreateAccount: () => void, onUpdateActiveAccount: (updates: any) => void }) {
  const [name, setName] = useState(chat.name || '');
  const [nickname, setNickname] = useState(chat.nickname || '');
  const [displayId, setDisplayId] = useState(chat.displayId || '');
  const [isPinned, setIsPinned] = useState(chat.isPinned || false);
  const [isDnd, setIsDnd] = useState(false);
  const [contextCount, setContextCount] = useState(chat.contextCount || 10);
  const [background, setBackground] = useState(chat.background || '');
  const [showAccountSwitch, setShowAccountSwitch] = useState(false);
  
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const [userAvatar, setUserAvatar] = useState(chat.userAvatar || activeAccount.avatar);
  const [userNickname, setUserNickname] = useState(chat.userNickname || activeAccount.name);
  const [userId, setUserId] = useState(chat.userId || activeAccount.qqId);
  const [userPersonaDetails, setUserPersonaDetails] = useState(chat.userPersonaDetails || activeAccount.personaDetails || '');
  const [localActiveAccountId, setLocalActiveAccountId] = useState(activeAccountId);

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
      background,
      userAvatar,
      userNickname,
      userId,
      userPersonaDetails,
      contextCount
    });

    alert('设置已保存');
    onBack();
  };

  const handleLocalSwitchAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (acc) {
      setUserAvatar(acc.avatar);
      setUserNickname(acc.name);
      setUserId(acc.qqId);
      setUserPersonaDetails(acc.personaDetails || '');
      setLocalActiveAccountId(id);
    }
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
      <div className="flex items-center px-4 py-3 pt-[max(env(safe-area-inset-top),2rem)] bg-neutral-900/80 backdrop-blur-xl border-b border-white/5 shrink-0">
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
            className="px-4 py-3.5 flex justify-between items-center active:bg-white/5 cursor-pointer border-b border-white/5"
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
          <div className="px-4 py-3.5 flex justify-between items-center">
            <span className="text-sm text-white/80">上下文记忆条数</span>
            <input
              type="number"
              value={contextCount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setContextCount(isNaN(val) ? 10 : val);
              }}
              className="w-16 bg-transparent text-right text-white/50 outline-none"
              min="1"
              max="100"
            />
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
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/80 font-medium block">用户人设 (AI读取)</span>
            <button 
              onClick={() => setShowAccountSwitch(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-indigo-500/10 flex items-center gap-1"
            >
              <RefreshCw size={12} />
              切换预设
            </button>
          </div>
          
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
        <div className="space-y-3 pt-2 pb-[max(env(safe-area-inset-bottom),2rem)]">
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

      <AccountSwitchSheet 
        isOpen={showAccountSwitch} 
        onClose={() => setShowAccountSwitch(false)} 
        accounts={accounts} 
        activeAccountId={localActiveAccountId} 
        onSwitchAccount={handleLocalSwitchAccount} 
        onCreateAccount={onCreateAccount} 
      />
    </motion.div>
  );
}

function ImageEditModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (url: string) => void }) {
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSave(event.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h3 className="text-lg font-medium text-white mb-4">更换图片</h3>
        <input 
          type="text" 
          placeholder="输入图片 URL..." 
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 mb-4 outline-none focus:border-indigo-500 transition-colors"
        />
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (url) {
                onSave(url);
                onClose();
              }
            }}
            className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-medium hover:bg-indigo-600 transition-colors"
          >
            保存 URL
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-white/10 text-white rounded-xl py-3 font-medium hover:bg-white/20 transition-colors"
          >
            上传本地
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-3 text-white/50 hover:text-white transition-colors">取消</button>
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      </motion.div>
    </div>
  );
}

function TextInputModal({ isOpen, title, initialValue, onClose, onSave }: { isOpen: boolean, title: string, initialValue: string, onClose: () => void, onSave: (val: string) => void }) {
  const [val, setVal] = useState(initialValue);
  
  useEffect(() => {
    if (isOpen) setVal(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
        <input 
          type="text" 
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 mb-4 outline-none focus:border-indigo-500 transition-colors"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-white/70 hover:text-white bg-white/5 rounded-xl transition-colors">取消</button>
          <button onClick={() => { onSave(val); onClose(); }} className="flex-1 bg-indigo-500 text-white rounded-xl py-3 font-medium hover:bg-indigo-600 transition-colors">保存</button>
        </div>
      </motion.div>
    </div>
  );
}

function MeTab({ profile, onUpdateProfile, accounts, activeAccountId, onSwitchAccount, onCreateAccount }: { profile: any, onUpdateProfile: (updates: any) => void, accounts: any[], activeAccountId: string, onSwitchAccount: (id: string) => void, onCreateAccount: () => void }) {
  const [imageModalTarget, setImageModalTarget] = useState<'avatar' | 'background' | null>(null);
  const [textModalConfig, setTextModalConfig] = useState<{ target: string, title: string, value: string } | null>(null);
  const [showPersonaSheet, setShowPersonaSheet] = useState(false);
  const [showAccountSwitch, setShowAccountSwitch] = useState(false);

  return (
    <motion.div 
      key="me"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col pb-[max(env(safe-area-inset-bottom),2rem)] overflow-y-auto scrollbar-hide"
    >
      {/* Background Card */}
      <div className="relative h-64 w-full rounded-b-[2.5rem] overflow-hidden shadow-2xl group shrink-0">
        <img src={profile.background} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
        <button 
          onClick={() => setImageModalTarget('background')}
          className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 p-2.5 bg-black/30 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-black/50"
        >
          <Camera size={20} />
        </button>
      </div>

      {/* Avatar & Info */}
      <div className="relative -mt-16 flex flex-col items-center px-6 shrink-0">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-neutral-950 overflow-hidden shadow-xl bg-neutral-800">
            <img src={profile.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <button 
            onClick={() => setImageModalTarget('avatar')}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            <Camera size={28} className="text-white" />
          </button>

          {/* Status Bubble */}
          <div 
            className="absolute top-1 right-1 bg-neutral-800 border-4 border-neutral-950 rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform z-10"
            onClick={() => setTextModalConfig({ target: 'statusIcon', title: '修改状态图标 (Emoji)', value: profile.statusIcon })}
          >
            <span className="text-lg leading-none">{profile.statusIcon}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center">
          <h2 
            className="text-2xl font-bold text-white flex items-center gap-2 cursor-pointer group"
            onClick={() => setTextModalConfig({ target: 'name', title: '修改昵称', value: profile.name })}
          >
            {profile.name}
            <Edit2 size={16} className="text-white/0 group-hover:text-white/40 transition-colors" />
          </h2>
          <p 
            className="text-white/50 text-sm mt-1 flex items-center gap-2 cursor-pointer group"
            onClick={() => setTextModalConfig({ target: 'qqId', title: '修改 ID', value: profile.qqId })}
          >
            ID: {profile.qqId}
            <Edit2 size={12} className="text-white/0 group-hover:text-white/40 transition-colors" />
          </p>
        </div>
        
        {/* Status Text */}
        <div 
          className="mt-4 px-5 py-2 bg-white/5 rounded-full border border-white/5 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-2 group"
          onClick={() => setTextModalConfig({ target: 'statusText', title: '修改状态签名', value: profile.statusText })}
        >
          <p className="text-sm text-white/80">{profile.statusText}</p>
          <Edit2 size={12} className="text-white/0 group-hover:text-white/40 transition-colors" />
        </div>
      </div>

      {/* Function Blocks */}
      <div className="mt-8 px-4 space-y-3 shrink-0">
        <div className="bg-white/5 rounded-2xl p-1 border border-white/5">
          <div className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Wallet size={20} />
            </div>
            <div className="flex-1 border-b border-white/5 pb-3 pt-1 flex justify-between items-center">
              <h3 className="text-white/90 font-medium">钱包</h3>
              <ChevronRight size={18} className="text-white/20" />
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Star size={20} />
            </div>
            <div className="flex-1 pb-1 pt-1 flex justify-between items-center">
              <h3 className="text-white/90 font-medium">收藏</h3>
              <ChevronRight size={18} className="text-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* More Info & Switch Account Blocks */}
      <div className="mt-4 px-4 space-y-3 shrink-0 mb-8">
        <div className="bg-white/5 rounded-2xl p-1 border border-white/5">
          <div 
            onClick={() => setShowPersonaSheet(true)}
            className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText size={20} />
            </div>
            <div className="flex-1 border-b border-white/5 pb-3 pt-1 flex justify-between items-center">
              <h3 className="text-white/90 font-medium">更多资料</h3>
              <ChevronRight size={18} className="text-white/20" />
            </div>
          </div>
          <div 
            onClick={() => setShowAccountSwitch(true)}
            className="flex items-center gap-4 p-3 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <RefreshCw size={20} />
            </div>
            <div className="flex-1 pb-1 pt-1 flex justify-between items-center">
              <h3 className="text-white/90 font-medium">切换账号</h3>
              <ChevronRight size={18} className="text-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImageEditModal 
        isOpen={!!imageModalTarget} 
        onClose={() => setImageModalTarget(null)} 
        onSave={(url) => {
          if (imageModalTarget) onUpdateProfile({ [imageModalTarget]: url });
        }} 
      />
      <TextInputModal 
        isOpen={!!textModalConfig} 
        title={textModalConfig?.title || ''} 
        initialValue={textModalConfig?.value || ''} 
        onClose={() => setTextModalConfig(null)} 
        onSave={(val) => {
          if (textModalConfig) onUpdateProfile({ [textModalConfig.target]: val });
        }} 
      />
      <PersonaBottomSheet 
        isOpen={showPersonaSheet} 
        onClose={() => setShowPersonaSheet(false)} 
        initialValue={profile.personaDetails || ''} 
        onSave={(val) => onUpdateProfile({ personaDetails: val })} 
      />
      <AccountSwitchSheet 
        isOpen={showAccountSwitch} 
        onClose={() => setShowAccountSwitch(false)} 
        accounts={accounts} 
        activeAccountId={activeAccountId} 
        onSwitchAccount={onSwitchAccount} 
        onCreateAccount={onCreateAccount} 
      />
    </motion.div>
  );
}

function PersonaBottomSheet({ isOpen, onClose, initialValue, onSave }: { isOpen: boolean, onClose: () => void, initialValue: string, onSave: (val: string) => void }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl z-[60] flex flex-col h-[70vh]"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <button onClick={onClose} className="text-white/50 hover:text-white p-2">取消</button>
              <h3 className="text-white font-medium">详细人设</h3>
              <button onClick={() => { onSave(value); onClose(); }} className="text-indigo-400 font-medium p-2">保存</button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),2rem)]">
              <textarea 
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="在这里详细描述你的性格、喜好、背景故事等，AI 会根据这些信息与你互动..."
                className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AccountSwitchSheet({ isOpen, onClose, accounts, activeAccountId, onSwitchAccount, onCreateAccount }: { isOpen: boolean, onClose: () => void, accounts: any[], activeAccountId: string, onSwitchAccount: (id: string) => void, onCreateAccount: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-3xl z-[60] flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/5 shrink-0">
              <h3 className="text-white font-medium ml-2">切换账号预设</h3>
              <button onClick={onClose} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 pb-[max(env(safe-area-inset-bottom),2rem)]">
              {accounts.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => { onSwitchAccount(acc.id); onClose(); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors border ${activeAccountId === acc.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <img src={acc.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{acc.name}</h4>
                    <p className="text-white/50 text-xs truncate">ID: {acc.qqId}</p>
                  </div>
                  {activeAccountId === acc.id && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
              
              <div 
                onClick={() => { onCreateAccount(); onClose(); }}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors bg-white/5 border border-white/5 hover:bg-white/10 border-dashed"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/50">
                  <PlusIcon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-white/90 font-medium">新建账号预设</h4>
                  <p className="text-white/50 text-xs">创建一个新的人设和资料</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ContactProfileView({ contact, onBack, onSendMessage, onUpdateContact }: { contact: Contact, onBack: () => void, onSendMessage: () => void, onUpdateContact: (id: string, updates: Partial<Contact>) => void }) {
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [editPersona, setEditPersona] = useState(contact.persona || '');

  const handleSavePersona = () => {
    onUpdateContact(contact.id, { persona: editPersona });
    setIsEditingPersona(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col text-neutral-900 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-neutral-100">
          <button onClick={onBack} className="p-2 -ml-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
          <button className="p-2 -mr-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <MoreHorizontal size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Profile Info */}
          <div className="px-6 pt-6 pb-8 flex flex-col items-center border-b border-neutral-100">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-sm border border-neutral-100">
              {contact.avatar.startsWith('bg-') ? (
                <div className={`w-full h-full ${contact.avatar} flex items-center justify-center text-white text-3xl font-medium`}>
                  {contact.name.charAt(0)}
                </div>
              ) : (
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
              )}
            </div>
            <h2 className="text-2xl font-semibold mb-1">{contact.nickname || contact.name}</h2>
            <p className="text-neutral-500 text-sm mb-4">QQ号: {contact.displayId || contact.id.slice(-8)}</p>
            
            <div className="flex gap-4 text-sm text-neutral-600 mb-6">
              {contact.gender && <span>{contact.gender}</span>}
              {contact.dob && <span>{contact.dob}</span>}
              {contact.location && <span>{contact.location}</span>}
            </div>

            <button 
              onClick={onSendMessage}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              发消息
            </button>
          </div>

          {/* Persona Details */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">详细人设</h3>
              {!isEditingPersona && (
                <button onClick={() => setIsEditingPersona(true)} className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors">
                  <Edit2 size={18} strokeWidth={1.5} />
                </button>
              )}
            </div>
            
            {isEditingPersona ? (
              <div className="space-y-3">
                <textarea
                  value={editPersona}
                  onChange={(e) => setEditPersona(e.target.value)}
                  className="w-full h-40 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="输入详细人设..."
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setIsEditingPersona(false);
                      setEditPersona(contact.persona || '');
                    }}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleSavePersona}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {contact.persona || '暂无详细人设'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}