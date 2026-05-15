import { fetchAllLikedSongs } from './ingestion.js';
import { extractFeatures, calculateStats } from './analyzer.js';
import { tasteDB } from './storage.js';
import { generateCoreProfile } from './profile_generator.js';

export async function buildTasteBrain(uid: number | string, cookie: string, apiKey: string) {
  // 1. 数据摄取 (Ingestion Layer) - 仅限第一优先级资源：网易云红心歌单
  console.log("=== Taste Brain Initialization Started ===");
  const rawSongs = await fetchAllLikedSongs(uid, cookie);
  
  // 2. 标签化/特征提取 (Analysis Layer)
  console.log("=== Feature Extraction ===");
  const features = extractFeatures(rawSongs);
  const stats = calculateStats(features);
  
  // 3. 构建本地知识库 (Knowledge Base / DB Layer)
  console.log("=== Saving to Local DB ===");
  tasteDB.saveBatch(features);
   
  // 4. 核心画像生成 (Profile Generation Layer)
  console.log("=== Generating Macro Profile ===");
  const profile = await generateCoreProfile(stats, apiKey);
  
  console.log("=== Taste Brain Built Successfully ===");
  
  return {
    success: true,
    message: "Taste Brain built successfully",
    totalSongsProcessed: rawSongs.length,
    profile
  };
}
