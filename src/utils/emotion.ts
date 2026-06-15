import { EmotionType, EmotionOption, StressType, CopingTask, DiaryEntry } from '@/types';

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

export const detectStressType = (recentDiaries: DiaryEntry[]): { type: StressType; label: string; description: string } => {
  if (recentDiaries.length === 0) {
    return { type: 'mixed', label: '混合压力', description: '多维度调适计划' };
  }

  const negativeDiaries = recentDiaries.filter(d => getEmotionByType(d.emotion).isNegative);
  if (negativeDiaries.length === 0) {
    return { type: 'mixed', label: '日常保健', description: '为你推荐基础情绪养护计划' };
  }

  const count: Record<EmotionType, number> = {
    happy: 0, calm: 0, sad: 0, anxious: 0, angry: 0, tired: 0
  };
  let highIntensityAtNight = 0;

  negativeDiaries.forEach(d => {
    count[d.emotion]++;
    const hour = new Date(d.createdAt).getHours();
    if ((hour >= 22 || hour <= 5) && d.intensity >= 7) {
      highIntensityAtNight++;
    }
  });

  const total = negativeDiaries.length;
  const anxiousRatio = count.anxious / total;
  const tiredRatio = count.tired / total;
  const sadRatio = count.sad / total;
  const angryRatio = count.angry / total;

  if (highIntensityAtNight >= 1 && sadRatio + anxiousRatio >= 0.5) {
    return {
      type: 'low_mood',
      label: '夜间高强度低落',
      description: '检测到夜间（22:00-05:00）出现高强度负面情绪，需特别关注睡眠和情绪节律'
    };
  }

  if (anxiousRatio >= 0.6) {
    return {
      type: 'anxiety',
      label: '连续焦虑',
      description: '近期以焦虑情绪为主，推荐侧重呼吸放松与正念的调适方案'
    };
  }

  if (tiredRatio >= 0.6) {
    return {
      type: 'fatigue',
      label: '连续疲惫',
      description: '近期以疲惫感为主，推荐侧重休息恢复与轻度活动的调适方案'
    };
  }

  if (angryRatio >= 0.5) {
    return {
      type: 'anger',
      label: '愤怒频发',
      description: '近期愤怒情绪较多，推荐侧重情绪释放与冷静训练的调适方案'
    };
  }

  if (sadRatio >= 0.5) {
    return {
      type: 'low_mood',
      label: '情绪低落',
      description: '近期情绪偏低落，推荐侧重社交支持与小确幸的调适方案'
    };
  }

  return {
    type: 'mixed',
    label: '混合压力',
    description: '近期负面情绪类型较多，为你组合多维度调适方案'
  };
};

