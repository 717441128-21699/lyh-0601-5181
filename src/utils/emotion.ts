import { EmotionType, EmotionOption } from '@/types';

export const EMOTIONS: EmotionOption[] = [
  { type: 'happy', label: '开心', emoji: '😊', color: '#FFD93D', isNegative: false },
  { type: 'calm', label: '平静', emoji: '😌', color: '#87C8FF', isNegative: false },
  { type: 'sad', label: '难过', emoji: '😢', color: '#9B8AB8', isNegative: true },
  { type: 'anxious', label: '焦虑', emoji: '😰', color: '#FF9B7B', isNegative: true },
  { type: 'angry', label: '愤怒', emoji: '😠', color: '#FF6B6B', isNegative: true },
  { type: 'tired', label: '疲惫', emoji: '😴', color: '#A5A5A5', isNegative: true }
];

export const getEmotionByType = (type: EmotionType): EmotionOption => {
  return EMOTIONS.find(e => e.type === type) || EMOTIONS[1];
};

export const getEmotionScore = (type: EmotionType): number => {
  const scores: Record<EmotionType, number> = {
    happy: 5,
    calm: 4,
    tired: 2,
    anxious: 1,
    sad: 1,
    angry: 0
  };
  return scores[type];
};

export const analyzeNegativeEmotions = (
  emotions: { date: string; emotion: EmotionType }[],
  threshold: number = 0.6
): { triggered: boolean; days: number; ratio: number; consecutiveDays: { date: string; emotion: EmotionType }[] } => {
  if (emotions.length < 3) return { triggered: false, days: emotions.length, ratio: 0, consecutiveDays: [] };

  const sortedByDate = [...emotions].sort((a, b) => a.date.localeCompare(b.date));

  console.log('[Analysis] 检查连续3天预警，已排序记录:', sortedByDate.map(e => ({ date: e.date, emotion: e.emotion })));

  for (let i = 0; i <= sortedByDate.length - 3; i++) {
    const day1 = sortedByDate[i];
    const day2 = sortedByDate[i + 1];
    const day3 = sortedByDate[i + 2];

    const date1 = new Date(day1.date);
    const date2 = new Date(day2.date);
    const date3 = new Date(day3.date);

    const diff1 = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
    const diff2 = (date3.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

    console.log('[Analysis] 检查连续3天:', {
      days: [day1.date, day2.date, day3.date],
      diff1,
      diff2,
      isConsecutive: diff1 === 1 && diff2 === 1
    });

    if (diff1 === 1 && diff2 === 1) {
      const negativeCount = [day1, day2, day3].filter(e => getEmotionByType(e.emotion).isNegative).length;
      const ratio = negativeCount / 3;

      console.log('[Analysis] 找到连续3天记录:', {
        dates: [day1.date, day2.date, day3.date],
        emotions: [day1.emotion, day2.emotion, day3.emotion],
        negativeCount,
        ratio: (ratio * 100).toFixed(1) + '%',
        threshold: (threshold * 100) + '%',
        triggered: ratio >= threshold
      });

      if (ratio >= threshold) {
        return {
          triggered: true,
          days: 3,
          ratio,
          consecutiveDays: [day1, day2, day3]
        };
      }
    }
  }

  console.log('[Analysis] 未找到符合条件的连续3天记录');
  return { triggered: false, days: 3, ratio: 0, consecutiveDays: [] };
};

export const extractKeywords = (texts: string[]): { word: string; count: number }[] => {
  const stopWords = ['的', '了', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
  const wordCount: Record<string, number> = {};

  texts.forEach(text => {
    const chars = text.split('');
    for (let i = 0; i < chars.length - 1; i++) {
      const word = chars[i] + chars[i + 1];
      if (!stopWords.includes(word) && /^[\u4e00-\u9fa5]{2}$/.test(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
  });

  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};
