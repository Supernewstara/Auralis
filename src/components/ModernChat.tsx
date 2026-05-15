import React, { useState, useEffect, useRef } from 'react';

export const ModernChat = ({ messages, onSend, loading, agentStatus, streamedText }: { messages: any[], onSend: (text: string) => void, loading: boolean, agentStatus?: string, streamedText?: string }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll into view if there are messages
    if (messages.length > 0 || loading) {
       setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
       }, 100);
    }
  }, [messages.length, loading]);

  const handleSend = () => {
    if (text.trim() && !loading) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col gap-8 mt-6 pb-24 relative px-2">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex gap-4 w-full animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {msg.role === 'agent' && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-variant/40 to-surface-variant/10 flex items-center justify-center shrink-0 border border-white/5 mt-1 shadow-sm relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-[2px]"></div>
              <span className="material-symbols-outlined text-primary text-[14px] relative z-10">graphic_eq</span>
            </div>
          )}
          <div className={`relative max-w-[85%] pt-1.5 ${msg.role === 'user' ? 'text-white/90 text-right' : 'text-white/80'} text-[15px] leading-[1.7] tracking-wide font-body-md`}>
             {typeof msg.content === 'string' ? (
                msg.content.split('\n').map((line: string, i: number) => (
                  <span key={i} className="block mb-2 last:mb-0 min-h-[1.5em]">{line}</span>
                ))
             ) : msg.content}
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex gap-4 w-full animate-fade-in justify-start">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-variant/40 to-surface-variant/10 flex items-center justify-center shrink-0 border border-white/5 mt-1 shadow-sm relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-[2px] animate-pulse-soft"></div>
            <span className="material-symbols-outlined text-primary text-[14px] relative z-10 animate-pulse-soft">graphic_eq</span>
          </div>
          <div className="flex flex-col pt-1.5 w-max max-w-[85%]">
            {streamedText ? (
              <div className="text-white/80 text-[15px] leading-[1.7] tracking-wide font-body-md animate-fade-in">
                {streamedText.split('\n').map((line: string, i: number) => (
                  <span key={i} className="block mb-2 last:mb-0 min-h-[1.5em]">{line}</span>
                ))}
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary/60 animate-pulse rounded-sm align-middle"></span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-1.5 bg-primary/60 rounded-full animate-[bounce_1s_infinite] h-2.5"></div>
                   <div className="w-1.5 bg-primary/60 rounded-full animate-[bounce_1s_infinite_0.2s] h-4"></div>
                   <div className="w-1.5 bg-primary/60 rounded-full animate-[bounce_1s_infinite_0.4s] h-3"></div>
                   <div className="w-1.5 bg-primary/60 rounded-full animate-[bounce_1s_infinite_0.6s] h-1.5"></div>
                </div>
                {agentStatus && (
                  <div className="text-[13px] text-white/40 tracking-wider font-mono pl-1 animate-fade-in">
                    {agentStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div ref={endRef} className="h-4" />

      <div className="input-glow smooth-transition fixed bottom-8 left-0 right-0 max-w-xl mx-auto px-4 z-50">
        <div className="bg-surface-container/60 backdrop-blur-3xl rounded-3xl flex items-center p-2 pl-6 border border-white/10 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-surface-container/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] hover:border-white/20">
          <input 
            className="flex-1 bg-transparent border-none text-body-lg font-body-lg text-on-surface focus:ring-0 placeholder:text-on-surface-variant/40 outline-none h-12 w-full" 
            placeholder="Ask Auralis..." 
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={!text.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-container to-surface-container flex items-center justify-center text-on-primary-container hover:from-primary hover:to-primary-container hover:text-on-primary transition-all duration-300 shrink-0 shadow-lg disabled:opacity-40 disabled:hover:from-primary-container disabled:hover:to-surface-container disabled:hover:text-on-primary-container group"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:-translate-y-1">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
