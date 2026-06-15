import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import EmotionPieChart from '@/components/EmotionPieChart';
import EmotionLineChart from '@/components/EmotionLineChart';
import { mockWeeklyAnalysis } from '@/data/mockAnalysis';
import { getEmotionScore, extractKeywords } from '@/utils/emotion';
import { getWeekDates } from '@/utils/date';
import { EmotionType } from '@/types';

const AnalysisPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const { dates: weekDates } = getWeekDates();

  const weekDiaries = weekDates.map(date => {
    const diary = diaries.find(d => d.date === date);
    if (diary) {
      return { date, emotion: diary.emotion, score: getEmotionScore(diary.emotion) };
    }
    return { date, emotion: 'calm' as EmotionType, score: 3 };
  });

  const distribution: Record<EmotionType, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
    tired: 0
  };
  weekDiaries.forEach(d => {
    distribution[d.emotion] = (distribution[d.emotion] || 0) + 1;
  });

  const allContent = diaries.filter(d => weekDates.includes(d.date)).map(d => d.content);
  const keywords = extractKeywords(allContent);

  const negativeCount = weekDiaries.filter(d => {
    const negatives: EmotionType[] = ['sad', 'anxious', 'angry', 'tired'];
    return negatives.includes(d.emotion);
  }).length;
  const negativeRatio = weekDiaries.length > 0 ? negativeCount / weekDiaries.length : 0;
  const warningTriggered = negativeRatio >= 0.6;

  const avgScore = weekDiaries.length > 0
    ? (weekDiaries.reduce((sum, d) => sum + d.score, 0) / weekDiaries.length).toFixed(1)
    : '0.0';

  const handleViewWarning = () => {
    Taro.navigateTo({ url: '/pages/warning/index' });
  };

  const handleViewMonthly = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>情绪分析</Text>
        <Text className={styles.subtitle}>本周 {mockWeeklyAnalysis.weekStart.slice(5)} - {mockWeeklyAnalysis.weekEnd.slice(5)}</Text>
      </View>

      {warningTriggered && (
        <View className={styles.warningBanner} onClick={handleViewWarning}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>负面情绪预警</Text>
            <Text className={styles.warningDesc}>本周负面情绪占比 {(negativeRatio * 100).toFixed(0)}%，点击查看建议</Text>
          </View>
          <Text className={styles.warningArrow}>›</Text>
        </View>
      )}

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{avgScore}</Text>
          <Text className={styles.statLabel}>情绪指数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{weekDiaries.filter(d => d.score > 2).length}</Text>
          <Text className={styles.statLabel}>积极天数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{weekDiaries.length}</Text>
          <Text className={styles.statLabel}>打卡天数</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪分布</Text>
        <View className={styles.card}>
          <EmotionPieChart data={distribution} />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪变化趋势</Text>
        <View className={styles.card}>
          <EmotionLineChart data={weekDiaries} />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关键词云</Text>
        <View className={styles.card}>
          <View className={styles.wordCloud}>
            {keywords.length > 0 ? keywords.map((kw, i) => {
              const size = 24 + Math.min(kw.count * 4, 24);
              const opacity = 0.5 + Math.min(kw.count * 0.1, 0.5);
              const colors = ['#FF9B7B', '#FFD93D', '#87C8FF', '#B7E4C7', '#9B8AB8'];
              const color = colors[i % colors.length];
              return (
                <Text
                  key={kw.word}
                  className={styles.wordItem}
                  style={{ fontSize: `${size}rpx`, color, opacity }}
                >
                  {kw.word}
                </Text>
              );
            }) : (
              <Text className={styles.emptyText}>暂无关键词数据</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.monthlyCard} onClick={handleViewMonthly}>
          <View className={styles.monthlyLeft}>
            <Text className={styles.monthlyIcon}>📊</Text>
            <View>
              <Text className={styles.monthlyTitle}>查看月度报告</Text>
              <Text className={styles.monthlyDesc}>本月情绪、打卡、社区综合分析</Text>
            </View>
          </View>
          <Text className={styles.monthlyArrow}>›</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default AnalysisPage;
