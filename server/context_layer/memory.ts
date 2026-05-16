import fs from 'fs';
import path from 'path';

export interface ShortTermMemory {
  recentSkipped: string[]; // track summaries (e.g., "Song - Artist")
  recentLoved: string[];
  recentTopics: string[]; // what user recently asked for
}

const MEMORY_FILE = path.join(process.cwd(), 'server', 'data', 'short_term_memory.json');

class MemoryStore {
  private memory: ShortTermMemory = {
    recentSkipped: [],
    recentLoved: [],
    recentTopics: []
  };

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(MEMORY_FILE)) {
      try {
        const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
        this.memory = JSON.parse(data);
      } catch (e) {
        console.error("Failed to load memory DB");
      }
    }
  }

  private save() {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.memory, null, 2), 'utf-8');
  }

  recordSkip(trackInfo: string) {
    this.memory.recentSkipped.push(trackInfo);
    if (this.memory.recentSkipped.length > 50) this.memory.recentSkipped.shift();
    this.save();
  }

  recordLove(trackInfo: string) {
    this.memory.recentLoved.push(trackInfo);
    if (this.memory.recentLoved.length > 50) this.memory.recentLoved.shift();
    this.save();
  }

  recordTopic(topic: string) {
    this.memory.recentTopics.push(topic);
    if (this.memory.recentTopics.length > 10) this.memory.recentTopics.shift();
    this.save();
  }

  getMemoryContext(): string {
    const skippedStr = this.memory.recentSkipped.length > 0 ? this.memory.recentSkipped.slice(-5).join(', ') : '无';
    const lovedStr = this.memory.recentLoved.length > 0 ? this.memory.recentLoved.slice(-5).join(', ') : '无';
    
    return `
[近期互动记忆]
- 最近跳过的歌曲: ${skippedStr}
- 最近喜欢的歌曲: ${lovedStr}
- 最近聊到的主题: ${this.memory.recentTopics.join(', ') || '无'}
`.trim();
  }
}

export const memoryStore = new MemoryStore();
