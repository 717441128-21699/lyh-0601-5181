import { WeeklyAnalysis, CounselingAgency, Badge } from '@/types';
import { getWeekDates } from '@/utils/date';

const { dates, start, end } = getWeekDates();

export const mockWeeklyAnalysis: WeeklyAnalysis = {
  weekStart: start,
  weekEnd: end,
  emotionDistribution: {
    happy: 2,
    calm: 2,
    tired: 1,
    anxious: 2,
    sad: 1,
    angry: 0
  },
  dailyEmotions: [
    { date: dates[0], emotion: 'happy', score: 5 },
    { date: dates[1], emotion: 'calm', score: 4 },
    { date: dates[2], emotion: 'anxious', score: 1 },
    { date: dates[3], emotion: 'sad', score: 1 },
    { date: dates[4], emotion: 'tired', score: 2 },
    { date: dates[5], emotion: 'anxious', score: 1 },
    { date: dates[6], emotion: 'calm', score: 4 }
  ],
  keywords: [
    { word: '工作', count: 8 },
    { word: '朋友', count: 5 },
    { word: '压力', count: 4 },
    { word: '开心', count: 3 },
    { word: '疲惫', count: 3 },
    { word: '生活', count: 3 },
    { word: '焦虑', count: 2 },
    { word: '美食', count: 2 },
    { word: '阅读', count: 2 },
    { word: '独处', count: 2 }
  ],
  negativeRatio: 0.625,
  warningTriggered: true
};

export const mockAgencies: CounselingAgency[] = [
  {
    id: '1',
    name: '心灵驿站心理咨询中心',
    address: '幸福路128号',
    phone: '400-123-4567',
    distance: '1.2km'
  },
  {
    id: '2',
    name: '阳光心理诊所',
    address: '和平大街56号',
    phone: '400-765-4321',
    distance: '2.8km'
  },
  {
    id: '3',
    name: '心语心理咨询工作室',
    address: '文化路201号',
    phone: '400-987-6543',
    distance: '3.5km'
  }
];

export const mockBadges: Badge[] = [
  {
    id: '1',
    name: '初心者',
    description: '完成首次情绪记录',
    unlocked: true,
    icon: '🌱',
    unlockedAt: Date.now() - 7 * 86400000
  },
  {
    id: '2',
    name: '坚持之星',
    description: '连续打卡7天',
    unlocked: true,
    icon: '⭐',
    unlockedAt: Date.now() - 86400000
  },
  {
    id: '3',
    name: '表达达人',
    description: '累计记录30篇日记',
    unlocked: false,
    icon: '✍️'
  },
  {
    id: '4',
    name: '社区之星',
    description: '发布10篇社区帖子',
    unlocked: false,
    icon: '🌟'
  },
  {
    id: '5',
    name: '自我探索',
    description: '查看首次月度报告',
    unlocked: false,
    icon: '🔮'
  },
  {
    id: '6',
    name: '月度达人',
    description: '连续打卡30天',
    unlocked: false,
    icon: '🏆'
  }
];
