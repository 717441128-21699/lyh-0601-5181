import Taro from '@tarojs/taro';
import { create } from 'zustand';
import { DiaryEntry, CommunityPost, Badge, ReminderSettings, ReminderItem, EmotionType, AppState, ReportStatus, CopingTask } from '@/types';
import { mockDiaries } from '@/data/mockDiaries';
import { mockPosts } from '@/data/mockPosts';
import { mockBadges } from '@/data/mockAnalysis';
import { getStorage, setStorage } from '@/utils/storage';
import { getToday, formatDate } from '@/utils/date';
import { detectStressType, generateCopingPlan } from '@/utils/emotion';

const transformedMockPosts = mockPosts.map(p => ({
  ...p,
  reportStatus: 'none' as ReportStatus
}));

const defaultReminders: ReminderSettings = {
  items: [
    { id: '1', enabled: true, time: '20:00', label: '晚间复盘' }
  ]
};

const migrateCopingTasks = (tasks: any[]): CopingTask[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  const today = getToday();
  if (tasks.length > 0 && tasks[0].forStressTypes && tasks[0].priority !== undefined) {
    return tasks;
  }
  return tasks.map((t, i) => ({
    id: t.id || `migrated-${i}`,
    title: t.title || '',
    desc: t.desc || '',
    icon: t.icon || '✅',
    completed: !!t.completed,
    completedAt: t.completedAt,
    category: t.category || 'activity',
    priority: t.priority ?? 3,
    forStressTypes: t.forStressTypes || ['mixed']
  }));
};

const migrateReminders = (old: any): ReminderSettings => {
  if (old && old.items && Array.isArray(old.items)) return old;
  if (old && typeof old.enabled === 'boolean' && typeof old.time === 'string') {
    return { items: [{ id: '1', enabled: old.enabled, time: old.time, label: '每日提醒', nextTriggerAt: old.nextTriggerAt }] };
  }
  return defaultReminders;
};

const migrateDiaries = (diaries: any[]): DiaryEntry[] => {
  return diaries.map(d => ({
    ...d,
    intensity: d.intensity ?? 5
  }));
};

const migrateAppState = (state: any): AppState => {
  return {
    likedPostIds: state?.likedPostIds || [],
    isAdmin: state?.isAdmin || false,
    copingTasks: migrateCopingTasks(state?.copingTasks),
    planGeneratedDate: state?.planGeneratedDate
  };
};

interface DiaryState {
  diaries: DiaryEntry[];
  posts: CommunityPost[];
  badges: Badge[];
  reminder: ReminderSettings;
  appState: AppState;
  notificationTimers: number[];
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  getDiaryById: (id: string) => DiaryEntry | undefined;
  addPost: (post: Omit<CommunityPost, 'id' | 'createdAt' | 'likes' | 'comments' | 'reportStatus'>) => void;
  likePost: (id: string) => boolean;
  hasLikedPost: (id: string) => boolean;
  reportPost: (id: string, reason?: string) => void;
  reviewPost: (id: string, approved: boolean) => void;
  getPendingReports: () => CommunityPost[];
  getStreakDays: () => number;
  hasCheckedInToday: () => boolean;
  setReminders: (settings: ReminderSettings) => void;
  addReminder: (item: ReminderItem) => void;
  updateReminder: (id: string, updates: Partial<ReminderItem>) => void;
  removeReminder: (id: string) => void;
  scheduleAllReminders: () => void;
  cancelAllReminders: () => void;
  checkAndTriggerReminder: (itemId: string) => void;
  unlockBadge: (id: string) => void;
  toggleAdminMode: () => void;
  toggleCopingTask: (taskId: string) => void;
  regenerateCopingPlan: () => void;
  ensurePlanUpToDate: () => void;
}

const getNextReminderTime = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
};

