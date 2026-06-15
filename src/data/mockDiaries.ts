import { DiaryEntry } from '@/types';
import { getWeekDates, getToday } from '@/utils/date';

const { dates } = getWeekDates();

export const mockDiaries: DiaryEntry[] = [
  {
    id: '1',
    date: dates[0],
    emotion: 'happy',
    content: '今天天气特别好，和朋友一起去了公园野餐。阳光洒在身上暖洋洋的，我们聊了很多开心的事情，感觉生活真美好！吃到了好吃的蛋糕，还拍了很多照片留念。',
    images: [],
    tags: ['朋友', '户外', '美食'],
    createdAt: Date.now() - 6 * 86400000
  },
  {
    id: '2',
    date: dates[1],
    emotion: 'calm',
    content: '一天的工作结束了，虽然有点累但感觉很充实。晚上在家看书喝茶，享受宁静的时光。读的书很有意思，让我对生活有了新的思考。',
    images: [],
    tags: ['工作', '阅读', '独处'],
    createdAt: Date.now() - 5 * 86400000
  },
  {
    id: '3',
    date: dates[2],
    emotion: 'anxious',
    content: '明天有一个重要的项目汇报，准备了很久还是有点担心。反复检查PPT，总觉得哪里不够好。希望一切顺利吧，深呼吸，相信自己。',
    images: [],
    tags: ['工作', '压力'],
    createdAt: Date.now() - 4 * 86400000
  },
  {
    id: '4',
    date: dates[3],
    emotion: 'sad',
    content: '今天和好朋友吵架了，心里很难受。明明是小事但就是控制不住情绪。现在冷静下来觉得自己太冲动了，明天找机会道歉吧。',
    images: [],
    tags: ['朋友', '矛盾'],
    createdAt: Date.now() - 3 * 86400000
  },
  {
    id: '5',
    date: dates[4],
    emotion: 'tired',
    content: '连续加班好几天了，身体感觉被掏空。回到家只想躺着什么都不想做。周末一定要好好休息，给自己充充电。',
    images: [],
    tags: ['工作', '疲惫'],
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: '6',
    date: dates[5],
    emotion: 'anxious',
    content: '最近状态一直不太好，压力很大却不知道怎么释放。感觉好多事情堆积在一起，有点喘不过气。需要调整一下心态了。',
    images: [],
    tags: ['压力', '情绪'],
    createdAt: Date.now() - 86400000
  }
];

export const getTodayEntry = (): DiaryEntry | undefined => {
  return mockDiaries.find(d => d.date === getToday());
};
