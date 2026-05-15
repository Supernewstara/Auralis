import React, { useState, useEffect } from 'react';

export const WaveformScrubber = ({ duration, currentTime, onSeek, audioUrl }: { duration: number, currentTime: number, onSeek: (percent: number) => void, audioUrl?: string }) => {
  const bars = 40;
  const [heights, setHeights] = useState<number[]>(Array.from({length: bars}).map(() => 4));

  useEffect(() => {
    if (!audioUrl) {
       setHeights(Array.from({length: bars}).map(() => 4));
       return;
    }

    let isCancelled = false;
    
    const fetchPeaks = async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;
        
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (isCancelled) return;
        
        const channelData = audioBuffer.getChannelData(0);
        const step = Math.floor(channelData.length / bars);
        const newPeaks = [];
        
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          const start = i * step;
          for (let j = 0; j < step && start + j < channelData.length; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          newPeaks.push(sum / step);
        }
        
        const maxPeak = Math.max(...newPeaks, 0.001);
        const normalized = newPeaks.map(p => Math.max(4, (p / maxPeak) * 28));
        
        if (!isCancelled) {
          setHeights(normalized);
        }
      } catch (e) {
        // Silently generate fake waveform on network or decoding error to gracefully degrade
        if (!isCancelled) {
           setHeights(Array.from({length: bars}).map((_, i) => 12 + Math.sin(i * 0.5) * 8 + Math.random() * 10));
        }
      }
    };

    fetchPeaks();

    return () => { isCancelled = true; };
  }, [audioUrl]);

  const progressPercent = duration ? (currentTime / duration) : 0;
  const activeIndex = Math.floor(progressPercent * bars);

  return (
    <div 
      className="flex-1 flex items-center gap-[2px] h-10 relative cursor-pointer group"
      onClick={(e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        let percent = (e.clientX - bounds.left) / bounds.width;
        percent = Math.max(0, Math.min(1, percent));
        onSeek(percent);
      }}
    >
      {duration > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 flex flex-col items-center transition-all duration-300 pointer-events-none"
          style={{ left: `${progressPercent * 100}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-primary -mt-1.5 opacity-0 group-hover:opacity-100 smooth-transition shadow-[0_0_12px_rgba(177,204,197,1)]"></div>
        </div>
      )}

      {heights.map((h, i) => {
        const isPlayed = i <= activeIndex;
        return (
          <div 
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 ${isPlayed ? 'bg-primary shadow-[0_0_8px_rgba(177,204,197,0.4)]' : 'bg-surface-bright'}`}
            style={{ height: `${Math.max(4, h)}px` }}
          ></div>
        );
      })}
    </div>
  );
};