export const useDiaryStore = create<DiaryState>((set, get) => ({
  diaries: migrateDiaries(getStorage('diaries', mockDiaries)),
  posts: getStorage('posts', transformedMockPosts),
  badges: getStorage('badges', mockBadges),
  reminder: migrateReminders(getStorage('reminder', defaultReminders)),
  appState: migrateAppState(getStorage('appState', { likedPostIds: [], isAdmin: false })),
  notificationTimers: [],

  addDiary: (entry) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    const diaries = [newEntry, ...get().diaries];
    set({ diaries });
    setStorage('diaries', diaries);
    console.log('[Diary] 新增日记:', { date: entry.date, emotion: entry.emotion, intensity: entry.intensity });
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
      reportStatus: 'none'
    };
    const posts = [newPost, ...get().posts];
    set({ posts });
    setStorage('posts', posts);
    console.log('[Community] 新增帖子:', { id: newPost.id });
  },

  hasLikedPost: (id) => {
    return get().appState.likedPostIds.includes(id);
  },

  likePost: (id) => {
    const { appState, posts } = get();
    if (appState.likedPostIds.includes(id)) {
      return false;
    }
    const newLikedIds = [...appState.likedPostIds, id];
    const newPosts = posts.map(p =>
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    const newAppState = { ...appState, likedPostIds: newLikedIds };
    set({ posts: newPosts, appState: newAppState });
    setStorage('posts', newPosts);
    setStorage('appState', newAppState);
    return true;
  },

  reportPost: (id, reason) => {
    const posts = get().posts.map(p =>
      p.id === id
        ? { ...p, reportStatus: 'pending' as ReportStatus, reportedAt: Date.now(), reportReason: reason }
        : p
    );
    set({ posts });
    setStorage('posts', posts);
  },

  reviewPost: (id, approved) => {
    const posts = get().posts.map(p =>
      p.id === id
        ? { ...p, reportStatus: (approved ? 'approved' : 'rejected') as ReportStatus }
        : p
    );
    set({ posts });
    setStorage('posts', posts);
  },

  getPendingReports: () => {
    return get().posts.filter(p => p.reportStatus === 'pending');
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

  setReminders: (settings) => {
    set({ reminder: settings });
    setStorage('reminder', settings);
    get().cancelAllReminders();
    get().scheduleAllReminders();
    console.log('[Reminder] 保存提醒设置:', settings.items.map(i => `${i.label}@${i.time}(${i.enabled ? '开' : '关'})`));
  },

  addReminder: (item) => {
    const reminder = get().reminder;
    const newItems = [...reminder.items, { ...item, nextTriggerAt: getNextReminderTime(item.time) }];
    get().setReminders({ items: newItems });
  },

  updateReminder: (id, updates) => {
    const reminder = get().reminder;
    const newItems = reminder.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.time && updates.time !== item.time) {
          updated.nextTriggerAt = getNextReminderTime(updates.time);
        }
        if (updates.enabled === true && !item.enabled) {
          updated.nextTriggerAt = getNextReminderTime(updated.time);
        }
        if (updates.enabled === false) {
          delete updated.nextTriggerAt;
        }
        return updated;
      }
      return item;
    });
    get().setReminders({ items: newItems });
  },

  removeReminder: (id) => {
    const reminder = get().reminder;
    const newItems = reminder.items.filter(item => item.id !== id);
    get().setReminders({ items: newItems });
  },

  scheduleAllReminders: () => {
    const { reminder, cancelAllReminders } = get();
    cancelAllReminders();

    const timers: number[] = [];
    const now = Date.now();

    reminder.items.forEach(item => {
      if (!item.enabled) return;
      const triggerAt = item.nextTriggerAt || getNextReminderTime(item.time);
      const delay = Math.max(0, triggerAt - now);
      console.log('[Reminder] 调度:', item.label, item.time, '延迟:', Math.round(delay / 1000), '秒');

      const timer = setTimeout(() => {
        get().checkAndTriggerReminder(item.id);
      }, delay) as unknown as number;
      timers.push(timer);
    });

    set({ notificationTimers: timers });
  },

  cancelAllReminders: () => {
    const { notificationTimers } = get();
    notificationTimers.forEach(t => clearTimeout(t as unknown as ReturnType<typeof setTimeout>));
    set({ notificationTimers: [] });
  },

  checkAndTriggerReminder: (itemId) => {
    const { reminder, hasCheckedInToday } = get();
    const item = reminder.items.find(i => i.id === itemId);
    if (!item || !item.enabled) return;

    console.log('[Reminder] ✅ 触发提醒:', item.label, item.time);

    Taro.showModal({
      title: `📝 ${item.label}`,
      content: '今天还没记录心情哦，来记录一下吧~',
      confirmText: '去记录',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: '/pages/record/index' });
        }
      }
    });
    Taro.vibrateShort({ type: 'medium' }).catch(() => {});

    const newItems = reminder.items.map(i =>
      i.id === itemId
        ? { ...i, nextTriggerAt: getNextReminderTime(i.time) }
        : i
    );
    const newReminder = { items: newItems };
    set({ reminder: newReminder });
    setStorage('reminder', newReminder);
    get().cancelAllReminders();
    get().scheduleAllReminders();
  },

  unlockBadge: (id) => {
    const badges = get().badges.map(b =>
      b.id === id && !b.unlocked
        ? { ...b, unlocked: true, unlockedAt: Date.now() }
        : b
    );
    set({ badges });
    setStorage('badges', badges);
  },

  toggleAdminMode: () => {
    const { appState } = get();
    const newAppState = { ...appState, isAdmin: !appState.isAdmin };
    set({ appState: newAppState });
    setStorage('appState', newAppState);
  },

  toggleCopingTask: (taskId) => {
    const { appState } = get();
    const newTasks = appState.copingTasks.map(t => {
      if (t.id === taskId) {
        const willComplete = !t.completed;
        return {
          ...t,
          completed: willComplete,
          completedAt: willComplete ? Date.now() : undefined
        };
      }
      return t;
    });
    const newAppState = { ...appState, copingTasks: newTasks };
    set({ appState: newAppState });
    setStorage('appState', newAppState);
  },

  regenerateCopingPlan: () => {
    const { diaries, appState } = get();
    const today = getToday();
    const todayDate = new Date(today);
    const sevenDaysAgo = new Date(todayDate);
    sevenDaysAgo.setDate(todayDate.getDate() - 6);
    const sevenDaysAgoStr = formatDate(sevenDaysAgo, 'YYYY-MM-DD');

    const recentDiaries = diaries.filter(d => d.date >= sevenDaysAgoStr && d.date <= today);
    const { type: stressType } = detectStressType(recentDiaries);
    const newTasks = generateCopingPlan(stressType);
    const newAppState = { ...appState, copingTasks: newTasks, planGeneratedDate: today };
    set({ appState: newAppState });
    setStorage('appState', newAppState);
    console.log('[Coping] 重新生成调适计划:', { stressType, taskCount: newTasks.length });
  },

  ensurePlanUpToDate: () => {
    const { appState, regenerateCopingPlan } = get();
    const today = getToday();
    if (!appState.planGeneratedDate || appState.planGeneratedDate !== today || appState.copingTasks.length === 0) {
      console.log('[Coping] 计划已过期或不存在，重新生成');
      regenerateCopingPlan();
    }
  }
}));
