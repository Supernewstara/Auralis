import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string | React.ReactNode;
  options?: { label: string; prompt: string }[];
  optionsDisabled?: boolean;
}

export const ModernChat = ({ messages, onSend, loading, agentStatus, streamedText, onChipClick }: { messages: ChatMessage[], onSend: (text: string) => void, loading: boolean, agentStatus?: string, streamedText?: string, onChipClick: (prompt: string, label: string) => void }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
       setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
       }, 100);
    }
  }, [messages.length, loading]);

  useEffect(() => {
    if (loading && streamedText) {
       endRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [streamedText]);

  const handleSend = () => {
    if (text.trim() && !loading) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col gap-8 mt-6 pb-24 relative px-2">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'agent' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-variant/40 to-surface-variant/10 flex items-center justify-center shrink-0 border border-white/5 mt-1 shadow-sm relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-[2px]"></div>
                <span className="material-symbols-outlined text-primary text-[14px] relative z-10">graphic_eq</span>
              </div>
            )}
            <div className={`relative max-w-[85%] pt-1.5 ${msg.role === 'user' ? 'text-white/90 text-right' : 'text-white/80'} text-[15px] leading-[1.7] tracking-wide font-body-md`}>
               {typeof msg.content === 'string' ? (
                  <>
                    {msg.content.split('\n').map((line: string, i: number) => (
                      <span key={i} className="block mb-2 last:mb-0 min-h-[1.5em]">{line}</span>
                    ))}
                    {msg.options && msg.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {msg.options.map((opt, optIdx) => {
                          const isDisabled = msg.optionsDisabled === true;
                          return (
                            <motion.button
                              key={optIdx}
                              initial={{ opacity: 0, y: 8, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.25, delay: 0.08 * optIdx, ease: "easeOut" }}
                              whileHover={isDisabled ? {} : { scale: 1.03 }}
                              whileTap={isDisabled ? {} : { scale: 0.96 }}
                              onClick={() => {
                                if (!isDisabled) onChipClick(opt.prompt, opt.label);
                              }}
                              disabled={isDisabled}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 select-none ${
                                isDisabled
                                  ? 'bg-white/5 border border-white/5 text-white/30 cursor-default'
                                  : 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white/85 hover:text-white cursor-pointer active:bg-primary/30 active:border-primary/40'
                              }`}
                            >
                              {opt.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </>
               ) : msg.content}
            </div>
          </motion.div>
        ))}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex gap-4 w-full justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-variant/40 to-surface-variant/10 flex items-center justify-center shrink-0 border border-white/5 mt-1 shadow-sm relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-[2px] animate-pulse-soft"></div>
              <span className="material-symbols-outlined text-primary text-[14px] relative z-10 animate-pulse-soft">graphic_eq</span>
            </div>
            <div className="flex flex-col pt-1.5 w-max max-w-[85%]">
              {streamedText ? (
                <div className="text-white/80 text-[15px] leading-[1.7] tracking-wide font-body-md">
                  {streamedText.split('\n').map((line: string, i: number) => (
                    <span key={i} className="block mb-2 last:mb-0 min-h-[1.5em]">{line}</span>
                  ))}
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary/60 animate-pulse rounded-sm align-middle"></span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-1 h-4">
                     <motion.div animate={{ height: [10, 16, 10] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 bg-primary/60 rounded-full"></motion.div>
                     <motion.div animate={{ height: [10, 16, 10] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 bg-primary/60 rounded-full"></motion.div>
                     <motion.div animate={{ height: [10, 16, 10] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 bg-primary/60 rounded-full"></motion.div>
                     <motion.div animate={{ height: [10, 16, 10] }} transition={{ repeat: Infinity, duration: 1, delay: 0.6 }} className="w-1.5 bg-primary/60 rounded-full"></motion.div>
                  </div>
                  <div className="h-5 relative w-full">
                    <AnimatePresence mode="popLayout">
                      {agentStatus && (
                        <motion.div 
                          key={agentStatus}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="text-[13px] text-white/40 tracking-wider font-mono pl-1 absolute top-0 left-0 whitespace-nowrap"
                        >
                          {agentStatus}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} className="h-4" />

      <motion.div 
        layout
        className="input-glow smooth-transition fixed bottom-8 left-0 right-0 max-w-xl mx-auto px-4 z-50"
      >
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
      </motion.div>
    </div>
  );
};

