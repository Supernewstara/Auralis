import React, { useRef, useEffect } from 'react';

export const MinimalLyrics = ({ lyrics, currentTime }: { lyrics: any[], currentTime: number }) => {
  const currentLineIndex = lyrics.findIndex((l, i) => {
    const nextListTime = lyrics[i + 1]?.time || Infinity;
    return currentTime >= l.time && currentTime < nextListTime;
  });

  const displayIndex = currentLineIndex === -1 ? 0 : currentLineIndex;

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="mt-6 flex flex-col gap-1.5 h-[84px] justify-center">
        <p className="text-body-lg font-body-lg font-medium text-on-surface truncate transition-all duration-300">
          Auralis Runtime...
        </p>
      </div>
    );
  }

  // Uniform line height block for calculation
  const LINE_HEIGHT = 36;
  const VISIBLE_OFFSET = 24; // Push down so active is near center

  return (
    <div 
      className="mt-6 h-[84px] overflow-hidden relative" 
      style={{ 
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)', 
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)' 
      }}
    >
      <div 
        className="flex flex-col absolute w-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: `translateY(${VISIBLE_OFFSET - displayIndex * LINE_HEIGHT}px)` }}
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === displayIndex;
          const isPast = idx < displayIndex;
          
          return (
            <div 
              key={idx} 
              className="flex items-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-left"
              style={{ height: `${LINE_HEIGHT}px` }}
            >
              {isActive && (
                <span className="material-symbols-outlined text-[16px] mr-2 text-primary shrink-0 transition-opacity duration-300">smart_toy</span>
              )}
              <p 
                className={`truncate transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isActive 
                    ? 'text-[18px] font-bold text-on-surface leading-tight' 
                    : isPast
                      ? 'text-[15px] font-medium text-on-surface-variant/40 blur-[0.5px]'
                      : 'text-[15px] font-medium text-on-surface-variant/70 blur-[0.2px]'
                }`}
                style={{ transform: isActive ? 'scale(1)' : 'scale(0.95)', transformOrigin: 'left center' }}
              >
                {line.text || '...'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

