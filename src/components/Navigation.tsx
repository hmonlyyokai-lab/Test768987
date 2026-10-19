import React from 'react';
import { AppTab } from '../types';
import { Sparkles, Star } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface NavigationProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const handleTabClick = (tab: AppTab) => {
    if (tab !== currentTab) {
      audioManager.playStarChime(tab === 'fireworks' ? 2 : 5);
      onSelectTab(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/92 backdrop-blur-md border-t border-pink-200/90 shadow-[0_-4px_25px_rgba(255,105,180,0.12)] flex items-center justify-around px-8 select-none">
      {/* Tab 1: Fireworks */}
      <button
        type="button"
        onClick={() => handleTabClick('fireworks')}
        className="flex flex-col items-center justify-center gap-1 py-1 px-4 cursor-pointer group transition-all"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'fireworks'
              ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_4px_14px_rgba(255,105,180,0.4)] scale-105'
              : 'text-slate-400 group-hover:text-pink-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <span
          className={`text-[11px] font-fredoka font-medium tracking-tight ${
            currentTab === 'fireworks' ? 'text-pink-600 font-bold' : 'text-slate-400 group-hover:text-pink-400'
          }`}
        >
          Fireworks
        </span>
      </button>

      {/* Tab 2: Stars / Star Maker */}
      <button
        type="button"
        onClick={() => handleTabClick('stars')}
        className="flex flex-col items-center justify-center gap-1 py-1 px-4 cursor-pointer group transition-all"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            currentTab === 'stars'
              ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_4px_14px_rgba(255,105,180,0.4)] scale-105'
              : 'text-slate-400 group-hover:text-pink-400'
          }`}
        >
          <Star className={`w-5 h-5 ${currentTab === 'stars' ? 'fill-white text-white' : ''}`} />
        </div>
        <span
          className={`text-[11px] font-fredoka font-medium tracking-tight ${
            currentTab === 'stars' ? 'text-pink-600 font-bold' : 'text-slate-400 group-hover:text-pink-400'
          }`}
        >
          Stars
        </span>
      </button>
    </nav>
  );
};
