import { create } from 'zustand';
import { DiaryEntry, CommunityPost, Badge, ReminderSettings, EmotionType, AppState, ReportStatus } from '@/types';
import { mockDiaries } from '@/data/mockDiaries';
import { mockPosts } from '@/data/mockPosts';
import { mockBadges } from '@/data/mockAnalysis';
import { getStorage, setStorage } from '@/utils/storage';
import { getToday, formatDate } from '@/utils/date';

const transformedMockPosts = mockPosts.map(p => ({
  ...p,
  reportStatus: 'none' as ReportStatus
}));

interface DiaryState {
  diaries: DiaryEntry[];
  posts: CommunityPost[];
  badges: Badge[];
  reminder: ReminderSettings;
  appState: AppState;
  notificationTimer: number | null;
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
  setReminder: (settings: ReminderSettings) => void;
  scheduleNextReminder: () => void;
  cancelReminder: () => void;
  checkAndTriggerReminder: () => void;
  unlockBadge: (id: string) => void;
  toggleAdminMode: () => void;
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
  diaries: getStorage('diaries', mockDiaries),
  posts: getStorage('posts', transformedMockPosts),
  badges: getStorage('badges', mockBadges),
  reminder: getStorage('reminder', { enabled: true, time: '20:00' }),
  appState: getStorage('appState', { likedPostIds: [], isAdmin: false }),
  notificationTimer: null,

  addDiary: (entry) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: Date.now()
    };
    const diaries = [newEntry, ...get().diaries];
    set({ diaries });
    setStorage('diaries', diaries);
    console.log('[Diary] 新增日记:', { date: entry.date, emotion: entry.emotion });

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
    console.log('[Community] 新增帖子:', { id: newPost.id, emotion: post.emotion });
  },

  hasLikedPost: (id) => {
    return get().appState.likedPostIds.includes(id);
  },

  likePost: (id) => {
    const { appState, posts } = get();
    if (appState.likedPostIds.includes(id)) {
      console.log('[Community] 已点赞，跳过:', id);
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
    console.log('[Community] 点赞成功:', { id, totalLikes: newPosts.find(p => p.id === id)?.likes });
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
    console.log('[Community] 提交举报，待审核:', { id, reason });
  },

  reviewPost: (id, approved) => {
    const posts = get().posts.map(p =>
      p.id === id
        ? { ...p, reportStatus: (approved ? 'approved' : 'rejected') as ReportStatus }
        : p
    );
    set({ posts });
    setStorage('posts', posts);
    console.log('[Admin] 审核完成:', { id, approved });
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

  setReminder: (settings) => {
    const current = get().reminder;
    const newSettings = { ...settings };

    if (settings.enabled && (current.time !== settings.time || !current.enabled)) {
      newSettings.nextTriggerAt = getNextReminderTime(settings.time);
      console.log('[Reminder] 设置提醒，下次触发:', formatDate(newSettings.nextTriggerAt, 'YYYY-MM-DD HH:mm'));
    } else if (!settings.enabled) {
      delete newSettings.nextTriggerAt;
      get().cancelReminder();
      console.log('[Reminder] 关闭提醒');
    }

    set({ reminder: newSettings });
    setStorage('reminder', newSettings);

    if (settings.enabled) {
      get().scheduleNextReminder();
    }
  },

  scheduleNextReminder: () => {
    const { reminder, cancelReminder } = get();
    if (!reminder.enabled) return;

    cancelReminder();

    const now = Date.now();
    const triggerAt = reminder.nextTriggerAt || getNextReminderTime(reminder.time);
    const delay = Math.max(0, triggerAt - now);

    console.log('[Reminder] 调度下一次提醒，延迟:', Math.round(delay / 1000), '秒');

    const timer = setTimeout(() => {
      get().checkAndTriggerReminder();
    }, delay) as unknown as number;

    set({ notificationTimer: timer });
  },

  cancelReminder: () => {
    const { notificationTimer } = get();
    if (notificationTimer) {
      clearTimeout(notificationTimer as unknown as ReturnType<typeof setTimeout>);
      console.log('[Reminder] 取消当前定时器');
      set({ notificationTimer: null });
    }
  },

  checkAndTriggerReminder: () => {
    const { reminder, hasCheckedInToday, scheduleNextReminder } = get();
    if (!reminder.enabled) {
      console.log('[Reminder] 提醒已关闭，跳过触发');
      return;
    }

    const now = Date.now();
    console.log('[Reminder] 检查触发条件:', {
      now: formatDate(now, 'YYYY-MM-DD HH:mm:ss'),
      scheduled: reminder.nextTriggerAt ? formatDate(reminder.nextTriggerAt, 'YYYY-MM-DD HH:mm:ss') : 'none',
      enabled: reminder.enabled,
      hasCheckedInToday: hasCheckedInToday()
    });

    if (!hasCheckedInToday()) {
      console.log('[Reminder] ✅ 触发打卡提醒弹窗!');
      Taro.showModal({
        title: '📝 今日心情记录',
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
    } else {
      console.log('[Reminder] 今日已打卡，跳过提醒');
    }

    const newSettings = {
      ...reminder,
      nextTriggerAt: getNextReminderTime(reminder.time)
    };
    set({ reminder: newSettings });
    setStorage('reminder', newSettings);
    console.log('[Reminder] 已调度下一次提醒:', formatDate(newSettings.nextTriggerAt!, 'YYYY-MM-DD HH:mm'));
    scheduleNextReminder();
  },

  unlockBadge: (id) => {
    const badges = get().badges.map(b =>
      b.id === id && !b.unlocked
        ? { ...b, unlocked: true, unlockedAt: Date.now() }
        : b
    );
    set({ badges });
    setStorage('badges', badges);
    console.log('[Badge] 解锁勋章:', id);
  },

  toggleAdminMode: () => {
    const { appState } = get();
    const newAppState = { ...appState, isAdmin: !appState.isAdmin };
    set({ appState: newAppState });
    setStorage('appState', newAppState);
    console.log('[Admin] 管理员模式:', newAppState.isAdmin ? '开启' : '关闭');
  }
}));
