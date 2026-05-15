export function getTimeContext(): { type: string, description: string } {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  let timeType = 'night';
  let desc = '深夜';
  
  if (hour >= 5 && hour < 9) {
    timeType = 'early_morning';
    desc = '清晨';
  } else if (hour >= 9 && hour < 12) {
    timeType = 'morning';
    desc = '上午';
  } else if (hour >= 12 && hour < 14) {
    timeType = 'noon';
    desc = '午休';
  } else if (hour >= 14 && hour < 18) {
    timeType = 'afternoon';
    desc = '下午';
  } else if (hour >= 18 && hour < 22) {
    timeType = 'evening';
    desc = '晚上';
  }

  const isWeekend = day === 0 || day === 6;

  return {
    type: timeType,
    description: `当前是${isWeekend ? '周末' : '工作日'}${desc}`
  };
}
