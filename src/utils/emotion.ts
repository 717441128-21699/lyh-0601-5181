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
): { triggered: boolean; days: number; ratio: number } => {
  if (emotions.length < 3) return { triggered: false, days: emotions.length, ratio: 0 };

  const last3 = emotions.slice(-3);
  const negativeCount = last3.filter(e => getEmotionByType(e.emotion).isNegative).length;
  const ratio = negativeCount / 3;

  return {
    triggered: ratio >= threshold,
    days: 3,
    ratio
  };
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
