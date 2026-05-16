import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import ncm from "NeteaseCloudMusicApi";
import fs from "fs";
import { Readable } from "stream";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/proxy-audio", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).send("No url");
    try {
      const headers: Record<string, string> = {};
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }
      
      const fetchRes = await fetch(url, { headers });
      
      res.status(fetchRes.status);
      fetchRes.headers.forEach((val, key) => {
        const lowerKey = key.toLowerCase();
        if (['content-type', 'content-length', 'accept-ranges', 'content-range'].includes(lowerKey)) {
          res.setHeader(key, val);
        }
      });
      res.setHeader('Access-Control-Allow-Origin', '*');

      const body = fetchRes.body;
      if (body) {
        const readable = Readable.fromWeb(body as any);
        readable.pipe(res);
      } else {
        res.end();
      }
    } catch (e) {
      console.error("Proxy error:", e);
      res.status(500).send("Proxy error");
    }
  });

  const cookieFilePath = path.join(process.cwd(), '.netease_cookie.txt');
  let globalCookie = "";
  if (fs.existsSync(cookieFilePath)) {
    try {
      globalCookie = fs.readFileSync(cookieFilePath, 'utf-8');
      console.log("Loaded Netease cookie from local file.");
    } catch(e) { console.error("Could not load cookie", e); }
  }

  // 1. Generate QR code key
  app.get("/api/netease/qr/key", async (req, res) => {
    try {
      const result = await ncm.login_qr_key({});
      res.json(result.body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 2. Generate QR code image
  app.get("/api/netease/qr/create", async (req, res) => {
    try {
      const { key } = req.query;
      const result = await ncm.login_qr_create({ key: key as string, qrimg: true });
      res.json(result.body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Check QR code status
  app.get("/api/netease/qr/check", async (req, res) => {
    try {
      const { key } = req.query;
      const result = await ncm.login_qr_check({ key: key as string, timestamp: Date.now(), noCookie: false } as any);
      if (result.body.code === 803) {
        globalCookie = (result.cookie as any).join(";");
        try {
          fs.writeFileSync(cookieFilePath, globalCookie, 'utf-8');
        } catch(e) { console.error("Error saving cookie", e); }
      }
      res.json(result.body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Check login status
  app.get("/api/netease/login/status", async (req, res) => {
    try {
      const result = await ncm.login_status({ cookie: globalCookie });
      res.json(result.body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get user liked songs
  app.get("/api/netease/user/likelist", async (req, res) => {
    try {
      if (!globalCookie) {
        return res.status(401).json({ error: 'Not logged in' });
      }
      const statusRes = await ncm.login_status({ cookie: globalCookie });
      const profile = (statusRes.body?.data as any)?.profile;
      if (!profile?.userId) {
        return res.status(401).json({ error: 'Not logged in or invalid token' });
      }

      const likeRes = await ncm.likelist({ uid: profile.userId, cookie: globalCookie });
      const ids = (likeRes.body?.ids as number[]) || [];
      
      if (ids.length === 0) {
        return res.json({ success: true, songs: [] });
      }

      // Fetch details for the first 50 liked songs
      const detailsRes = await ncm.song_detail({ ids: ids.slice(0, 50).join(','), cookie: globalCookie });
      const songs = (detailsRes.body?.songs as any[]) || [];
      
      const formattedSongs = songs.map(s => ({
        id: s.id,
        name: s.name,
        artist: s.ar?.map((a: any) => a.name).join(', ')
      }));

      res.json({ success: true, songs: formattedSongs });
    } catch (e: any) {
      console.error('likelist error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Add User Status endpoint
  app.get("/api/user/status", async (req, res) => {
    try {
      if (!globalCookie) {
         return res.json({ loggedIn: false });
      }
      const statusRes = await ncm.login_status({ cookie: globalCookie });
      const profile = (statusRes.body?.data as any)?.profile;
      if (profile && profile.userId) {
         return res.json({ loggedIn: true, user: profile });
      }
      return res.json({ loggedIn: false });
    } catch (e: any) {
      res.json({ loggedIn: false, error: e.message });
    }
  });

  // Analyze user taste profile (Full Taste Brain Built)
  app.post("/api/taste/analyze", async (req, res) => {
    try {
      if (!globalCookie) {
        return res.status(401).json({ error: 'Not logged in' });
      }
      const statusRes = await ncm.login_status({ cookie: globalCookie });
      const profile = (statusRes.body?.data as any)?.profile;
      if (!profile?.userId) {
        return res.status(401).json({ error: 'Not logged in or invalid token' });
      }

      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY (or DEEPSEEK_API_KEY) inside environment variables is required.");
      }

      const { buildTasteBrain } = await import('./server/taste_brain/index.js');
      const result = await buildTasteBrain(profile.userId, globalCookie, apiKey);

      res.json(result);
    } catch (e: any) {
      console.error('Taste analysis error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, trackInfo } = req.body; // type: 'skip' | 'love'
      const { memoryStore } = await import('./server/context_layer/memory.js');
      
      if (type === 'skip') {
        memoryStore.recordSkip(trackInfo);
      } else if (type === 'love') {
        memoryStore.recordLove(trackInfo);
      }
      res.json({ success: true });
    } catch(err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/recommend", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const writeEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { contextInfo } = req.body;
      
      const { assembleContext } = await import('./server/context_layer/index.js');
      const enhancedContext = assembleContext({
         mood: contextInfo?.objective || "未指明",
         userMessage: contextInfo?.userMessage || contextInfo?.userStatus || ""
      });

      if (contextInfo?.userMessage || contextInfo?.userStatus) {
        const { memoryStore } = await import('./server/context_layer/memory.js');
        memoryStore.recordTopic(contextInfo?.userMessage || contextInfo?.userStatus || "");
      }
      
      const { processRecommendation } = await import('./server/agent_brain/index.js');
      
      const data = await processRecommendation({
        enhancedContext,
        rawContext: contextInfo,
        cookie: globalCookie,
        onEvent: (event, payload) => {
          writeEvent(event, payload);
        }
      });

      let matchedTracks = [];
      try {
        if (data.tracks && Array.isArray(data.tracks)) {
          matchedTracks = await Promise.all(
            data.tracks.map(async (track: any) => {
              if (track.id) {
                // Track is already enriched by play_tracks tool
                let lyricsInfo = null;
                if (track.id) {
                   try {
                     const lyricRes = await ncm.lyric({ id: track.id, cookie: globalCookie });
                     if (lyricRes.body.lrc && (lyricRes.body.lrc as any).lyric) {
                         lyricsInfo = (lyricRes.body.lrc as any).lyric;
                     }
                   } catch(e) { console.error("lyric error", e); }
                }
                if (track.audioUrl && track.audioUrl.startsWith('http://')) {
                  track.audioUrl = track.audioUrl.replace('http://', 'https://');
                }
                return { ...track, lyrics: lyricsInfo };
              }

              // Fallback for LLMs directly outputting tracks without tools (shouldn't happen now but just in case)
              const searchQuery = `${track.trackName} ${track.artist}`;
              let matchedSongDetail = null;
              let matchedSongUrl = null;
              let lyricsInfo = null;

              try {
                const searchRes = await ncm.cloudsearch({ keywords: searchQuery, limit: 1, cookie: globalCookie });
                const resultData = searchRes.body.result as any;
                
                if (resultData?.songs && resultData.songs.length > 0) {
                  const songId = resultData.songs[0].id;
                  matchedSongDetail = resultData.songs[0];
                  
                  const urlRes = await ncm.song_url_v1({ id: songId, level: 'exhigh' as any, cookie: globalCookie });
                  const urlData = urlRes.body.data as any;
                  
                  if (urlData && urlData.length > 0 && urlData[0].url) {
                    matchedSongUrl = urlData[0].url;
                    if (matchedSongUrl.startsWith('http://')) {
                      matchedSongUrl = matchedSongUrl.replace('http://', 'https://');
                    }
                  } else {
                    if (urlData && urlData.length > 0 && urlData[0].freeTrialInfo) {
                       matchedSongUrl = "vip_free_trial";
                    } else {
                       console.log("Empty or no url in song_url response for VIP exhigh level:", urlData);
                    }
                  }

                  if (songId) {
                    try {
                      const lyricRes = await ncm.lyric({ id: songId, cookie: globalCookie });
                      if (lyricRes.body.lrc && (lyricRes.body.lrc as any).lyric) {
                          lyricsInfo = (lyricRes.body.lrc as any).lyric;
                      }
                    } catch(e) { console.error("lyric error", e); }
                  }
                }
              } catch (ncmErr) {
                console.error("NCM Search Error:", ncmErr);
              }

              return {
                ...track,
                matchedSongDetail,
                audioUrl: matchedSongUrl,
                lyrics: lyricsInfo
              };
            })
          );
        }
      } catch (err) {
        console.error("Error matching tracks", err);
      }

      writeEvent('done', {
        success: true,
        data: {
          ...data,
          tracks: matchedTracks
        }
      });
      res.end();
    } catch (e: any) {
      console.error(e);
      writeEvent('error', { success: false, error: e.message });
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
