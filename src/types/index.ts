export type EmotionType = 'happy' | 'calm' | 'sad' | 'anxious' | 'angry' | 'tired';

export type StressType = 'anxiety' | 'fatigue' | 'low_mood' | 'anger' | 'mixed';

export interface EmotionOption {
  type: EmotionType;
  label: string;
  emoji: string;
  color: string;
  isNegative: boolean;
}

export interface DiaryEntry {
  id: string;
  date: string;
  emotion: EmotionType;
  intensity: number;
  content: string;
  images: string[];
  tags: string[];
  createdAt: number;
}

export type ReportStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface CommunityPost {
  id: string;
  content: string;
  emotion: EmotionType;
  likes: number;
  comments: number;
  isAnonymous: boolean;
  createdAt: number;
  reportStatus: ReportStatus;
  reportedAt?: number;
  reportReason?: string;
}

export interface CheckInRecord {
  date: string;
  checkedIn: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
  unlockedAt?: number;
}

export interface WeeklyAnalysis {
  weekStart: string;
  weekEnd: string;
  emotionDistribution: Record<EmotionType, number>;
  dailyEmotions: { date: string; emotion: EmotionType; score: number }[];
  keywords: { word: string; count: number }[];
  negativeRatio: number;
  warningTriggered: boolean;
}

export interface CounselingAgency {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: string;
}

export interface MonthlyReport {
  month: string;
  totalCheckIns: number;
  checkInRate: number;
  mostCommonEmotion: EmotionType;
  emotionSummary: string;
  communityPosts: number;
  badgesEarned: Badge[];
}

export interface ReminderItem {
  id: string;
  enabled: boolean;
  time: string;
  label: string;
  nextTriggerAt?: number;
}

export interface ReminderSettings {
  items: ReminderItem[];
}

export type CopingCategory = 'breath' | 'sleep' | 'activity' | 'social' | 'mindfulness';

export interface CopingTask {
  id: string;
  title: string;
  desc: string;
  icon: string;
  completed: boolean;
  completedAt?: number;
  category: CopingCategory;
  priority: number;
  forStressTypes: StressType[];
}

export interface AppState {
  likedPostIds: string[];
  isAdmin: boolean;
  copingTasks: CopingTask[];
  planGeneratedDate?: string;
}
