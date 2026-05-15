import OpenAI from "openai";
import { TasteStats } from "./analyzer.js";
import fs from "fs";
import path from "path";

// 这一层负责：调用大模型推理能力，把冰冷的统计数据提纯为 "人物画像"
export async function generateCoreProfile(stats: TasteStats, apiKey: string): Promise<any> {
  console.log(`[Taste Brain - Profile] Generating macro taste profile via LLM...`);
  
  if (!apiKey) {
    throw new Error("API Key is required to generate taste profile.");
  }

  const prompt = `
You are Auralis, the AI Systems Architect.
Your task is to act as the "Taste Brain Profile Extraction Layer".

We have extracted and ingested the user's ENTIRE 'liked' playlist into our local knowledge base.
Here are the deterministic statistics summarizing their music library:
Total Liked Songs: ${stats.totalSongs}
Top Artists & Frequency:
${stats.topArtists.map(a => `- ${a.name} (${a.count} songs)`).join('\n')}

Era/Decade Distribution (estimated):
${Object.entries(stats.publishYearDistribution).map(([era, count]) => `- ${era}: ${count} songs`).join('\n')}

Based ONLY on this objective data, generate a comprehensive, stable "Macro Taste Profile" in JSON format.
(Note: we already have Manual Preferences defined elsewhere. This is to augment and quantify the library).

Extract:
1. "inferred_genres": Top 3-5 genres inferred from the artists.
2. "era_preference": Describe their preferred music era/timeline.
3. "artist_concentration": "High" (listens to few artists heavily), "Medium", or "Low/Diverse" (listens to a wide variety).
4. "vibe_summary": A one-sentence summary of their overall library vibe (in Chinese).

Return ONLY raw JSON, no markdown blocks.
`;

  let rawTxt = "";
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com/v1" // Assuming DeepSeek base URL
  });
  
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are a helpful assistant that outputs JSON." },
      { role: "user", content: prompt }
    ],
    model: "deepseek-chat",
    response_format: { type: 'json_object' }
  });
  
  rawTxt = completion.choices[0].message.content || "";

  rawTxt = rawTxt.trim();
  const start = rawTxt.indexOf('{');
  const end = rawTxt.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end >= start) {
      rawTxt = rawTxt.substring(start, end + 1);
  }

  let profileData;
  try {
    profileData = JSON.parse(rawTxt);
  } catch (e) {
    console.error("Failed to parse LLM JSON output. Processed string:", rawTxt);
    console.error("Original rawTxt:", completion.choices[0]?.message?.content);
    throw new Error("Failed to parse the generated taste profile JSON from AI: " + (e as Error).message);
  }

  // Save to taste_profile.json
  const profilePath = path.join(process.cwd(), 'server', 'prompts', 'taste_profile.json');
  fs.writeFileSync(profilePath, JSON.stringify({
    last_updated: new Date().toISOString(),
    stats,
    inferred_profile: profileData
  }, null, 2), 'utf-8');

  console.log(`[Taste Brain - Profile] Core profile updated successfully.`);
  return profileData;
}
