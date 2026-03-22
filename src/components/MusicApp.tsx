import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play, Pause, SkipForward, SkipBack, Heart, Search, Plus, X, Upload, FileAudio, FileText, Music, ListMusic, Repeat, Repeat1, Shuffle, ChevronDown, MoreVertical } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  lrcUrl?: string;
  lrcText?: string;
}

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  isSystem?: boolean;
}

const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Midnight City (Instrumental)',
    artist: 'Synthwave Explorer',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2',
    title: 'Acoustic Breeze',
    artist: 'Indie Folk',
    coverUrl: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    title: 'Neon Nights',
    artist: 'Cyberpunk',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

export default function MusicApp({ onBack }: { onBack: () => void }) {
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'liked', name: '我喜欢的音乐', songs: [], isSystem: true }
  ]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingQueue, setPlayingQueue] = useState<Song[]>(MOCK_SONGS);
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'file'>('file');
  const [newSong, setNewSong] = useState({ title: '', artist: '', coverUrl: '', audioUrl: '', lrcUrl: '' });
  
  const [showPlayer, setShowPlayer] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<'sequence' | 'loop' | 'random'>('sequence');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{time: number, text: string}[]>([]);
  
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Handle iTunes API Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=20`);
        const data = await res.json();
        const results: Song[] = data.results.map((track: any) => ({
          id: track.trackId.toString(),
          title: track.trackName,
          artist: track.artistName,
          coverUrl: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
          audioUrl: track.previewUrl,
        }));
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Play/Pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  // Scroll lyrics
  useEffect(() => {
    if (showPlayer && lyrics.length > 0 && lyricsRef.current) {
      const activeIndex = lyrics.findIndex((l, i) => {
        const next = lyrics[i + 1];
        return currentTime >= l.time && (!next || currentTime < next.time);
      });
      
      if (activeIndex !== -1) {
        const lyricElements = lyricsRef.current.children;
        const activeElement = lyricElements[activeIndex] as HTMLElement;
        if (activeElement) {
          lyricsRef.current.scrollTo({
            top: activeElement.offsetTop - lyricsRef.current.clientHeight / 2 + activeElement.clientHeight / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentTime, showPlayer, lyrics]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSong && playingQueue.length > 0) {
      playSong(playingQueue[0], playingQueue);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const playSong = (song: Song, queue?: Song[]) => {
    setCurrentSong(song);
    if (queue) setPlayingQueue(queue);
    setIsPlaying(true);
    
    // Mock lyrics for demonstration if none provided
    if (song.lrcText) {
      parseLyrics(song.lrcText);
    } else if (song.lrcUrl) {
      fetch(song.lrcUrl).then(res => res.text()).then(text => parseLyrics(text)).catch(() => setLyrics([]));
    } else {
      // Mock lyrics
      const mockLrc = `[00:00.00] ${song.title}
