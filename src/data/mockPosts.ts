import { CommunityPost } from '@/types';

export const mockPosts: CommunityPost[] = [
  {
    id: '1',
    content: '今天在街角遇到一只流浪猫，它居然主动蹭我的腿。瞬间治愈了我一整天的疲惫。生活中的小温暖，总是来得那么不经意。',
    emotion: 'happy',
    likes: 128,
    comments: 23,
    isAnonymous: true,
    createdAt: Date.now() - 3600000,
    isReported: false
  },
  {
    id: '2',
    content: '有时候觉得很累，不是身体的累，是心里的。不知道自己在坚持什么，也不知道方向对不对。希望明天会好一点吧。',
    emotion: 'tired',
    likes: 256,
    comments: 67,
    isAnonymous: true,
    createdAt: Date.now() - 7200000,
    isReported: false
  },
  {
    id: '3',
    content: '终于完成了拖延很久的事情！虽然过程很煎熬，但完成的那一刻真的很有成就感。分享给大家，希望你们也能勇敢迈出那一步。',
    emotion: 'happy',
    likes: 89,
    comments: 15,
    isAnonymous: true,
    createdAt: Date.now() - 10800000,
    isReported: false
  },
  {
    id: '4',
    content: '学会了一件事：不要在深夜做决定。情绪上头的时候说的话，第二天醒来总会后悔。给自己24小时冷静期，真的很重要。',
    emotion: 'calm',
    likes: 312,
    comments: 45,
    isAnonymous: true,
    createdAt: Date.now() - 86400000,
    isReported: false
  },
  {
    id: '5',
    content: '最近总是莫名焦虑，明明没有什么特别的事情发生，但就是心里慌慌的。深呼吸也没用，有和我一样的朋友吗？',
    emotion: 'anxious',
    likes: 178,
    comments: 92,
    isAnonymous: true,
    createdAt: Date.now() - 172800000,
    isReported: false
  },
  {
    id: '6',
    content: '和家人大吵了一架，明明是最亲近的人却说出了最伤人的话。现在坐在房间里，眼泪止不住。爱真的很矛盾。',
    emotion: 'sad',
    likes: 203,
    comments: 78,
    isAnonymous: true,
    createdAt: Date.now() - 259200000,
    isReported: false
  },
  {
    id: '7',
    content: '周末一个人去看了场电影，发现独处其实也很惬意。不用迁就任何人的时间和喜好，完全属于自己的时光真好。',
    emotion: 'calm',
    likes: 145,
    comments: 32,
    isAnonymous: true,
    createdAt: Date.now() - 345600000,
    isReported: false
  },
  {
    id: '8',
    content: '被领导当众批评了，虽然知道自己确实有做得不好的地方，但还是觉得特别丢脸。下班后在车里坐了很久才敢回家。',
    emotion: 'sad',
    likes: 267,
    comments: 103,
    isAnonymous: true,
    createdAt: Date.now() - 432000000,
    isReported: false
  }
];
