import { getTimeContext } from './time_context.js';
import { memoryStore } from './memory.js';

export interface ContextPayload {
  mood?: string;
  userMessage?: string;
}

export function assembleContext(payload: ContextPayload) {
  const timeInfo = getTimeContext();
  const memoryInfo = memoryStore.getMemoryContext();

  let contextString = `
=== 第二层：当前上下文感知 (Context Layer) ===

[时空上下文]
环境时间: ${timeInfo.description}

[状态与诉求]
用户最新输入: "${payload.userMessage || '无特定内容'}"
用户当前情绪标签: ${payload.mood || '未指明'}

${memoryInfo}
`.trim();

  return contextString;
}
