export const STATUS_POOL: Record<string, string[]> = {
  search_track: [
    "正在翻找唱片柜...",
    "回忆小航的偏好中...",
    "让我想想有什么合适的...",
    "在一堆音符里寻宝...",
    "雷达探测中..."
  ],
  add_to_queue: [
    "轻轻放进播放队列...",
    "安排上了...",
    "加入排队..."
  ],
  play_tracks: [
    "扬声器预热中...",
    "马上为你呈现..."
  ],
  update_user_memory: [
    "拿小本本记好了...",
    "这个偏好我记住了...",
    "大脑自动存档中..."
  ],
  chat_reply: [
    "组织语言中...",
    "整理思绪中..."
  ],
  pause_playback: [
    "按下暂停键..."
  ],
  resume_playback: [
    "继续播放..."
  ],
  skip_current: [
    "切到下一首..."
  ]
};

export const DEFAULT_POOL = [
  "思考中...",
  "处理中...",
  "稍等片刻...",
  "反应中...",
  "让我琢磨琢磨...",
  "运算回路打通中...",
  "喝口水冷静分析下...",
  "数据流转中..."
];

let lastMessage = '';

export function getRandomStatus(tool: string): string {
  const pool = STATUS_POOL[tool] || DEFAULT_POOL;
  let candidates = pool.filter(m => m !== lastMessage);
  
  if (candidates.length === 0) {
    candidates = pool;
  }
  
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  lastMessage = picked;
  return picked;
}
