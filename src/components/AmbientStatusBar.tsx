import React from 'react';

export const AmbientStatusBar = ({ 
  timeStr, 
  sessionMood,
  weatherIcon = 'partly_cloudy_day',
  weatherText = 'Clear / 22°C'
}: { 
  timeStr: string, 
  sessionMood: string,
  weatherIcon?: string,
  weatherText?: string
}) => {
  return (
    <div className="flex justify-between items-center w-full px-2 mb-2">
      <div className="flex items-center gap-4">
        <span className="text-body-md font-body-md font-semibold text-on-surface tracking-tight">{timeStr}</span>
        <div className="w-1 h-1 rounded-full bg-on-surface-variant/50"></div>
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">{weatherIcon}</span>
          <span className="text-label-sm font-label-sm font-medium">{weatherText}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <div className="px-3 py-1 rounded-full bg-surface-container/50 backdrop-blur-md border border-white/5 flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(177,204,197,0.8)]"></div>
           <span className="text-[11px] font-label-sm font-medium tracking-wide text-primary uppercase">VSCode Active</span>
         </div>
         <div className="px-3 py-1 rounded-full bg-surface-container/50 backdrop-blur-md border border-white/5 flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(231,189,180,0.8)]"></div>
           <span className="text-[11px] font-label-sm font-medium tracking-wide text-tertiary uppercase">{sessionMood}</span>
         </div>
      </div>
    </div>
  );
};
