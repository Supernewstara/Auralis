import path from 'path';
import fs from 'fs';
import { chatCompletion } from './llm_client.js';
import { generateSystemRole, generateDecisionPrompt } from './prompts.js';
import { toolDefinitions } from './tools.js';
import OpenAI from 'openai';
import NeteaseCloudMusicApi from 'NeteaseCloudMusicApi';

export interface RecommendRequest {
  enhancedContext: string;
  rawContext: any;
  cookie?: string;
  onEvent?: (event: string, payload: any) => void;
}

export async function processRecommendation(reqData: RecommendRequest) {
  const { enhancedContext, rawContext } = reqData;

  // 1. Load Taste Profile
  let profileStr = "None extracted yet.";
  try {
    const profilePath = path.join(process.cwd(), 'server', 'prompts', 'taste_profile.json');
    if (fs.existsSync(profilePath)) {
      profileStr = fs.readFileSync(profilePath, 'utf-8');
    }
  } catch (e) {
    console.error("Error reading taste profile", e);
  }

  // 2. Generate Prompts
  const systemRole = generateSystemRole();
  const userPrompt = generateDecisionPrompt(profileStr, enhancedContext, rawContext);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemRole }
  ];

  const conversationHistory = rawContext.conversationHistory || [];
  for (const msg of conversationHistory) {
    if (msg.role === 'user' || msg.role === 'agent') {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content || "" });
    }
  }

  // Explicitly push the latest user status as a user message
  if (rawContext && rawContext.userStatus) {
    messages.push({ role: "user", content: String(rawContext.userStatus) });
  }

  // The latest context/instructions go at the end to ensure they aren't ignored
  messages.push({ role: "system", content: userPrompt });

  // 3. React Loop
  let loopCount = 0;
  let finalTracks: any[] = [];
  let finalReasoning = "";
  let finalAction = "none";

  while (loopCount < 8) {
    loopCount++;
    console.log(`=== Agent Loop Iteration ${loopCount} ===`);
    
    let response;
    try {
      response = await chatCompletion(messages, toolDefinitions, "auto");
    } catch (error) {
      console.error("LLM Error:", error);
      break;
    }
    
    const choice = response.choices[0];

    if (choice.finish_reason === "stop") {
      // Direct reply
      if (choice.message.content) {
         finalReasoning = finalReasoning ? finalReasoning + "\n" + choice.message.content : choice.message.content;
         if (reqData.onEvent) {
           reqData.onEvent('chunk', { text: choice.message.content });
         }
      }
      break;
    }

    if (choice.finish_reason === "tool_calls" || choice.message.tool_calls) {
      const toolCalls = choice.message.tool_calls;
      messages.push(choice.message); // push assistant message with tool calls
      
      let done = false;

      // Handle parallel tool calls
      const toolResults = await Promise.all(toolCalls!.map(async (tc) => {
        const functionName = tc.function.name;
        const argsStr = tc.function.arguments;
        console.log(`[Tool Call] ${functionName}:`, argsStr);
        
        let args: any = {};
        try {
          args = JSON.parse(argsStr);
        } catch(e){}
        
        if (reqData.onEvent) {
           reqData.onEvent('tool_start', { tool: functionName, args });
        }
        
        let resultContent = "Success";
        try {
          if (functionName === "chat_reply") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            done = true;
          } else if (functionName === "play_tracks") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            finalAction = "replace";
            if (args.track_ids && args.track_ids.length > 0) {
              const detailResult = await NeteaseCloudMusicApi.song_detail({ ids: args.track_ids.join(','), cookie: reqData.cookie });
              const urlResult = await NeteaseCloudMusicApi.song_url_v1({ id: args.track_ids.join(','), level: 'exhigh', cookie: reqData.cookie } as any);
              
              if (detailResult.status === 200 && urlResult.status === 200) {
                 const songs = detailResult.body.songs as any[];
                 const urls = urlResult.body.data as any[];
                 
                 finalTracks = args.track_ids.map((id: any) => {
                    const song = songs.find(s => s.id == id);
                    const urlInfo = urls.find(u => u.id == id);
                    const finalUrl = urlInfo?.url || (urlInfo?.freeTrialInfo ? "vip_free_trial" : "");
                    return {
                       id,
                       trackName: song?.name || "Unknown Track",
                       artist: song?.ar?.map((a:any) => a.name).join(', ') || "Unknown Artist",
                       imageUrl: song?.al?.picUrl || "",
                       audioUrl: finalUrl,
                       confidence: 'High'
                    };
                 });
              }
            }
            done = true;
          } else if (functionName === "add_to_queue") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            finalAction = "add";
            if (args.track_ids && args.track_ids.length > 0) {
              const detailResult = await NeteaseCloudMusicApi.song_detail({ ids: args.track_ids.join(','), cookie: reqData.cookie });
              const urlResult = await NeteaseCloudMusicApi.song_url_v1({ id: args.track_ids.join(','), level: 'exhigh', cookie: reqData.cookie } as any);
              
              if (detailResult.status === 200 && urlResult.status === 200) {
                 const songs = detailResult.body.songs as any[];
                 const urls = urlResult.body.data as any[];
                 
                 finalTracks = args.track_ids.map((id: any) => {
                    const song = songs.find(s => s.id == id);
                    const urlInfo = urls.find(u => u.id == id);
                    const finalUrl = urlInfo?.url || (urlInfo?.freeTrialInfo ? "vip_free_trial" : "");
                    return {
                       id,
                       trackName: song?.name || "Unknown Track",
                       artist: song?.ar?.map((a:any) => a.name).join(', ') || "Unknown Artist",
                       imageUrl: song?.al?.picUrl || "",
                       audioUrl: finalUrl,
                       confidence: 'High'
                    };
                 });
              }
            }
            done = true;
          } else if (functionName === "skip_current") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            finalAction = "skip";
            done = true;
          } else if (functionName === "pause_playback") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            finalAction = "pause";
            done = true;
          } else if (functionName === "resume_playback") {
            finalReasoning = finalReasoning ? finalReasoning + "\n" + args.text : args.text;
            finalAction = "resume";
            done = true;
          } else if (functionName === "update_user_memory") {
            // Emitting custom event, the client will catch this and save to Firebase
            if (reqData.onEvent) {
              reqData.onEvent("update_memory", {
                fact: args.fact,
                category: args.category
              });
            }
            resultContent = "Memory updated successfully";
            // We do NOT set done = true because they should continue with other tool calls if needed
          } else if (functionName === "search_track") {
            const result = await NeteaseCloudMusicApi.search({ keywords: args.query, limit: 5, cookie: reqData.cookie });
            if (result.status === 200) {
               const songs = (result.body.result as any)?.songs || [];
               if (songs.length === 0) {
                 resultContent = JSON.stringify({ found: false, query: args.query, suggestion: "Try different keywords or shorter query." });
               } else {
                 resultContent = JSON.stringify({
                   found: true,
                   tracks: songs.map((s: any) => ({
                     name: s.name, 
                     artist: s.ar?.map((a: any) => a.name).join(', '),
                     id: s.id
                   }))
                 });
               }
            } else {
               resultContent = JSON.stringify({ found: false, error: "Search failed." });
            }
          }
        } catch(e: any) {
          console.error("Failed to execute tool:", e);
          resultContent = "Error: " + e.message;
        }

        if (reqData.onEvent) {
           let parsedResult = resultContent;
           try {
              if (resultContent.startsWith('{') || resultContent.startsWith('[')) {
                 parsedResult = JSON.parse(resultContent);
              }
           } catch(e){}
           reqData.onEvent('tool_end', { tool: functionName, result: parsedResult });
        }

        return {
           role: "tool" as const,
           tool_call_id: tc.id,
           content: resultContent
        };
      }));

      for (const res of toolResults) {
        messages.push(res);
      }

      if (done) {
        break;
      }
    }
  }

  return {
    reasoning: finalReasoning,
    tracks: finalTracks,
    action: finalAction,
    reasoningSteps: []
  };
}
