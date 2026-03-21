import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Play, Pause, SkipForward, SkipBack, Heart, MoreHorizontal, Search, Menu } from 'lucide-react';

export default function MusicApp({ onBack }: { onBack: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-white z-50 flex flex-col text-neutral-900 overflow-hidden font-serif"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <div className="flex gap-4">
          <button className="p-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <Search size={24} strokeWidth={1.5} />
          </button>
          <button className="p-2 -mr-2 text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Featured Hero */}
        <div className="relative h-[400px] w-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" 
            alt="Featured Music" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-8 text-white">
            <p className="text-xs font-sans tracking-[0.3em] uppercase mb-3 opacity-80">Featured Album</p>
            <h2 className="text-5xl font-light mb-2 leading-tight">Midnight <br/>Sessions</h2>
            <p className="text-sm font-sans opacity-70">Curated by AI Studio</p>
          </div>
        </div>

        {/* Editorial Section */}
        <div className="px-8 py-12">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-light tracking-tight text-neutral-900">New Releases</h3>
            <span className="text-xs font-sans tracking-widest uppercase text-neutral-400 cursor-pointer hover:text-neutral-900 transition-colors">View All</span>
          </div>
          
          <div className="space-y-8">
            {[
              { title: 'Echoes of Silence', artist: 'The Weeknd', img: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop' },
              { title: 'Neon Nights', artist: 'Synthwave', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop' },
              { title: 'Acoustic Soul', artist: 'Indie Folk', img: 'https://images.unsplash.com/photo-1460036521480-ff49c08c2781?q=80&w=1000&auto=format&fit=crop' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 group cursor-pointer">
                <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-neutral-100">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={24} className="text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 border-b border-neutral-100 pb-6">
                  <p className="text-xs font-sans text-neutral-400 mb-2 uppercase tracking-widest">0{i + 1}</p>
                  <h4 className="text-xl font-medium text-neutral-900 truncate mb-1">{item.title}</h4>
                  <p className="text-sm font-sans text-neutral-500 truncate">{item.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Curated Playlists */}
        <div className="px-8 py-12 bg-neutral-50">
          <h3 className="text-3xl font-light tracking-tight text-neutral-900 mb-8">Moods</h3>
          <div className="grid grid-cols-2 gap-6">
            {[
              { title: 'Focus', color: 'bg-stone-200' },
              { title: 'Relax', color: 'bg-slate-200' },
              { title: 'Workout', color: 'bg-zinc-200' },
              { title: 'Sleep', color: 'bg-neutral-200' }
            ].map((item, i) => (
              <div key={i} className={`aspect-square ${item.color} p-6 flex flex-col justify-end cursor-pointer hover:opacity-90 transition-opacity`}>
                <h4 className="text-2xl font-medium text-neutral-800">{item.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Player */}
      <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-neutral-100 px-6 py-4 flex items-center gap-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="w-14 h-14 bg-neutral-100 shrink-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop" alt="Now Playing" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-medium text-neutral-900 truncate">Echoes of Silence</h4>
          <p className="text-xs font-sans text-neutral-500 truncate">The Weeknd</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <Heart size={24} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
          >
            {isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white ml-1" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
