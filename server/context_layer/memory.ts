import fs from 'fs';
import path from 'path';

export interface ShortTermMemory {
  recentSkipped: number[]; // track IDs
  recentLoved: number[];
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

  recordSkip(trackId: number) {
    this.memory.recentSkipped.push(trackId);
    if (this.memory.recentSkipped.length > 50) this.memory.recentSkipped.shift();
    this.save();
  }

  recordLove(trackId: number) {
    this.memory.recentLoved.push(trackId);
    if (this.memory.recentLoved.length > 50) this.memory.recentLoved.shift();
    this.save();
  }

  recordTopic(topic: string) {
    this.memory.recentTopics.push(topic);
    if (this.memory.recentTopics.length > 10) this.memory.recentTopics.shift();
    this.save();
  }

  getMemoryContext(): string {
    return `
[近期互动记忆]
- 最近跳过的歌曲数量: ${this.memory.recentSkipped.length}
- 最近喜欢的歌曲数量: ${this.memory.recentLoved.length}
- 最近聊到的主题: ${this.memory.recentTopics.join(', ')}
`.trim();
  }
}

export const memoryStore = new MemoryStore();
