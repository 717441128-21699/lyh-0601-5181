import { create } from 'zustand';
import { DiaryEntry, CommunityPost, Badge, ReminderSettings, EmotionType } from '@/types';
import { mockDiaries } from '@/data/mockDiaries';
import { mockPosts } from '@/data/mockPosts';
import { mockBadges } from '@/data/mockAnalysis';
import { getStorage, setStorage } from '@/utils/storage';
import { getToday } from '@/utils/date';

interface DiaryState {
  diaries: DiaryEntry[];
  posts: CommunityPost[];
  badges: Badge[];
  reminder: ReminderSettings;
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  getDiaryById: (id: string) => DiaryEntry | undefined;
  addPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'isReported'>) => void;
  likePost: (id: string) => void;
  reportPost: (id: string) => void;
  getStreakDays: () => number;
  hasCheckedInToday: () => boolean;
  setReminder: (settings: ReminderSettings) => void;
  unlockBadge: (id: string) => void;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  diaries: getStorage('diaries', mockDiaries),
  posts: getStorage('posts', mockPosts),
  badges: getStorage('badges', mockBadges),
  reminder: getStorage('reminder', { enabled: true, time: '20:00' }),

  addDiary: (entry) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    const diaries = [newEntry, ...get().diaries];
    set({ diaries });
    setStorage('diaries', diaries);

    const streak = get().getStreakDays();
    if (streak >= 7) {
      get().unlockBadge('2');
    }
  },

  getDiaryById: (id) => {
    return get().diaries.find(d => d.id === id);
  },

  addPost: (post) => {
    const newPost: CommunityPost = {
      ...post,
      id: Date.now().toString(),
      createdAt: Date.now(),
      likes: 0,
      comments: 0,
      isReported: false
    };
    const posts = [newPost, ...get().posts];
    set({ posts });
    setStorage('posts', posts);
  },

  likePost: (id) => {
    const posts = get().posts.map(p =>
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    set({ posts });
    setStorage('posts', posts);
  },

  reportPost: (id) => {
    const posts = get().posts.map(p =>
      p.id === id ? { ...p, isReported: true } : p
    );
    set({ posts });
    setStorage('posts', posts);
  },

  getStreakDays: () => {
    const diaries = get().diaries;
    const dates = diaries.map(d => d.date).sort().reverse();
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (dates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  },

  hasCheckedInToday: () => {
    return get().diaries.some(d => d.date === getToday());
  },

  setReminder: (settings) => {
    set({ reminder: settings });
    setStorage('reminder', settings);
  },

  unlockBadge: (id) => {
    const badges = get().badges.map(b =>
      b.id === id && !b.unlocked
        ? { ...b, unlocked: true, unlockedAt: Date.now() }
        : b
    );
    set({ badges });
    setStorage('badges', badges);
  }
}));
