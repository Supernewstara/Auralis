export const parseLyrics = (lrc: string) => {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result = [];
  const timeExp = /\[(\d{2,3}):(\d{2})(?:\.(\d{1,3}))?\]/;
  for (const line of lines) {
    const match = timeExp.exec(line);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const msStr = match[3] || '0';
      const ms = parseInt(msStr);
      let msRatio = 1;
      if (msStr.length === 1) msRatio = 10;
      else if (msStr.length === 2) msRatio = 100;
      else if (msStr.length === 3) msRatio = 1000;
      
      const time = min * 60 + sec + ms / msRatio;
      const text = line.replace(timeExp, '').trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
};
