import fs from 'fs';
import path from 'path';
import { SongFeatures } from './analyzer.js';

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'taste_db.json');

// MVP Phase 1: Local Knowledge Base (Prepared for Vector DB)
// 这一层未来可以平滑替换为 Chroma DB / FAISS / Qdrant 等真正向量库
export class TasteStorage {
  private songs: Map<number, SongFeatures> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        if (!data.trim()) return;
        const list: SongFeatures[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach(s => this.songs.set(s.id, s));
        }
      } catch (e) {
        console.error("Failed to load Taste DB", e);
      }
    }
  }

  saveBatch(features: SongFeatures[]) {
    features.forEach(f => this.songs.set(f.id, f));
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(Array.from(this.songs.values()), null, 2), 'utf-8');
      console.log(`[Taste Brain - Storage] Saved ${this.songs.size} songs to local knowledge base.`);
    } catch (e) {
      console.error("[Taste Brain - Storage] Failed to save DB file", e);
    }
  }

  getAll(): SongFeatures[] {
    return Array.from(this.songs.values());
  }

  getById(id: number): SongFeatures | undefined {
    return this.songs.get(id);
  }

  // 未来这里的扩展点：
  // 1. embedding() - 将 SongFeatures 转为文本描述，再转为 vector
  // 2. semanticSearch() - 配合 context (用户当前情绪)，在本地寻找 top K 最匹配的向量
}

export const tasteDB = new TasteStorage();
