import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import EmotionPieChart from '@/components/EmotionPieChart';
import EmotionLineChart from '@/components/EmotionLineChart';
import { getEmotionScore, extractKeywords, analyzeNegativeEmotions, getEmotionByType } from '@/utils/emotion';
import { getWeekDates, formatDate } from '@/utils/date';
import { EmotionType } from '@/types';

const AnalysisPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const { dates: weekDates, start, end } = getWeekDates();

  const weekDiariesWithData = weekDates
    .map(date => {
      const diary = diaries.find(d => d.date === date);
      return diary ? {
        date,
        emotion: diary.emotion,
        score: getEmotionScore(diary.emotion),
        hasRecord: true
      } : {
        date,
        emotion: null as unknown as EmotionType,
        score: 0,
        hasRecord: false
      };
    });

  const actualWeekDiaries = weekDiariesWithData.filter(d => d.hasRecord);
  const checkInDays = actualWeekDiaries.length;

  console.log('[Analysis] 本周实际打卡:', { checkInDays, total: weekDates.length });

  const distribution: Record<EmotionType, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
    tired: 0
  };
  actualWeekDiaries.forEach(d => {
    distribution[d.emotion] = (distribution[d.emotion] || 0) + 1;
  });

  const allContent = diaries.filter(d => weekDates.includes(d.date)).map(d => d.content);
  const keywords = extractKeywords(allContent);

  const chartData = weekDiariesWithData.map(d => ({
    date: d.date,
    emotion: d.hasRecord ? d.emotion : 'calm' as EmotionType,
    score: d.score
  }));

  const actualEmotionRecords = actualWeekDiaries.map(d => ({
    date: d.date,
    emotion: d.emotion
  }));
  const { triggered: warningTriggered, days, ratio: negativeRatio } = analyzeNegativeEmotions(actualEmotionRecords, 0.6);

  const avgScore = actualWeekDiaries.length > 0
    ? (actualWeekDiaries.reduce((sum, d) => sum + d.score, 0) / actualWeekDiaries.length).toFixed(1)
    : '0.0';

  const positiveDays = actualWeekDiaries.filter(d => {
    const negatives: EmotionType[] = ['sad', 'anxious', 'angry', 'tired'];
    return !negatives.includes(d.emotion);
  }).length;

  console.log('[Analysis] 预警检查:', {
    actualRecords: actualEmotionRecords.length,
    needs3Days: actualEmotionRecords.length >= 3,
    warningTriggered,
    negativeRatio: (negativeRatio * 100).toFixed(1) + '%',
    days
  });

  const handleViewWarning = () => {
    Taro.navigateTo({ url: '/pages/warning/index' });
  };

  const handleViewMonthly = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  const weekStartStr = formatDate(start, 'MM月DD日');
  const weekEndStr = formatDate(end, 'MM月DD日');

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>情绪分析</Text>
        <Text className={styles.subtitle}>本周 {weekStartStr} - {weekEndStr}</Text>
      </View>

      {warningTriggered && (
        <View className={styles.warningBanner} onClick={handleViewWarning}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>负面情绪预警</Text>
            <Text className={styles.warningDesc}>
              连续{days}天记录中负面情绪占比 {(negativeRatio * 100).toFixed(0)}%，点击查看建议
            </Text>
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
          <Text className={styles.statValue}>{positiveDays}</Text>
          <Text className={styles.statLabel}>积极天数</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{checkInDays}</Text>
          <Text className={styles.statLabel}>打卡天数</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪分布</Text>
        <View className={styles.card}>
          {checkInDays > 0 ? (
            <EmotionPieChart data={distribution} />
          ) : (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>本周还没有打卡记录哦～</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪变化趋势</Text>
        <View className={styles.card}>
          {checkInDays > 0 ? (
            <EmotionLineChart data={chartData} />
          ) : (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>开始打卡后就能看到情绪变化啦</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关键词云</Text>
        <View className={styles.card}>
          {keywords.length > 0 ? (
            <View className={styles.wordCloud}>
              {keywords.map((kw, i) => {
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
              })}
            </View>
          ) : (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>记录更多心情来生成关键词云吧</Text>
            </View>
          )}
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
