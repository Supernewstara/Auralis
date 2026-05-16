/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AmbientStatusBar } from './components/AmbientStatusBar';
import { WaveformScrubber } from './components/WaveformScrubber';
import { MinimalLyrics } from './components/MinimalLyrics';
import { ModernChat } from './components/ModernChat';
import { QueuePanel } from './components/QueuePanel';
import { NeteaseLoginModal } from './components/NeteaseLoginModal';
import { parseLyrics } from './utils/lyrics';
import { getRandomStatus } from './utils/statusPool';
import { UserProfile, RecommendationData } from './types';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string | React.ReactNode;
  options?: { label: string; prompt: string }[];
  optionsDisabled?: boolean;
}

import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, serverTimestamp, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore_errors';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const recRef = useRef<RecommendationData | null>(null);
  const idxRef = useRef(0);
  const playRef = useRef(false);
  const loadingRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const consecutiveSkipsRef = useRef(0);

  const [loading, setLoading] = useState(false);

  const [agentStatus, setAgentStatus] = useState<string>('');
  const [streamedText, setStreamedText] = useState<string>('');
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [tasteMemories, setTasteMemories] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>(Math.random().toString(36).substring(7));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sessionMood, setSessionMood] = useState('Deep focus');
  const [weatherData, setWeatherData] = useState({ icon: 'partly_cloudy_day', text: 'Clear / 22°C' });
  const [isAnalyzingTaste, setIsAnalyzingTaste] = useState(false);
  const isAnalyzingRef = useRef(false);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);

  useEffect(() => {
     recRef.current = recommendation;
     idxRef.current = currentTrackIndex;
     playRef.current = isPlaying;
     loadingRef.current = loading;
     consecutiveSkipsRef.current = consecutiveSkips;
  }, [recommendation, currentTrackIndex, isPlaying, loading, consecutiveSkips]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', content: "Auralis Runtime Initiated. What environment can I build for you?" }
  ]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTasteMemories = async (user: any) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'taste_memory'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const memories: any[] = [];
      querySnapshot.forEach((doc) => {
        memories.push({ id: doc.id, ...doc.data() });
      });
      setTasteMemories(memories);
    } catch (e) {
      try {
        handleFirestoreError(e, OperationType.GET, `users/${user.uid}/taste_memory`);
      } catch (err) {
        // Suppress thrown error from handleFirestoreError to avoid unhandled rejection
      }
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        fetchTasteMemories(user);
      }
    });
    return () => unsub();
  }, []);

  const saveMessageToFirebase = async (role: 'user'|'agent', content: string) => {
    if (!firebaseUser) return;
    try {
      const sessionRef = doc(db, 'users', firebaseUser.uid, 'sessions', sessionId);
      await setDoc(sessionRef, {
        userId: firebaseUser.uid,
        title: sessionMood,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      const msgId = Math.random().toString(36).substring(7);
      const msgRef = doc(sessionRef, 'messages', msgId);
      await setDoc(msgRef, {
        role,
        content,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}/sessions/${sessionId}`);
      } catch (err) {
        // Suppress thrown error from handleFirestoreError to avoid unhandled rejection
      }
    }
  };

  const handleTasteProfileCheck = async (userData: any) => {
    // Automatically trigger analysis if full profile missing
    if (!userData.hasTasteProfile && !isAnalyzingRef.current) {
      isAnalyzingRef.current = true;
      setIsAnalyzingTaste(true);
      setAgentStatus('Analyzing your flavor profile...');
      try {
        await fetch('/api/taste/analyze', { method: 'POST' });
        setAgentStatus('Flavor profile created.');
      } catch (e) {
        console.error("Taste analysis failed", e);
      } finally {
        isAnalyzingRef.current = false;
        setIsAnalyzingTaste(false);
        setAgentStatus('');
      }
    }
  };

  const fetchUserStatus = () => {
    fetch('/api/user/status')
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn) {
          setUserProfile(data.user);
          if (firebaseUser) {
             setDoc(doc(db, 'users', firebaseUser.uid), {
               neteaseId: data.user.userId?.toString(),
               updatedAt: serverTimestamp()
             }, { merge: true }).catch(err => {
               try { handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`); } catch (e) {}
             });
          }
          handleTasteProfileCheck(data);
        }
      })
      .catch(() => {});
  };


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      
      const hour = now.getHours();
      if (hour >= 6 && hour < 12) {
        setWeatherData({ icon: 'light_mode', text: 'Morning Sun / 18°C' });
      } else if (hour >= 12 && hour < 18) {
        setWeatherData({ icon: 'partly_cloudy_day', text: 'Clear / 22°C' });
      } else if (hour >= 18 && hour < 22) {
        setWeatherData({ icon: 'clear_night', text: 'Evening / 16°C' });
      } else {
        setWeatherData({ icon: 'bedtime', text: 'Midnight / 12°C' });
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    fetchUserStatus();
      
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const fetchAudioRecommendation = async (overrideMood?: string, userPrompt?: string, autoplay = true) => {
    resetIdleTimer();
    if (userPrompt) {
      consecutiveSkipsRef.current = 0;
      setConsecutiveSkips(0);
      setMessages(prev => [...prev, {role: 'user', content: userPrompt}]);
      setMessages(prev => prev.map(msg =>
        msg.options ? { ...msg, optionsDisabled: true } : msg
      ));
      saveMessageToFirebase('user', userPrompt);
      const lowerPrompt = userPrompt.toLowerCase();
      if (/(暂停|停一下|别放了|stop|pause)/.test(lowerPrompt)) {
         if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
         }
      } else if (/(继续|恢复|接着放|resume)/.test(lowerPrompt)) {
         if (audioRef.current) {
            audioRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
         }
      }
    }
    
    const targetMood = overrideMood || sessionMood;
    setSessionMood(targetMood);
    setLoading(true);
    setAgentStatus("思考中...");
    setStreamedText("");
    
    try {
      let likedSongsStr = "";
      try {
        const likeRes = await fetch('/api/netease/user/likelist');
        const likeData = await likeRes.json();
        if (likeData.success && likeData.songs?.length > 0) {
          const sample = likeData.songs.slice(0, 10);
          likedSongsStr = sample.map((s: { name: string, artist: string }) => `${s.name} - ${s.artist}`).join(', ');
        }
      } catch(e) {}

      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          contextInfo: {
            time: new Date().toLocaleTimeString(),
            activity: "coding",
            weather: "Rainy",
            objective: targetMood,
            energyLevel: "Mixed",
            userStatus: userPrompt,
            userLikedSongsSample: likedSongsStr || "N/A",
            conversationHistory: messages,
            memories: tasteMemories,
            playerState: {
              isPlaying,
              currentTrack: recommendation?.tracks?.[currentTrackIndex]?.trackName || null,
              queueLength: recommendation?.tracks?.length || 0,
              currentIndex: currentTrackIndex
            },
            consecutiveSkips: consecutiveSkipsRef.current,
          }
        })
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let jsonResponse: any = null;
      let streamedReasoning = "";
      let suggestedOptions: { label: string; prompt: string }[] | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          const eventMatch = line.match(/event: (.*)\n/);
          const dataMatch = line.match(/data: (.*)/);
          
          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const dataStr = dataMatch[1];
            let data: any = {};
            try { data = JSON.parse(dataStr); } catch(e) {}

            if (eventType === 'tool_start') {
               setAgentStatus(getRandomStatus(data.tool));
            } else if (eventType === 'tool_end') {
               if (data.tool === 'search_track') {
                  setAgentStatus("搜寻完毕");
               } else if (data.tool === 'add_to_queue') {
                  setAgentStatus("队列布置完毕");
               } else {
                  setAgentStatus("");
               }
            } else if (eventType === 'chunk') {
               streamedReasoning += data.text || "";
               setStreamedText(prev => prev + (data.text || ""));
               setAgentStatus("打字中...");
            } else if (eventType === 'update_memory') {
               setAgentStatus(getRandomStatus('update_user_memory'));
               if (firebaseUser) {
                 addDoc(collection(db, 'users', firebaseUser.uid, 'taste_memory'), {
                   fact: data.fact,
                   category: data.category,
                   createdAt: serverTimestamp()
                 }).then(() => {
                   fetchTasteMemories(firebaseUser); // Refresh the memories
                 }).catch(err => {
                   try { handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/taste_memory`); } catch (e) {}
                 });
               }
            } else if (eventType === 'suggest_options') {
               streamedReasoning = data.text || "";
               setStreamedText(data.text || "");
               suggestedOptions = data.options || [];
            } else if (eventType === 'done') {
               jsonResponse = data;
            } else if (eventType === 'error') {
               setMessages(prev => [...prev, {role: 'agent', content: 'API returned an error.'}]);
               setLoading(false);
               setAgentStatus("");
               return;
            }
          }
        }
      }

      setAgentStatus("");
      setLoading(false);

      if (jsonResponse && jsonResponse.success) {
        const data = jsonResponse.data;
        let aiMsg = data.reasoning || "";
        if (!aiMsg && data.reasoningSteps?.length > 0) {
          aiMsg = data.reasoningSteps.map((s: { step: string, detail: string }) => `[${s.step}]: ${s.detail}`).join('\n');
        }
        
        const finalAiMsg = aiMsg || streamedReasoning || `Generating new soundscape based on your input.`;
        console.log("Agent response ->", { act: data.action, tracksLength: data.tracks?.length, aiMsg: finalAiMsg });
        if (suggestedOptions && suggestedOptions.length > 0) {
          setMessages(prev => [...prev, {
            role: 'agent',
            content: finalAiMsg,
            options: suggestedOptions
          }]);
          suggestedOptions = null;
        } else {
          setMessages(prev => [...prev, {
            role: 'agent',
            content: finalAiMsg
          }]);
        }
        saveMessageToFirebase('agent', finalAiMsg);

        const act = data.action || "chat";
        const newTracks = data.tracks || [];

        const input = userPrompt?.toLowerCase() || '';
        const userSaidPause = /(暂停|停一下|别放了|先停|stop|pause)/.test(input);
        const userSaidResume = /(继续|恢复|接着放|resume)/.test(input);
        const userSaidSkip = /(切歌|下一首|换一首|skip|next)/.test(input);

        if (userSaidPause && act !== "pause") {
           console.warn("Agent ignored pause command, overriding act to pause.");
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
           }
           setLoading(false);
           return;
        } else if (userSaidResume && act !== "resume") {
           console.warn("Agent ignored resume command, overriding act to resume.");
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           if (audioRef.current) {
              audioRef.current.play().catch(() => setIsPlaying(false));
              setIsPlaying(true);
           }
           setLoading(false);
           return;
        } else if (userSaidSkip && act !== "skip") {
           console.warn("Agent ignored skip command, overriding act to skip.");
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           const currentRec = recRef.current;
           const currentIdx = idxRef.current;
           if (currentRec?.tracks && currentIdx < currentRec.tracks.length - 1) {
              const nextIdx = currentIdx + 1;
              applyAndPlayTrack(currentRec.tracks[nextIdx], nextIdx, true);
           } else {
              setMessages(prev => [...prev, {role: 'agent', content: "There are no more tracks in the queue to skip to."}]);
           }
           setLoading(false);
           return;
        }

        if (act === "suggest") {
           consecutiveSkipsRef.current = 0;
           setConsecutiveSkips(0);
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           setLoading(false);
           return;
        } else if (act === "pause") {
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
           }
        }
        else if (act === "resume") {
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           if (audioRef.current) {
              audioRef.current.play().catch(() => setIsPlaying(false));
              setIsPlaying(true);
           }
        }
        else if (act === "skip") {
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           const currentRec = recRef.current;
           const currentIdx = idxRef.current;
           if (currentRec?.tracks && currentIdx < currentRec.tracks.length - 1) {
              const nextIdx = currentIdx + 1;
              applyAndPlayTrack(currentRec.tracks[nextIdx], nextIdx, true);
           } else {
              setMessages(prev => [...prev, {role: 'agent', content: "There are no more tracks in the queue to skip to."}]);
           }
        }
        else if (act === "replace" || (act === "chat" && newTracks.length > 0)) {
           setRecommendation(prev => ({ ...prev, tracks: newTracks, reasoning: finalAiMsg }));
           setCurrentTrackIndex(0);
           
           if (newTracks.length === 1) {
             applyAndPlayTrack(newTracks[0], 0, autoplay);
           } else if (newTracks.length > 1) {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
                audioRef.current.currentTime = 0;
              }
              setIsPlaying(false);
              setIsQueueExpanded(true);
              const revisedMsg = finalAiMsg + "\n\n给你挑了几首，点一首开始吧：";
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] = { role: 'agent', content: revisedMsg };
                return newArr;
              });
           } else {
              setIsPlaying(false);
           }
        } 
        else if (act === "add") {
           setRecommendation(prev => {
              if (!prev || !prev.tracks) return { ...prev, tracks: newTracks, reasoning: finalAiMsg };
              return { ...prev, tracks: [...prev.tracks, ...newTracks], reasoning: finalAiMsg };
           });
           if (!recRef.current?.tracks || recRef.current.tracks.length === 0) {
               if (newTracks[0]) {
                 applyAndPlayTrack(newTracks[0], 0, autoplay);
               }
           }
        } 
        else {
           // chat only 
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
        }
      } else {
        setMessages(prev => [...prev, {role: 'agent', content: 'Connection lost or API error.'}]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {role: 'agent', content: 'Connection lost or API error.'}]);
    }
    setLoading(false);
  };

  const sendFeedback = async (type: 'skip' | 'love', track: any) => {
    if (!track) return;
    const trackInfo = `${track.trackName} - ${track.artist}`;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, trackInfo })
      });
    } catch(e) {}
  };

  const handleChipClick = (prompt: string, label: string) => {
    setMessages(prev => prev.map(msg =>
      msg.options ? { ...msg, optionsDisabled: true } : msg
    ));
    setMessages(prev => [...prev, { role: 'user', content: label }]);
    saveMessageToFirebase('user', label);
    fetchAudioRecommendation(undefined, prompt);
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!loadingRef.current && !recRef.current?.tracks?.length) {
        fetchAudioRecommendation(undefined, undefined, false);
      }
    }, 5 * 60 * 1000);
  };

  const applyAndPlayTrack = (track: any, index: number, shouldPlay: boolean = true) => {
    if (!track) return;
    
    // 先停止当前播放，避免新旧音频交叉
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentTrackIndex(index);
    if (track.audioUrl && track.audioUrl !== "vip_free_trial" && audioRef.current) {
      audioRef.current.src = "/api/proxy-audio?url=" + encodeURIComponent(track.audioUrl);
      audioRef.current.load();
      if (shouldPlay) {
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(false);
      setMessages(prev => [...prev, {role: 'agent', content: `[System]: Track "${track.trackName}" by ${track.artist} restricts API access (VIP limited) or is unavailable.`}]);
    }
  };

  const playTrack = (index: number) => {
    if (!recommendation?.tracks || !recommendation.tracks[index]) return;
    applyAndPlayTrack(recommendation.tracks[index], index, true);
  };

  const nextTrack = (isManualSkip: boolean = true) => {
    if (recommendation?.tracks) {
      const isEnd = currentTrackIndex >= recommendation.tracks.length - 1;

      if (isManualSkip) {
         const currentTrack = recommendation.tracks[currentTrackIndex];
         sendFeedback('skip', currentTrack);
         
         const nextSkips = consecutiveSkipsRef.current + 1;
         consecutiveSkipsRef.current = nextSkips;
         setConsecutiveSkips(nextSkips);

         if (nextSkips >= 3) {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            setTimeout(() => {
              fetchAudioRecommendation(undefined, undefined, false);
            }, 100);
            return;
         }
      } else {
         consecutiveSkipsRef.current = 0;
         setConsecutiveSkips(0);
      }

      if (!isEnd) {
        playTrack(currentTrackIndex + 1);
      } else {
        if (isManualSkip) {
          fetchAudioRecommendation(undefined, "Keep playing similar tracks.");
        } else {
          fetchAudioRecommendation(undefined, undefined, false);
        }
      }
    }
  };

  const prevTrack = () => {
    if (recommendation?.tracks && currentTrackIndex > 0) {
      playTrack(currentTrackIndex - 1);
    }
  };

  const handleTrackRemove = (index: number) => {
    if (recommendation?.tracks) {
       const trackToRemove = recommendation.tracks[index];
       if (trackToRemove) {
          sendFeedback('skip', trackToRemove);
       }
    }
    
    setRecommendation(prev => {
      if (!prev || !prev.tracks) return prev;
      const newTracks = [...prev.tracks];
      newTracks.splice(index, 1);
      
      setCurrentTrackIndex(prevIndex => {
        if (index === prevIndex) {
           if (index < newTracks.length) {
              // Same index, new track. Defer playing it until state settles?
              // Side effect in set state is bad, let's defer it via setTimeout
              setTimeout(() => {
                 applyAndPlayTrack(newTracks[index], index, true);
              }, 0);
              return index;
           } else {
              setTimeout(() => {
                 if (audioRef.current) {
                   audioRef.current.pause();
                   setIsPlaying(false);
                 }
              }, 0);
              return Math.max(0, newTracks.length - 1);
           }
        } else if (index < prevIndex) {
           return prevIndex - 1;
        }
        return prevIndex;
      });

      return { ...prev, tracks: newTracks };
    });
  };

  const handleClearQueue = () => {
    if (recommendation?.tracks) {
        recommendation.tracks.forEach(track => sendFeedback('skip', track));
    }
    setRecommendation(prev => prev ? { ...prev, tracks: [] } : null);
    setCurrentTrackIndex(0);
    setIsQueueExpanded(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    fetchAudioRecommendation(undefined, undefined, false);
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, []);

  const togglePlay = () => {
    resetIdleTimer();
    const currentTrack = recommendation?.tracks?.[currentTrackIndex];
    const expectedSrc = currentTrack?.audioUrl && currentTrack.audioUrl !== "vip_free_trial"
        ? "/api/proxy-audio?url=" + encodeURIComponent(currentTrack.audioUrl)
        : null;

    if (!audioRef.current?.src || 
        audioRef.current.src === window.location.href ||
        (expectedSrc && !audioRef.current.src.includes(expectedSrc))) {
      if (currentTrack && !loading) {
        playTrack(currentTrackIndex);
      } else if (!recommendation && !loading) {
        fetchAudioRecommendation();
      }
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const currentTrack = recommendation?.tracks?.[currentTrackIndex];
  const parsedLyrics = useMemo(() => parseLyrics(currentTrack?.lyrics || ''), [currentTrack?.lyrics]);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans overflow-hidden relative">
      <div className="weather-glow-container fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-[#1E293B] blur-[120px] animate-float-slow opacity-60"></div>
        <div className="absolute top-[30%] -right-[15%] w-[70%] h-[70%] rounded-full bg-[#2D2A3E] blur-[140px] animate-rotate-slow opacity-50" style={{animationDuration: '40s', animationDirection: 'reverse'}}></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-[#0D9488] blur-[150px] animate-float-slow opacity-20" style={{animationDelay: '-5s'}}></div>
        <div className="absolute inset-0 bg-background/20 backdrop-grayscale-[0.2]"></div>
      </div>

      <header className="bg-transparent w-full pt-8 px-6 flat no shadows z-20 shrink-0">
        <div className="flex justify-between items-center w-full max-w-2xl mx-auto">
          <button 
             onClick={togglePlay}
             className="text-primary hover:opacity-80 transition-opacity scale-95 duration-200 transition-transform flex items-center justify-center w-10 h-10 smooth-transition"
          >
            {isPlaying ? (
              <span className="material-symbols-outlined animate-pulse-soft text-[28px]" style={{fontVariationSettings: "'FILL' 0"}}>graphic_eq</span>
            ) : (
              <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
            )}
          </button>
          <h1 className="text-headline-md font-headline-md font-bold tracking-tight text-on-surface">Auralis</h1>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="text-primary hover:opacity-80 transition-opacity scale-95 duration-200 transition-transform flex items-center justify-center w-10 h-10 smooth-transition"
          >
            {userProfile ? (
              <img src={userProfile.avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full border border-white/20 shadow-md" title={userProfile.nickname} />
            ) : (
              <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 0"}}>person</span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-container-padding-desktop pb-6 pt-4 relative custom-scrollbar">
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="max-w-xl mx-auto flex flex-col gap-stack-md relative z-10 pb-16">
          <AmbientStatusBar 
            timeStr={timeStr} 
            sessionMood={sessionMood} 
            weatherIcon={weatherData.icon} 
            weatherText={weatherData.text} 
          />
          
          <div className="bg-surface-variant/40 backdrop-blur-2xl rounded-[32px] p-6 border-t border-l border-white/10 shadow-2xl flex flex-col gap-6 transform transition-all duration-500">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={currentTrack?.matchedSongDetail?.name || currentTrack?.trackName || 'Initializing Model'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="text-headline-md font-headline-md font-bold text-on-surface truncate"
                  >
                    {currentTrack?.matchedSongDetail?.name || currentTrack?.trackName || 'Initializing Model'}
                  </motion.h2>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentTrack?.matchedSongDetail?.ar?.[0]?.name || currentTrack?.artist || 'Standby'}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="text-body-md font-body-md text-on-surface-variant truncate"
                  >
                    {currentTrack?.matchedSongDetail?.ar?.[0]?.name || currentTrack?.artist || 'Standby'}
                  </motion.p>
                </AnimatePresence>
                <MinimalLyrics lyrics={parsedLyrics} currentTime={currentTime} />
              </div>
              <div className="relative shrink-0 mt-2">
                <div className={`absolute inset-0 bg-primary/30 blur-2xl rounded-full mix-blend-screen transition-all duration-1000 ${isPlaying ? 'scale-[1.3] opacity-100 animate-pulse-soft' : 'scale-100 opacity-50'}`}></div>
                <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-surface/50 relative z-10 backdrop-blur-md">
                  <AnimatePresence mode="popLayout">
                    {(currentTrack?.imageUrl || currentTrack?.matchedSongDetail?.al?.picUrl) ? (
                       <motion.img 
                         key={currentTrack?.imageUrl || currentTrack?.matchedSongDetail?.al?.picUrl}
                         initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                         animate={{ opacity: 1, scale: isPlaying ? 1.05 : 1, rotate: 0 }}
                         exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                         transition={{ duration: 0.5, ease: "easeOut" }}
                         src={currentTrack.imageUrl || currentTrack.matchedSongDetail?.al?.picUrl} 
                         className="w-full h-full object-cover origin-center" 
                       />
                    ) : (
                       <motion.div 
                         key="placeholder"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="w-full h-full flex items-center justify-center text-on-surface-variant/20 absolute inset-0"
                       >
                         <span className="material-symbols-outlined text-[48px]">album</span>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={prevTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-on-surface-variant shrink-0">
                 <span className="material-symbols-outlined text-[20px]">skip_previous</span>
              </button>
              <span className="text-label-sm font-label-sm text-on-surface-variant w-8 text-right shrink-0">{formatTime(currentTime)}</span>
              <WaveformScrubber 
                 duration={duration} 
                 currentTime={currentTime} 
                 audioUrl={(currentTrack?.audioUrl && currentTrack.audioUrl !== "vip_free_trial") ? `/api/proxy-audio?url=${encodeURIComponent(currentTrack.audioUrl)}` : undefined}
                 onSeek={(pct) => {
                 if (audioRef.current && duration) {
                    audioRef.current.currentTime = pct * duration;
                    setCurrentTime(pct * duration);
                 }
              }} />
              <span className="text-label-sm font-label-sm text-on-surface-variant w-8 shrink-0">{formatTime(duration)}</span>
              <button onClick={nextTrack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors text-on-surface-variant shrink-0">
                 <span className="material-symbols-outlined text-[20px]">skip_next</span>
              </button>
            </div>
          </div>
          
          <QueuePanel 
            tracks={recommendation?.tracks || []} 
            currentIndex={currentTrackIndex}
            onSelect={(idx) => playTrack(idx)}
            onRemove={handleTrackRemove}
            onClear={handleClearQueue}
            onRefresh={() => fetchAudioRecommendation(undefined, "换一批歌曲 (Refresh queue with new tracks)")}
            isExpanded={isQueueExpanded}
            onToggleExpand={() => setIsQueueExpanded(!isQueueExpanded)}
          />

          <ModernChat messages={messages} onSend={(txt) => fetchAudioRecommendation(undefined, txt)} loading={loading} agentStatus={agentStatus} streamedText={streamedText} onChipClick={handleChipClick} />
        </div>
      </main>

      <audio 
        ref={audioRef} 
        crossOrigin="anonymous"
        onEnded={() => nextTrack(false)} 
        onTimeUpdate={() => { if(audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
        onLoadedMetadata={() => { if(audioRef.current) setDuration(audioRef.current.duration); }}
      />
      <NeteaseLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          fetchUserStatus();
          fetchAudioRecommendation();
        }}
      />
    </div>
  );
}
