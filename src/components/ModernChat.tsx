import React, { useState, useEffect, useRef } from 'react';

export const ModernChat = ({ messages, onSend, loading, agentStatus }: { messages: any[], onSend: (text: string) => void, loading: boolean, agentStatus?: string }) => {
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
    <div className="flex flex-col gap-6 mt-6 pb-24 relative">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex gap-4 w-full animate-spring-in smooth-transition ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {msg.role === 'agent' && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center shrink-0 border border-white/10 mt-1 shadow-[0_0_15px_rgba(177,204,197,0.1)] relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md"></div>
              <span className="material-symbols-outlined text-primary text-[18px] relative z-10">graphic_eq</span>
            </div>
          )}
          <div className={`relative group max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
            <div className={`absolute inset-0 bg-gradient-to-br blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${msg.role === 'user' ? 'from-primary/30 to-transparent' : 'from-surface-variant/50 to-transparent'}`}></div>
            <div className={`relative backdrop-blur-xl p-5 rounded-3xl border border-white/5 text-body-md font-body-md leading-relaxed shadow-2xl ${
              msg.role === 'user' 
                ? 'bg-primary/10 text-primary-fixed-dim rounded-tr-sm' 
                : 'bg-surface-container/40 text-on-surface rounded-tl-sm'
            }`}>
               {typeof msg.content === 'string' ? (
                  msg.content.split('\n').map((line: string, i: number) => (
                    <span key={i} className="block mb-1.5 last:mb-0">{line}</span>
                  ))
               ) : msg.content}
            </div>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex gap-4 w-full animate-spring-in justify-start">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center shrink-0 border border-white/10 mt-1 shadow-[0_0_15px_rgba(177,204,197,0.1)] relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse-soft"></div>
            <span className="material-symbols-outlined text-primary text-[18px] relative z-10 animate-pulse-soft">graphic_eq</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative backdrop-blur-xl px-5 py-4 rounded-3xl rounded-tl-sm border border-white/5 bg-surface-container/40 flex items-center gap-2 shadow-2xl min-w-[80px] justify-center">
               <div className="w-1 bg-primary/80 rounded-full animate-[bounce_1s_infinite] h-3"></div>
               <div className="w-1 bg-primary/80 rounded-full animate-[bounce_1s_infinite_0.2s] h-5"></div>
               <div className="w-1 bg-primary/80 rounded-full animate-[bounce_1s_infinite_0.4s] h-4"></div>
               <div className="w-1 bg-primary/80 rounded-full animate-[bounce_1s_infinite_0.6s] h-2"></div>
            </div>
            {agentStatus && (
              <div className="text-xs text-primary/70 font-mono pl-2 animate-fade-in opacity-80">
                {agentStatus}
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
