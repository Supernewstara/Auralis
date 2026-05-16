import React from 'react';
import { RecommendationData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface QueuePanelProps {
  tracks: RecommendationData['tracks'];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onRefresh: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ tracks, currentIndex, onSelect, onRemove, onClear, onRefresh, isExpanded, onToggleExpand }) => {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="w-full mt-2 bg-surface-variant/40 backdrop-blur-2xl rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <span className="text-secondary font-mono text-sm tracking-widest uppercase">
            Queue ({tracks.length})
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(0);
              }}
              className="text-primary hover:text-primary-variant transition-colors flex items-center justify-center p-1 rounded-full hover:bg-white/5"
              title="Play All"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className="text-primary hover:text-primary-variant transition-colors flex items-center justify-center p-1 rounded-full hover:bg-white/5"
              title="Refresh Queue"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
          </div>
        </div>
        <button className="text-secondary hover:text-white transition-colors p-1">
          <motion.span 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="material-symbols-outlined text-[18px] inline-block origin-center"
          >
            {isExpanded ? 'remove' : 'add'}
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 pt-0 flex flex-col gap-1">
              <AnimatePresence mode="popLayout">
                {tracks.map((track, i) => {
                  const isActive = i === currentIndex;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      key={`${track.id || 't'}-${i}`}
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              <motion.button 
                layout
                onClick={(e) => {
                   e.stopPropagation();
                   onClear();
                }}
                className="mt-2 text-xs text-red-400 hover:text-red-300 text-center py-2 transition-colors border border-transparent hover:border-red-500/20 rounded-xl"
              >
                Clear Queue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
