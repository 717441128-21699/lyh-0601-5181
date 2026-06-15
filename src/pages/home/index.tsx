import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import DiaryCard from '@/components/DiaryCard';
import { getToday, formatDate } from '@/utils/date';
import { getEmotionByType, analyzeNegativeEmotions } from '@/utils/emotion';

const HomePage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const hasCheckedInToday = useDiaryStore(state => state.hasCheckedInToday);
  const getStreakDays = useDiaryStore(state => state.getStreakDays);
  const streak = getStreakDays();
  const todayChecked = hasCheckedInToday();
  const todayEntry = diaries.find(d => d.date === getToday());

  const recentDiaries = diaries.slice(0, 3);

  const checkinDays = diaries.length;

  const emotions = diaries.slice(0, 7).map(d => ({ date: d.date, emotion: d.emotion }));
  const negativeCheck = analyzeNegativeEmotions(emotions);

  const today = new Date();
  const hour = today.getHours();
  let greeting = '晚上好';
  if (hour < 12) greeting = '早上好';
  else if (hour < 18) greeting = '下午好';

  const handleCheckIn = () => {
    Taro.navigateTo({ url: '/pages/record/index' });
  };

  const handleViewWarning = () => {
    Taro.navigateTo({ url: '/pages/warning/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <Text className={styles.greetingText}>{greeting}，朋友 👋</Text>
          <Text className={styles.dateText}>{formatDate(today, 'MM月DD日 dddd')}</Text>
        </View>
      </View>

      {negativeCheck.triggered && (
        <View className={styles.warningCard} onClick={handleViewWarning}>
          <View className={styles.warningIcon}>⚠️</View>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>情绪预警</Text>
            <Text className={styles.warningDesc}>连续3日负面情绪较多，点我查看调适建议</Text>
          </View>
          <Text className={styles.warningArrow}>›</Text>
        </View>
      )}

      <View className={styles.checkinCard}>
        <View className={styles.checkinLeft}>
          <View className={styles.streakBox}>
            <Text className={styles.streakNum}>{streak}</Text>
            <Text className={styles.streakLabel}>连续天数</Text>
          </View>
        </View>
        <View className={styles.checkinRight}>
          <Text className={styles.checkinTitle}>
            {todayChecked ? '今日已打卡 ✨' : '记录今天的心情'}
          </Text>
          <Text className={styles.checkinDesc}>累计记录 {checkinDays} 篇日记</Text>
          <Button
            className={styles.checkinBtn}
            onClick={handleCheckIn}
          >
            {todayChecked ? '查看今日' : '立即打卡'}
          </Button>
        </View>
      </View>

      {todayEntry && (
        <View className={styles.todayMood}>
          <Text className={styles.sectionTitle}>今日心情</Text>
          <View className={styles.moodCard}>
            <View className={styles.moodEmojiBox} style={{ backgroundColor: getEmotionByType(todayEntry.emotion).color + '20' }}>
              <Text className={styles.moodEmoji}>{getEmotionByType(todayEntry.emotion).emoji}</Text>
            </View>
            <View className={styles.moodInfo}>
              <Text className={styles.moodLabel} style={{ color: getEmotionByType(todayEntry.emotion).color }}>
                {getEmotionByType(todayEntry.emotion).label}
              </Text>
              <Text className={styles.moodContent}>{todayEntry.content}</Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>最近记录</Text>
        {recentDiaries.length > 0 ? (
          recentDiaries.map(diary => (
            <DiaryCard key={diary.id} diary={diary} />
          ))
        ) : (
          <View className={styles.emptyCard}>
            <Text className={styles.emptyText}>还没有记录，开始写下第一篇日记吧～</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
