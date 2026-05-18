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

    // 防止并发请求互相覆盖
    if (loadingRef.current) return;
    loadingRef.current = true;

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

        // suggest 必须在 setMessages 之前处理，确保 options 被附加
        if (data.action === "suggest") {
           consecutiveSkipsRef.current = 0;
           setConsecutiveSkips(0);
           const displayOptions = (suggestedOptions && suggestedOptions.length > 0)
             ? suggestedOptions
             : [
                 { label: '继续当前风格', prompt: '继续放类似的歌' },
                 { label: '换换口味', prompt: '换一种完全不同风格的歌' },
                 { label: '随便来点', prompt: '随便放几首歌' }
               ];
           setMessages(prev => [...prev, {
             role: 'agent',
             content: finalAiMsg,
             options: displayOptions
           }]);
           saveMessageToFirebase('agent', finalAiMsg);
           setRecommendation(prev => prev ? { ...prev, reasoning: finalAiMsg } : null);
           setLoading(false);
           return;
        }

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

        if (act === "pause") {
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
           setConsecutiveSkips(0);
           consecutiveSkipsRef.current = 0;
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
           setConsecutiveSkips(0);
           consecutiveSkipsRef.current = 0;
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
      if (isManualSkip) {
         const currentTrack = recommendation.tracks[currentTrackIndex];
         sendFeedback('skip', currentTrack);
         
         const nextSkips = consecutiveSkipsRef.current + 1;
         consecutiveSkipsRef.current = nextSkips;
         setConsecutiveSkips(nextSkips);

         if (nextSkips >= 3) {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            fetchAudioRecommendation(undefined, undefined, false);
            return;
         }
      }

      if (currentTrackIndex < recommendation.tracks.length - 1) {
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

    // 队列为空时，点播放应该触发推荐，而不是尝试播放
    if (!recommendation?.tracks || recommendation.tracks.length === 0) {
      if (!loading) fetchAudioRecommendation();
      return;
    }

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

  // Get the latest agent message to display
  const latestAgentMessage = messages.filter(m => m.role === 'agent').pop();
  const displayMessageStr = latestAgentMessage ? (typeof latestAgentMessage.content === 'string' ? latestAgentMessage.content : '') : 'Auralis Runtime Initiated.';
  const displayOptions = latestAgentMessage?.options || [];

  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && !loading) {
      fetchAudioRecommendation(undefined, inputText);
      setInputText('');
    }
  };

  return (
    <div className="text-on-surface bg-background min-h-screen flex flex-col relative selection:bg-primary/30 selection:text-primary overflow-hidden">
      {/* Ambient Background & Auras */}
      <div className="ambient-aura-container">
        <div className="aura-blob aura-1" style={{ 
            background: `radial-gradient(circle, ${isPlaying ? 'rgba(46,45,107,1)' : 'rgba(28,52,99,1)'} 0%, rgba(13,24,46,0) 70%)` 
        }}></div>
        <div className="aura-blob aura-2"></div>
        <div className="aura-blob aura-3"></div>
      </div>

      {/* Background Scrolling Lyrics / Atmosphere */}
      <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center z-[1] gap-8 transform -translate-y-12 mix-blend-screen overflow-hidden opacity-30">
        {parsedLyrics.slice(Math.max(0, parsedLyrics.findIndex(l => l.time >= currentTime) - 1), Math.max(0, parsedLyrics.findIndex(l => l.time >= currentTime) - 1) + 3).map((line, idx) => (
          <div key={idx} className={`font-body-lg text-primary tracking-widest text-center transition-all ${idx === 1 ? 'opacity-90 text-4xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] font-headline-md' : 'opacity-40 blur-[2px] text-2xl'}`}>
            {line.text}
          </div>
        ))}
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[2]">
        <div className="whispering-comment" style={{top: '15%', left: '10%', transform: 'rotate(-5deg)'}}>Listening to the resonance...</div>
        <div className="whispering-comment" style={{top: '45%', right: '5%', transform: 'rotate(3deg)', fontSize: '18px', opacity: 0.15}}>Drifting in the soundscape</div>
        <div className="whispering-comment" style={{top: '75%', left: '-5%', transform: 'rotate(-2deg)', fontSize: '32px', opacity: 0.1}}>Aura Runtime</div>
      </div>

      {/* TopAppBar */}
      <header className="hidden md:flex fixed top-0 w-full z-50 justify-between items-center px-container-padding-desktop py-unit backdrop-blur-[40px] bg-surface/10 transition-all duration-700 ease-in-out">
        <div className="font-display-lg-mobile text-display-lg-mobile tracking-tighter text-primary dark:text-primary">Aura</div>
        <nav className="flex gap-8"><a className="text-primary font-bold font-body-md text-body-md hover:opacity-80 transition-opacity" href="#">Aura</a></nav>
        <button className="text-primary dark:text-primary hover:opacity-80 transition-opacity" onClick={() => setIsLoginModalOpen(true)}>
          {userProfile ? (
            <img src={userProfile.avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full border border-white/20 shadow-md" title={userProfile.nickname} />
          ) : (
            <span className="material-symbols-outlined" style={{fontSize: '32px'}}>account_circle</span>
          )}
        </button>
      </header>

      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-container-padding-mobile py-unit backdrop-blur-[40px] bg-surface/10 transition-all duration-700 ease-in-out">
        <div className="font-display-lg-mobile text-display-lg-mobile tracking-tighter text-primary dark:text-primary">Aura</div>
        <button className="text-primary dark:text-primary hover:opacity-80 transition-opacity" onClick={() => setIsLoginModalOpen(true)}>
          {userProfile ? (
            <img src={userProfile.avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full border border-white/20 shadow-md" title={userProfile.nickname} />
          ) : (
            <span className="material-symbols-outlined" style={{fontSize: '32px'}}>account_circle</span>
          )}
        </button>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex w-full relative z-10 pt-24 pb-32 md:pt-32 md:pb-0 h-full overflow-y-auto custom-scrollbar">
        <main className="flex-1 flex flex-col items-center justify-start px-container-padding-mobile md:px-container-padding-desktop max-w-4xl mx-auto w-full gap-8 relative z-10 min-h-full">
          
          {/* Agent Message Area */}
          <div className="w-full max-w-2xl mt-8 flex flex-col items-center justify-center min-h-[160px]">
            {loading ? (
               <div className="flex flex-col items-center gap-4">
                  <div className="aura-core flex-shrink-0 w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl animate-pulse"></div>
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary-fixed-dim shadow-[0_0_30px_rgba(163,203,255,0.8)] flex items-center justify-center overflow-hidden animate-pulse">
                    </div>
                  </div>
                  <div className="text-primary/70 font-body-md animate-pulse">
                     {streamedText || agentStatus || 'Listening...'}
                  </div>
               </div>
            ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex gap-6 items-start w-full"
               >
                 <div className="aura-core flex-shrink-0 w-14 h-14 relative mt-1">
                   <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                   <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-secondary to-tertiary-fixed-dim shadow-[0_0_25px_rgba(163,203,255,0.6)] flex items-center justify-center overflow-hidden">
                     <div className="absolute w-8 h-8 bg-white/40 blur-md rounded-full -top-1 -left-1 animate-pulse"></div>
                     <div className="absolute w-6 h-6 bg-secondary-fixed/30 blur-sm rounded-full bottom-2 right-2 animate-bounce" style={{animationDuration: '4s'}}></div>
                   </div>
                 </div>
                 <div className="glass-chat rounded-[2rem] py-[16px] px-[24px] text-primary font-body-lg text-body-lg inline-block relative glow-active rounded-tl-sm">
                   <p className="leading-relaxed">
                     {displayMessageStr.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                   </p>
                 </div>
               </motion.div>
            )}
          </div>

          {/* Dummy Memory Keep UI (Matching HTML) */}
          <div className="w-full max-w-2xl flex items-center justify-between group relative opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex-1 glass-chat rounded-2xl py-4 px-6 border-l-4 border-primary/20">
              <p className="text-primary font-body-md opacity-90">
                Aura adapts to your vibe. Swiping will commit it to memory.
              </p>
            </div>
            <div className="flex items-center gap-4 ml-6">
              <div className="flex flex-col items-center gap-2 group/particle cursor-grab active:cursor-grabbing transition-all hover:scale-105">
                <div className="relative flex items-center justify-center">
                  <div className="memory-particle w-10 h-10 rounded-full z-10"></div>
                  <div className="absolute left-12 flex items-center swipe-hint text-primary/40 pointer-events-none">
                    <span className="material-symbols-outlined" style={{fontSize: '20px'}}>chevron_right</span>
                    <span className="material-symbols-outlined -ml-2 text-primary/20" style={{fontSize: '20px'}}>chevron_right</span>
                  </div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant/60 uppercase tracking-widest whitespace-nowrap">Keep memory?</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center border-dashed border-primary/30 group-hover:border-primary/60 transition-colors">
                  <span className="material-symbols-outlined text-primary/40" style={{fontSize: '28px'}}>psychology</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Card / Flow */}
          {recommendation?.tracks && recommendation.tracks.length > 0 && (
             <div className="w-full flex flex-col pt-8">
                <div className="w-full max-w-4xl self-center relative flex items-center justify-center h-[350px] md:h-[400px]">
                  {recommendation.tracks.map((track, i) => {
                     const offset = i - currentTrackIndex;
                     if (Math.abs(offset) > 2) return null;

                     const isCenter = offset === 0;
                     const isLeft = offset === -1;
                     const isRight = offset === 1;
                     const isFarLeft = offset <= -2;
                     const isFarRight = offset >= 2;

                     const baseClasses = "absolute aspect-square rounded-xl overflow-hidden glass-panel transition-all duration-700 transform";
                     
                     let positionalClasses = "";
                     if (isCenter) {
                       positionalClasses = "w-64 md:w-72 shadow-[0_0_50px_rgba(163,203,255,0.4)] scale-110 md:scale-125 z-30 opacity-100 group";
                     } else if (isLeft) {
                       positionalClasses = "left-4 md:left-0 w-48 md:w-64 opacity-40 hover:opacity-80 cursor-pointer -rotate-12 -translate-x-8 md:-translate-x-12 scale-90 z-10";
                     } else if (isRight) {
                       positionalClasses = "right-4 md:right-0 w-48 md:w-64 opacity-40 hover:opacity-80 cursor-pointer rotate-12 translate-x-8 md:translate-x-12 scale-90 z-10";
                     } else if (isFarLeft) {
                       positionalClasses = "left-0 w-48 md:w-64 opacity-0 -rotate-12 -translate-x-full scale-75 pointer-events-none z-0";
                     } else if (isFarRight) {
                       positionalClasses = "right-0 w-48 md:w-64 opacity-0 rotate-12 translate-x-full scale-75 pointer-events-none z-0";
                     }

                     return (
                        <div 
                           key={`track-card-${track.id || track.trackName || i}`}
                           className={`${baseClasses} ${positionalClasses}`}
                           onClick={() => {
                              if (isLeft) prevTrack();
                              if (isRight) nextTrack(true);
                           }}
                        >
                           {track ? (
                             <img alt="track" className={`w-full h-full object-cover transition-all duration-700 ${isCenter ? 'opacity-90' : 'mix-blend-luminosity'}`} src={track.imageUrl || track.matchedSongDetail?.al?.picUrl || ''}/>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-black/50"><span className="material-symbols-outlined text-4xl text-white/30">album</span></div>
                           )}

                           <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-700 ${isCenter ? 'opacity-100' : 'opacity-0'}`}></div>
                           <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isCenter ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                             <button onClick={(e) => { e.stopPropagation(); if (isCenter) togglePlay(); }} className="w-16 h-16 rounded-full border border-white/40 flex items-center justify-center bg-black/40 backdrop-blur-md text-primary hover:scale-110 transition-transform cursor-pointer pointer-events-auto">
                               <span className="material-symbols-outlined" style={{fontSize: '32px', fontVariationSettings: "'FILL' 1"}}>{isPlaying && isCenter ? 'pause' : 'play_arrow'}</span>
                             </button>
                           </div>
                           <div className={`absolute bottom-4 left-4 right-4 transition-opacity duration-700 ${isCenter ? 'opacity-100' : 'opacity-0'}`}>
                             <h3 className="text-primary font-headline-md text-xl md:text-2xl truncate">{track.trackName || 'Aura Standby'}</h3>
                             <p className="text-on-surface-variant text-[10px] md:text-xs uppercase tracking-widest truncate">{track.artist || 'Waiting for resonance'}</p>
                           </div>
                        </div>
                     );
                  })}
                </div>

                {/* Progress Bar under Carousel */}
                <div className="w-full max-w-md self-center flex items-center justify-between gap-4 mt-12 mb-4">
                  <span className="font-label-sm text-label-sm text-on-surface-variant/80 w-10 text-right">{formatTime(currentTime)}</span>
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
                  <span className="font-label-sm text-label-sm text-on-surface-variant/80 w-10">{formatTime(duration)}</span>
                </div>
             </div>
          )}

          {/* Interaction Chips */}
          {displayOptions && displayOptions.length > 0 && (
             <div className="w-full max-w-2xl flex flex-wrap gap-4 justify-center mt-2">
               {displayOptions.map((opt, idx) => {
                  const isDisabled = latestAgentMessage?.optionsDisabled;
                  return (
                    <button 
                       key={idx}
                       onClick={() => {
                          if (!isDisabled) handleChipClick(opt.prompt, opt.label);
                       }}
                       disabled={isDisabled}
                       className={`glass-panel rounded-full px-6 py-3 font-body-md text-body-md transition-colors flex items-center gap-2 group ${isDisabled ? 'opacity-40 cursor-default' : 'hover:bg-white/10 text-primary cursor-pointer'}`}
                    >
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" style={{fontSize: '20px'}}>auto_awesome</span>
                      {opt.label}
                    </button>
                  );
               })}
             </div>
          )}

          {/* Input Area */}
          <div className="w-full max-w-2xl mt-auto pt-8 mb-8 pb-10">
            <div className="glass-panel rounded-full px-6 py-4 flex items-center gap-4 bg-surface-container/60 focus-within:bg-surface-container/80 focus-within:border-primary/40 transition-all border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:border-white/20">
              <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize: '24px'}}>mic</span>
              <input 
                 className="bg-transparent border-none outline-none flex-1 text-primary font-body-md text-body-md placeholder:text-on-surface-variant/50 focus:ring-0 w-full" 
                 placeholder="Tell Aura how you feel..." 
                 type="text"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 disabled={loading}
              />
              <button 
                 onClick={handleSend}
                 disabled={!inputText.trim() || loading}
                 className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/40 transition-colors disabled:opacity-30"
              >
                 <span className="material-symbols-outlined text-primary text-sm">arrow_upward</span>
              </button>
            </div>
          </div>
        </main>

        {/* Right Side Nav (Memory Soundscape Peek) */}
        <aside className="hidden md:flex flex-col fixed right-0 top-0 h-full w-24 border-l border-white/5 backdrop-blur-[40px] z-40 items-center py-32 gap-12 bg-surface/30">
          <div className="writing-vertical-rl transform rotate-[180deg] font-label-sm text-label-sm text-on-surface-variant/50 tracking-[0.3em] uppercase mb-8">
             Memory Soundscape
          </div>
          <div className="flex flex-col gap-8 items-center relative flex-1">
            <div className="absolute top-0 bottom-0 w-[1px] bg-white/10 left-1/2 transform -translate-x-1/2 z-[-1]"></div>
            
            {['Ethereal Era', 'Vinyl Roots', 'Digital Pulse', 'Synth Waves'].map((mem, i) => (
               <button key={i} className={`rounded-full transition-colors relative group ${i === 2 ? 'w-4 h-4 bg-primary shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'w-3 h-3 bg-on-surface-variant/30 hover:bg-primary'}`}>
                 <span className={`absolute right-8 top-1/2 transform -translate-y-1/2 whitespace-nowrap font-label-sm text-label-sm text-primary bg-black/40 px-3 py-1 rounded glass-panel transition-opacity ${i === 2 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                   {mem}
                 </span>
               </button>
             ))}
          </div>
        </aside>
      </div>

      {/* Bottom Nav Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center h-20 pb-4 px-4 backdrop-blur-[40px] bg-surface/10 rounded-t-xl transition-all duration-700 ease-in-out">
        <button className="flex flex-col items-center justify-center text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110 transition-transform duration-500 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
          <span className="font-label-sm text-label-sm">Aura</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors gap-1 w-16" onClick={() => setIsQueueExpanded(!isQueueExpanded)}>
          <span className="material-symbols-outlined">library_music</span>
          <span className="font-label-sm text-label-sm">Queue</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors gap-1 w-16">
          <span className="material-symbols-outlined">timeline</span>
          <span className="font-label-sm text-label-sm">History</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors gap-1 w-16">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm text-label-sm">Settings</span>
        </button>
      </nav>

      {/* Keep full Queue Panel accessible conditionally below for mobile/hidden areas, but wait... 
          "对于现有的歌曲队列我的要求是： 保留 QueuePanel 的功能逻辑，但 UI 改为新的ui，尽你最大努力去做！"
          This means we don't need the legacy QueuePanel component anymore, we just built the UI.
          Wait, is there a way to manage the full list of tracks if there are more than 3? 
          We could render the legacy QueuePanel conditionally if they tap 'Queue' on mobile, just to keep full track list functionality. Lets keep it hidden unless asked.
      */}
      <div className={`fixed inset-0 z-40 bg-background/90 backdrop-blur-xl transition-transform duration-300 md:hidden ${isQueueExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
         <div className="pt-24 px-4 h-full overflow-y-auto pb-32">
            <h2 className="text-xl font-headline-md mb-4 text-primary">Queue</h2>
            <QueuePanel 
              tracks={recommendation?.tracks || []} 
              currentIndex={currentTrackIndex}
              onSelect={(idx) => { playTrack(idx); setIsQueueExpanded(false); }}
              onRemove={handleTrackRemove}
              onClear={handleClearQueue}
              onRefresh={() => fetchAudioRecommendation(undefined, "换一批歌曲 (Refresh queue with new tracks)")}
              isExpanded={true}
              onToggleExpand={() => setIsQueueExpanded(false)}
            />
         </div>
      </div>

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