export const generateCopingPlan = (stressType: StressType): CopingTask[] => {
  const allTasks: Record<StressType, Omit<CopingTask, 'completed'>[]> = {
    anxiety: [
      { id: 'a-b1', title: '4-7-8呼吸法', desc: '吸气4秒，屏住7秒，呼出8秒，重复5次', icon: '🌬️', category: 'breath', priority: 1, forStressTypes: ['anxiety', 'mixed'] },
      { id: 'a-b2', title: '腹式深呼吸', desc: '手放腹部慢吸5秒隆起，缓呼5秒，重复8次', icon: '💨', category: 'breath', priority: 2, forStressTypes: ['anxiety'] },
      { id: 'a-m1', title: '10分钟正念冥想', desc: '闭上眼睛专注呼吸，让念头自然来去不评判', icon: '🧘', category: 'mindfulness', priority: 1, forStressTypes: ['anxiety'] },
      { id: 'a-m2', title: '写下焦虑的事', desc: '把脑子里担心的事逐条写出来，分"可控/不可控"', icon: '✏️', category: 'activity', priority: 2, forStressTypes: ['anxiety'] },
      { id: 'a-a1', title: '散步20分钟', desc: '出门走一走，感受风、阳光和周围的声音', icon: '🚶', category: 'activity', priority: 3, forStressTypes: ['anxiety'] },
      { id: 'a-s1', title: '晚上11点前上床', desc: '焦虑时更需要规律睡眠，今天不超过11点躺下', icon: '🌙', category: 'sleep', priority: 1, forStressTypes: ['anxiety'] },
    ],
    fatigue: [
      { id: 'f-s1', title: '午间小睡20分钟', desc: '闭上眼休息20分钟，不一定要睡着', icon: '😴', category: 'sleep', priority: 1, forStressTypes: ['fatigue'] },
      { id: 'f-s2', title: '比平时早1小时睡', desc: '今晚提前熄灯，给身体多1小时恢复时间', icon: '🌙', category: 'sleep', priority: 1, forStressTypes: ['fatigue'] },
      { id: 'f-a1', title: '喝一杯温水+伸展', desc: '先喝水，然后做5分钟简单拉伸（肩颈、腰背）', icon: '💧', category: 'activity', priority: 2, forStressTypes: ['fatigue'] },
      { id: 'f-a2', title: '减少1项任务', desc: '今天的待办清单里划掉1件可做可不做的事', icon: '✅', category: 'activity', priority: 1, forStressTypes: ['fatigue'] },
      { id: 'f-b1', title: '深呼吸提神', desc: '缓慢深呼吸3次，每次呼尽再深吸', icon: '🌬️', category: 'breath', priority: 3, forStressTypes: ['fatigue'] },
      { id: 'f-m1', title: '身体扫描5分钟', desc: '从头到脚感受每个部位，允许它们放松', icon: '🔍', category: 'mindfulness', priority: 2, forStressTypes: ['fatigue', 'mixed'] },
    ],
    low_mood: [
      { id: 'l-a1', title: '记录3件小确幸', desc: '今天哪怕再小的好事也写下来，比如阳光、一口热茶', icon: '☀️', category: 'activity', priority: 1, forStressTypes: ['low_mood'] },
      { id: 'l-c1', title: '联系一位老朋友', desc: '给信任的人发一句"最近怎么样"或打个电话', icon: '💬', category: 'social', priority: 1, forStressTypes: ['low_mood'] },
      { id: 'l-a2', title: '出门晒太阳15分钟', desc: '阳光能帮助调节情绪，出门走走或在窗边晒晒', icon: '🌞', category: 'activity', priority: 2, forStressTypes: ['low_mood'] },
      { id: 'l-s1', title: '睡前不刷手机', desc: '睡前1小时不看负面信息，可以听轻柔音乐', icon: '📵', category: 'sleep', priority: 1, forStressTypes: ['low_mood'] },
      { id: 'l-m1', title: '善待自己的宣言', desc: '对着镜子说3遍："我值得被好好对待"', icon: '💗', category: 'mindfulness', priority: 2, forStressTypes: ['low_mood'] },
      { id: 'l-b1', title: '缓慢呼吸平静', desc: '吸气4秒-屏息2秒-呼气6秒，重复6次', icon: '🌬️', category: 'breath', priority: 3, forStressTypes: ['low_mood', 'mixed'] },
    ],
    anger: [
      { id: 'g-b1', title: '冷静呼吸法', desc: '想发火时数10个数+深呼吸5次，让生理先平静', icon: '🧊', category: 'breath', priority: 1, forStressTypes: ['anger'] },
      { id: 'g-a1', title: '写下愤怒再撕掉', desc: '把不满尽情写在纸上，然后撕掉或划掉', icon: '✂️', category: 'activity', priority: 1, forStressTypes: ['anger'] },
      { id: 'g-a2', title: '快走或运动释放', desc: '用出汗的方式发泄情绪，快走15分钟以上', icon: '🏃', category: 'activity', priority: 2, forStressTypes: ['anger'] },
      { id: 'g-m1', title: '暂停6秒', desc: '愤怒上头时暂停6秒再回应，避免冲动', icon: '⏸️', category: 'mindfulness', priority: 1, forStressTypes: ['anger'] },
      { id: 'g-c1', title: '和朋友吐槽', desc: '找个不评判的朋友把事情说出来', icon: '🗣️', category: 'social', priority: 3, forStressTypes: ['anger', 'mixed'] },
      { id: 'g-s1', title: '充足睡眠降火气', desc: '睡眠不足容易易怒，保证7小时以上睡眠', icon: '😴', category: 'sleep', priority: 2, forStressTypes: ['anger', 'fatigue'] },
    ],
    mixed: [
      { id: 'm-a1', title: '散步15分钟', desc: '出门走走，感受周围环境，不用有目的地', icon: '🚶', category: 'activity', priority: 1, forStressTypes: ['mixed'] },
      { id: 'm-b1', title: '4-7-8呼吸法', desc: '吸气4秒，屏住7秒，呼出8秒，重复3次', icon: '🌬️', category: 'breath', priority: 2, forStressTypes: ['mixed'] },
      { id: 'm-s1', title: '提前30分钟上床', desc: '今晚比平时早30分钟躺下，不带手机', icon: '🌙', category: 'sleep', priority: 1, forStressTypes: ['mixed'] },
      { id: 'm-c1', title: '联系一个朋友', desc: '给一位信任的朋友发条消息或打个电话', icon: '💬', category: 'social', priority: 3, forStressTypes: ['mixed'] },
      { id: 'm-m1', title: '5分钟正念冥想', desc: '闭上眼睛专注呼吸，觉察当下的感受，不评判', icon: '🧘', category: 'mindfulness', priority: 2, forStressTypes: ['mixed'] },
      { id: 'm-a2', title: '喝一杯温水', desc: '现在就去倒一杯温水，慢慢喝完', icon: '💧', category: 'activity', priority: 3, forStressTypes: ['mixed'] },
    ]
  };

  const tasks = allTasks[stressType] || allTasks.mixed;
  return tasks
    .sort((a, b) => a.priority - b.priority)
    .map(t => ({ ...t, completed: false }));
};