[00:04.00] Artist: ${song.artist}
[00:08.00] (Music playing...)
[00:15.00] This is a generated placeholder lyric
[00:20.00] Because no LRC file was provided
[00:25.00] Enjoy the music!`;
      parseLyrics(mockLrc);
    }
  };

  const parseLyrics = (lrc: string) => {
    const lines = lrc.split('\n');
    const parsed = lines.map(line => {
      const match = line.match(/\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        return { time: minutes * 60 + seconds, text: match[3] || '...' };
      }
      return null;
    }).filter(l => l !== null) as {time: number, text: string}[];
    setLyrics(parsed);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (playbackMode === 'loop') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSong || playingQueue.length === 0) return;
    let nextIndex = 0;
    const currentIndex = playingQueue.findIndex(s => s.id === currentSong.id);
    
    if (playbackMode === 'random') {
      nextIndex = Math.floor(Math.random() * playingQueue.length);
    } else {
      nextIndex = currentIndex + 1 >= playingQueue.length ? 0 : currentIndex + 1;
    }
    playSong(playingQueue[nextIndex]);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentSong || playingQueue.length === 0) return;
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    let prevIndex = 0;
    const currentIndex = playingQueue.findIndex(s => s.id === currentSong.id);
    
    if (playbackMode === 'random') {
      prevIndex = Math.floor(Math.random() * playingQueue.length);
    } else {
      prevIndex = currentIndex - 1 < 0 ? playingQueue.length - 1 : currentIndex - 1;
    }
    playSong(playingQueue[prevIndex]);
  };

  const togglePlaybackMode = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const modes: ('sequence' | 'loop' | 'random')[] = ['sequence', 'loop', 'random'];
    const currentIndex = modes.indexOf(playbackMode);
    setPlaybackMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Playlist Management
  const toggleLike = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaylists(prev => prev.map(p => {
      if (p.id === 'liked') {
        const exists = p.songs.some(s => s.id === song.id);
        if (exists) {
          return { ...p, songs: p.songs.filter(s => s.id !== song.id) };
        } else {
          return { ...p, songs: [song, ...p.songs] };
        }
      }
      return p;
    }));
  };

  const isLiked = (songId: string) => {
    const likedPlaylist = playlists.find(p => p.id === 'liked');
    return likedPlaylist?.songs.some(s => s.id === songId) || false;
  };

  const addToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (!p.songs.some(s => s.id === song.id)) {
          return { ...p, songs: [...p.songs, song] };
        }
      }
      return p;
    }));
    setSongToAdd(null);
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      songs: songToAdd ? [songToAdd] : []
    };
    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setShowNewPlaylistInput(false);
    if (songToAdd) setSongToAdd(null);
  };

  // Handle File Uploads
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'audio' | 'lrc' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    if (type === 'audio') setNewSong(prev => ({ ...prev, audioUrl: url, title: prev.title || file.name.replace(/\.[^/.]+$/, "") }));
    if (type === 'lrc') setNewSong(prev => ({ ...prev, lrcUrl: url }));
    if (type === 'cover') setNewSong(prev => ({ ...prev, coverUrl: url }));
  };

  const submitUpload = () => {
    if (!newSong.audioUrl) {
      alert("请提供音频文件或URL");
      return;
    }
    const songToAddObj: Song = {
      id: Date.now().toString(),
      title: newSong.title || 'Unknown Title',
      artist: newSong.artist || 'Unknown Artist',
      coverUrl: newSong.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
      audioUrl: newSong.audioUrl,
      lrcUrl: newSong.lrcUrl
    };
    setSongs([songToAddObj, ...songs]);
    setShowUpload(false);
    setNewSong({ title: '', artist: '', coverUrl: '', audioUrl: '', lrcUrl: '' });
    
    // Prompt to add to playlist
    setSongToAdd(songToAddObj);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-white z-50 flex flex-col text-neutral-900 overflow-hidden font-sans"
    >
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentSong?.audioUrl} 
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <div className="flex gap-4">
          <button onClick={() => setShowSearch(true)} className="p-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <Search size={24} strokeWidth={1.5} />
          </button>
          <button onClick={() => setShowUpload(true)} className="p-2 -mr-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <Plus size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {viewingPlaylist ? (
          <div className="px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setViewingPlaylist(null)} className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-3xl font-bold">{viewingPlaylist.name}</h2>
            </div>
            
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => { if(viewingPlaylist.songs.length > 0) playSong(viewingPlaylist.songs[0], viewingPlaylist.songs); }}
                className="flex-1 bg-neutral-900 text-white py-3 rounded-full font-medium flex items-center justify-center gap-2"
              >
                <Play size={20} className="fill-white" /> 播放全部
              </button>
            </div>

            <div className="space-y-4">
              {viewingPlaylist.songs.length === 0 ? (
                <p className="text-neutral-400 text-center py-10">歌单为空</p>
              ) : (
                viewingPlaylist.songs.map((item, i) => (
                  <div key={item.id} onClick={() => playSong(item, viewingPlaylist.songs)} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-neutral-50 rounded-xl">
                    <img src={item.coverUrl} alt={item.title} className="w-12 h-12 rounded-md object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-base font-medium truncate ${currentSong?.id === item.id ? 'text-indigo-600' : 'text-neutral-900'}`}>{item.title}</h4>
                      <p className="text-sm text-neutral-500 truncate">{item.artist}</p>
                    </div>
                    <button onClick={(e) => toggleLike(item, e)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
                      <Heart size={20} className={isLiked(item.id) ? "fill-red-500 text-red-500" : ""} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Playlists Section */}
            <div className="px-6 py-6">
              <h3 className="text-xl font-bold mb-4">我的歌单</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {playlists.map(playlist => (
                  <div 
                    key={playlist.id} 
                    onClick={() => setViewingPlaylist(playlist)}
                    className="snap-start shrink-0 w-32 cursor-pointer group"
                  >
                    <div className="w-32 h-32 bg-neutral-100 rounded-2xl mb-3 flex items-center justify-center overflow-hidden relative">
                      {playlist.songs.length > 0 ? (
                        <img src={playlist.songs[0].coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <ListMusic size={32} className="text-neutral-300" />
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                      {playlist.isSystem && (
                        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-full">
                          <Heart size={14} className="text-red-500 fill-red-500" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-neutral-500">{playlist.songs.length} 首</p>
                  </div>
                ))}
              </div>
            </div>

            {/* All Songs Section */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">所有歌曲</h3>
              </div>
              
              <div className="space-y-4">
                {songs.map((item, i) => (
                  <div key={item.id} onClick={() => playSong(item, songs)} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-neutral-50 rounded-xl">
                    <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity ${currentSong?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {currentSong?.id === item.id && isPlaying ? (
                          <div className="flex gap-1">
                            <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                          </div>
                        ) : (
                          <Play size={20} className="text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-base font-medium truncate ${currentSong?.id === item.id ? 'text-indigo-600' : 'text-neutral-900'}`}>{item.title}</h4>
                      <p className="text-sm text-neutral-500 truncate">{item.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSongToAdd(item); }} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                        <Plus size={20} />
                      </button>
                      <button onClick={(e) => toggleLike(item, e)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
                        <Heart size={20} className={isLiked(item.id) ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mini Player */}
      <div 
        onClick={() => currentSong && setShowPlayer(true)}
        className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-neutral-100 px-4 py-3 flex items-center gap-3 pb-[max(env(safe-area-inset-bottom),1rem)] cursor-pointer hover:bg-neutral-50 transition-colors z-20"
      >
        <div className="w-12 h-12 bg-neutral-100 rounded-lg shrink-0 overflow-hidden relative">
          {currentSong ? (
            <img src={currentSong.coverUrl} alt="Now Playing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400"><Music size={20} /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-900 truncate">{currentSong?.title || 'Not Playing'}</h4>
          <p className="text-xs text-neutral-500 truncate">{currentSong?.artist || 'Select a song'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentSong && (
            <button onClick={(e) => toggleLike(currentSong, e)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
              <Heart size={22} className={isLiked(currentSong.id) ? "fill-red-500 text-red-500" : ""} />
            </button>
          )}
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            {isPlaying ? <Pause size={18} className="fill-neutral-900" /> : <Play size={18} className="fill-neutral-900 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Full Screen Player */}
      <AnimatePresence>
        {showPlayer && currentSong && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-neutral-900 z-[70] flex flex-col font-sans text-white overflow-hidden"
          >
            {/* Blurred Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img src={currentSong.coverUrl} className="w-full h-full object-cover opacity-30 blur-3xl scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Player Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-[max(env(safe-area-inset-top),1rem)]">
              <button onClick={() => setShowPlayer(false)} className="p-2 -ml-2 text-white/80 hover:text-white">
                <ChevronDown size={28} />
              </button>
              <div className="text-center flex-1">
                <p className="text-xs text-white/60 uppercase tracking-widest">Now Playing</p>
              </div>
              <button onClick={() => setSongToAdd(currentSong)} className="p-2 -mr-2 text-white/80 hover:text-white">
                <Plus size={24} />
              </button>
            </div>

            {/* Player Content */}
            <div className="relative z-10 flex-1 flex flex-col px-8 pb-8 pt-4">
              {/* Album Art */}
              <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl mb-8 relative">
                <img src={currentSong.coverUrl} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>

              {/* Title & Artist */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-2xl font-bold truncate mb-1">{currentSong.title}</h2>
                  <p className="text-lg text-white/60 truncate">{currentSong.artist}</p>
                </div>
                <button onClick={(e) => toggleLike(currentSong, e)} className="p-2 text-white/80 hover:text-white">
                  <Heart size={28} className={isLiked(currentSong.id) ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>

              {/* Lyrics Preview (Mini) */}
              <div className="h-16 mb-6 overflow-hidden relative" onClick={() => {/* Toggle full lyrics view */}}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-900/50 pointer-events-none z-10" />
                <div ref={lyricsRef} className="h-full overflow-y-auto no-scrollbar scroll-smooth text-center">
                  {lyrics.length > 0 ? (
                    lyrics.map((line, i) => {
                      const isActive = currentTime >= line.time && (!lyrics[i+1] || currentTime < lyrics[i+1].time);
                      return (
                        <p key={i} className={`py-1 transition-all duration-300 ${isActive ? 'text-white font-medium text-lg' : 'text-white/40 text-sm'}`}>
                          {line.text}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-white/40 text-sm py-4">暂无歌词</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <input 
                  type="range" 
                  min="0" 
                  max={duration || 100} 
                  value={currentTime} 
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/50 mt-2 font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <button onClick={togglePlaybackMode} className="p-2 text-white/60 hover:text-white transition-colors">
                  {playbackMode === 'sequence' && <Repeat size={22} />}
                  {playbackMode === 'loop' && <Repeat1 size={22} />}
                  {playbackMode === 'random' && <Shuffle size={22} />}
                </button>
                
                <div className="flex items-center gap-6">
                  <button onClick={handlePrev} className="p-2 text-white hover:scale-110 transition-transform">
                    <SkipBack size={32} className="fill-white" />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-white text-neutral-900 flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                  >
                    {isPlaying ? <Pause size={32} className="fill-neutral-900" /> : <Play size={32} className="fill-neutral-900 ml-2" />}
                  </button>
                  <button onClick={handleNext} className="p-2 text-white hover:scale-110 transition-transform">
                    <SkipForward size={32} className="fill-white" />
                  </button>
                </div>

                <button onClick={() => setShowQueue(true)} className="p-2 text-white/60 hover:text-white transition-colors">
                  <ListMusic size={22} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playing Queue Modal */}
      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-[80] flex items-end justify-center"
            onClick={() => setShowQueue(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-t-3xl overflow-hidden pb-[max(env(safe-area-inset-bottom),1rem)] flex flex-col max-h-[70vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center shrink-0">
                <h3 className="text-lg font-bold text-neutral-900">当前播放</h3>
                <button onClick={() => setShowQueue(false)} className="text-neutral-400 hover:text-neutral-900">
                  <X size={24} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-2 flex-1">
                {playingQueue.map((song, i) => (
                  <div 
                    key={`${song.id}-${i}`} 
                    onClick={() => playSong(song)}
                    className={`flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-xl cursor-pointer transition-colors ${currentSong?.id === song.id ? 'bg-neutral-50' : ''}`}
                  >
                    {currentSong?.id === song.id ? (
                      <div className="w-4 flex justify-center">
                        <Play size={16} className="text-indigo-600 fill-indigo-600" />
                      </div>
                    ) : (
                      <div className="w-4 text-center text-xs text-neutral-400">{i + 1}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${currentSong?.id === song.id ? 'text-indigo-600' : 'text-neutral-900'}`}>{song.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {songToAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-[80] flex items-end sm:items-center justify-center p-4"
            onClick={() => setSongToAdd(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden pb-[max(env(safe-area-inset-bottom),1rem)]"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">添加到歌单</h3>
                <button onClick={() => setSongToAdd(null)} className="text-neutral-400 hover:text-neutral-900">
                  <X size={24} />
                </button>
              </div>
              
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2">
                <button 
                  onClick={() => setShowNewPlaylistInput(true)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
                    <Plus size={24} />
                  </div>
                  <span className="font-medium text-neutral-900">新建歌单</span>
                </button>

                {showNewPlaylistInput && (
                  <div className="p-3 bg-neutral-50 rounded-xl flex gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="输入歌单名称"
                      value={newPlaylistName}
                      onChange={e => setNewPlaylistName(e.target.value)}
                      className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <button onClick={createPlaylist} className="bg-neutral-900 text-white px-4 rounded-lg text-sm font-medium">
                      创建
                    </button>
                  </div>
                )}

                {playlists.map(playlist => (
                  <button 
                    key={playlist.id}
                    onClick={() => addToPlaylist(playlist.id, songToAdd)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {playlist.songs.length > 0 ? (
                        <img src={playlist.songs[0].coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <ListMusic size={20} className="text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{playlist.name}</p>
                      <p className="text-xs text-neutral-500">{playlist.songs.length} 首</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white z-[60] flex flex-col font-sans"
          >
            <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 pt-[max(env(safe-area-inset-top),1rem)]">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="搜索音乐、歌手..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 rounded-full py-3 pl-12 pr-4 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                  autoFocus
                />
              </div>
              <button onClick={() => setShowSearch(false)} className="text-neutral-500 font-medium">取消</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-32">
              {searchQuery.trim() === '' ? (
                <div className="text-center text-neutral-400 mt-20">
                  <Search size={48} className="mx-auto mb-4 opacity-20" />
                  <p>输入关键词搜索歌曲</p>
                  <p className="text-xs mt-2 opacity-60">已接入 Apple Music 官方接口 (提供30秒高清试听)</p>
                </div>
              ) : isSearching ? (
                <div className="text-center text-neutral-400 mt-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
                  <p>搜索中...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map(song => (
                    <div key={song.id} className="flex items-center gap-4 p-2 hover:bg-neutral-50 rounded-xl">
                      <img src={song.coverUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-neutral-900 font-medium truncate">{song.title}</h4>
                        <p className="text-neutral-500 text-sm truncate">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSongToAdd(song)} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                          <Plus size={20} />
                        </button>
                        <button onClick={() => { playSong(song); setShowSearch(false); }} className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors">
                          <Play size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-neutral-400 mt-20">
                  <p>未找到相关歌曲</p>
                  <button onClick={() => { setShowSearch(false); setShowUpload(true); }} className="mt-4 text-indigo-600 font-medium text-sm">
                    自己上传一首？
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Overlay */}
      <AnimatePresence>
        {showUpload && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white z-[60] flex flex-col font-sans"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 pt-[max(env(safe-area-inset-top),1rem)]">
              <h3 className="text-lg font-medium">上传音乐</h3>
              <button onClick={() => setShowUpload(false)} className="p-2 -mr-2 text-neutral-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pb-32">
              <div className="flex bg-neutral-100 rounded-lg p-1 mb-8">
                <button 
                  onClick={() => setUploadType('file')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadType === 'file' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
                >
                  本地文件
                </button>
                <button 
                  onClick={() => setUploadType('url')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${uploadType === 'url' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
                >
                  网络链接 (URL)
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">歌曲名称</label>
                  <input 
                    type="text" 
                    value={newSong.title}
                    onChange={e => setNewSong({...newSong, title: e.target.value})}
                    placeholder="例如：夜曲"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">歌手</label>
                  <input 
                    type="text" 
                    value={newSong.artist}
                    onChange={e => setNewSong({...newSong, artist: e.target.value})}
                    placeholder="例如：周杰伦"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                {uploadType === 'url' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">音频链接 (MP3/WAV)</label>
                      <input 
                        type="text" 
                        value={newSong.audioUrl}
                        onChange={e => setNewSong({...newSong, audioUrl: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">歌词链接 (LRC) - 可选</label>
                      <input 
                        type="text" 
                        value={newSong.lrcUrl || ''}
                        onChange={e => setNewSong({...newSong, lrcUrl: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">音频文件</label>
                      <label className="flex items-center justify-center w-full h-24 px-4 transition bg-neutral-50 border-2 border-neutral-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-neutral-400 focus:outline-none">
                        <span className="flex items-center space-x-2">
                          <FileAudio size={24} className="text-neutral-400" />
                          <span className="font-medium text-neutral-600">
                            {newSong.audioUrl ? '已选择音频文件' : '点击选择 MP3/WAV 文件'}
                          </span>
                        </span>
                        <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, 'audio')} />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">歌词文件 (LRC) - 可选</label>
                      <label className="flex items-center justify-center w-full h-16 px-4 transition bg-neutral-50 border-2 border-neutral-200 border-dashed rounded-xl appearance-none cursor-pointer hover:border-neutral-400 focus:outline-none">
                        <span className="flex items-center space-x-2">
                          <FileText size={20} className="text-neutral-400" />
                          <span className="font-medium text-neutral-600 text-sm">
                            {newSong.lrcUrl ? '已选择歌词文件' : '点击选择 LRC 文件'}
                          </span>
                        </span>
                        <input type="file" accept=".lrc" className="hidden" onChange={e => handleFileUpload(e, 'lrc')} />
                      </label>
                    </div>
                  </>
                )}
                
                <button 
                  onClick={submitUpload}
                  className="w-full bg-neutral-900 text-white rounded-xl py-4 font-medium mt-8 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={20} />
                  添加到音乐库
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
