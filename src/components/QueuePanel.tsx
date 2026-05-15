import React from 'react';
import { RecommendationData } from '../types';

interface QueuePanelProps {
  tracks: RecommendationData['tracks'];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ tracks, currentIndex, onSelect, onRemove, onClear, isExpanded, onToggleExpand }) => {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="w-full mt-2 bg-surface-variant/40 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <span className="text-secondary font-mono text-sm tracking-widest uppercase">
          Queue ({tracks.length})
        </span>
        <button className="text-secondary hover:text-white transition-colors p-1">
          <span className="material-symbols-outlined text-[18px]">
            {isExpanded ? 'remove' : 'add'}
          </span>
        </button>
      </div>

      <div 
        className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 overflow-y-auto custom-scrollbar' : 'max-h-0 opacity-0 overflow-hidden'}`}
      >
        <div className="p-2 pt-0 flex flex-col gap-1">
          {tracks.map((track, i) => {
            const isActive = i === currentIndex;
            return (
              <div 
                key={`${track.trackName}-${i}`}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer ${isActive ? 'bg-primary/20 hover:bg-primary/30 border border-primary/20' : 'hover:bg-white/10 border border-transparent'}`}
                onClick={() => onSelect(i)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-6 flex justify-center flex-shrink-0 text-secondary">
                     {isActive ? (
                       <span className="material-symbols-outlined text-[16px] text-primary">play_arrow</span>
                     ) : (
                       <span className="text-xs font-mono">{i + 1}</span>
                     )}
                   </div>
                   <div className="flex flex-col overflow-hidden">
                     <span className={`text-sm truncate ${isActive ? 'text-primary font-medium' : 'text-white/90'}`}>{track.trackName}</span>
                     <span className="text-xs text-white/50 truncate">{track.artist}</span>
                   </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-white/50 hover:text-white/90 transition-all ml-2"
                  title="Remove"
                >
                   <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            );
          })}
          
          <button 
            onClick={(e) => {
               e.stopPropagation();
               onClear();
            }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 text-center py-2 transition-colors border border-transparent hover:border-red-500/20 rounded-xl"
          >
            Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
};
