import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import EmotionPieChart from '@/components/EmotionPieChart';
import EmotionLineChart from '@/components/EmotionLineChart';
import { getEmotionScore, extractKeywords, analyzeNegativeEmotions, getEmotionByType } from '@/utils/emotion';
import { formatDate, getDateRange } from '@/utils/date';
import { EmotionType } from '@/types';

type RangeTab = '7d' | '30d' | 'custom';

const RANGE_LABELS: Record<RangeTab, string> = {
  '7d': '最近7天',
  '30d': '最近30天',
  custom: '自定义'
};

const NEGATIVE_EMOTIONS: EmotionType[] = ['sad', 'anxious', 'angry', 'tired'];

const AnalysisPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const [activeTab, setActiveTab] = useState<RangeTab>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const rangeInput = useMemo(() => {
    if (activeTab === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return activeTab;
  }, [activeTab, customStart, customEnd]);

  const { dates: rangeDates, start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(rangeInput),
    [rangeInput]
  );

  const diariesInRange = useMemo(() => {
    return diaries.filter(d => rangeDates.includes(d.date));
  }, [diaries, rangeDates]);

  const checkInDays = diariesInRange.length;

  const distribution: Record<EmotionType, number> = useMemo(() => {
    const dist: Record<EmotionType, number> = {
      happy: 0, calm: 0, sad: 0, anxious: 0, angry: 0, tired: 0
    };
    diariesInRange.forEach(d => {
      dist[d.emotion] = (dist[d.emotion] || 0) + 1;
    });
    return dist;
  }, [diariesInRange]);

  const allContent = useMemo(
    () => diariesInRange.map(d => d.content),
    [diariesInRange]
  );
  const keywords = useMemo(() => extractKeywords(allContent), [allContent]);

  const lineChartData = useMemo(
    () => diariesInRange.map(d => ({
      date: d.date,
      emotion: d.emotion,
      score: getEmotionScore(d.emotion)
    })),
    [diariesInRange]
  );

  const avgScore = useMemo(() => {
    if (diariesInRange.length === 0) return '0.0';
    const total = diariesInRange.reduce((sum, d) => sum + getEmotionScore(d.emotion), 0);
    return (total / diariesInRange.length).toFixed(1);
  }, [diariesInRange]);

  const positiveDays = useMemo(
    () => diariesInRange.filter(d => !NEGATIVE_EMOTIONS.includes(d.emotion)).length,
    [diariesInRange]
  );

  const negativeDiaries = useMemo(
    () => diariesInRange.filter(d => NEGATIVE_EMOTIONS.includes(d.emotion)),
    [diariesInRange]
  );

  const avgNegativeIntensity = useMemo(() => {
    if (negativeDiaries.length === 0) return 0;
    const total = negativeDiaries.reduce((sum, d) => sum + d.intensity, 0);
    return +(total / negativeDiaries.length).toFixed(1);
  }, [negativeDiaries]);

  const highIntensityCount = useMemo(
    () => diariesInRange.filter(d => NEGATIVE_EMOTIONS.includes(d.emotion) && d.intensity >= 7).length,
    [diariesInRange]
  );

  const { triggered: warningTriggered, days, ratio: negativeRatio, isStrongWarning } = useMemo(() => {
    const emotionRecords = diariesInRange.map(d => ({
      date: d.date,
      emotion: d.emotion
    }));
    const result = analyzeNegativeEmotions(emotionRecords, 0.6);

    if (result.triggered) {
      const consecutiveDates = result.consecutiveDays.map(cd => cd.date);
      const consecutiveDiaries = diariesInRange.filter(d => consecutiveDates.includes(d.date));
      const consecutiveNeg = consecutiveDiaries.filter(d => NEGATIVE_EMOTIONS.includes(d.emotion));
      if (consecutiveNeg.length > 0) {
        const avgIntensity = consecutiveNeg.reduce((s, d) => s + d.intensity, 0) / consecutiveNeg.length;
        if (avgIntensity >= 7) {
          return { ...result, isStrongWarning: true };
        }
      }
      return { ...result, isStrongWarning: false };
    }

    return { ...result, isStrongWarning: false };
  }, [diariesInRange]);

  const startStr = formatDate(rangeStart, 'MM月DD日');
  const endStr = formatDate(rangeEnd, 'MM月DD日');

  const handleViewWarning = () => {
    Taro.navigateTo({ url: '/pages/warning/index' });
  };

  const handleViewMonthly = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  const handleTabChange = (tab: RangeTab) => {
    setActiveTab(tab);
    if (tab !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const isEmpty = checkInDays === 0;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>情绪分析</Text>
        <Text className={styles.subtitle}>{startStr} - {endStr}</Text>
      </View>

      <View className={styles.rangeTabs}>
        {(Object.keys(RANGE_LABELS) as RangeTab[]).map(tab => (
          <View
            key={tab}
            className={`${styles.rangeTab} ${activeTab === tab ? styles.rangeTabActive : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <Text>{RANGE_LABELS[tab]}</Text>
          </View>
        ))}
      </View>

      {activeTab === 'custom' && (
        <View className={styles.dateRangeRow}>
          <Input
            className={styles.dateInput}
            type='text'
            placeholder='开始日期 YYYY-MM-DD'
            value={customStart}
            onInput={e => setCustomStart(e.detail.value)}
          />
          <Text style={{ margin: '0 8rpx', color: '#999' }}>~</Text>
          <Input
            className={styles.dateInput}
            type='text'
            placeholder='结束日期 YYYY-MM-DD'
            value={customEnd}
            onInput={e => setCustomEnd(e.detail.value)}
          />
        </View>
      )}

      {warningTriggered && (
        <View className={styles.warningBanner} onClick={handleViewWarning}>
          <Text className={styles.warningIcon}>{isStrongWarning ? '🔴' : '⚠️'}</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>
              {isStrongWarning ? '高强度负面情绪预警' : '负面情绪预警'}
            </Text>
            <Text className={styles.warningDesc}>
              连续{days}天记录中负面情绪占比 {(negativeRatio * 100).toFixed(0)}%
              {isStrongWarning ? '，平均强度≥7，请及时关注' : '，点击查看建议'}
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

      {highIntensityCount > 0 && (
        <View className={styles.highIntensityCard}>
          <Text className={styles.highIntensityValue}>{highIntensityCount}</Text>
          <Text className={styles.highIntensityLabel}>高强度负面记录（强度≥7）</Text>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪分布</Text>
        <View className={styles.card}>
          {isEmpty ? (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>无数据</Text>
            </View>
          ) : (
            <EmotionPieChart data={distribution} />
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>情绪变化趋势</Text>
        <View className={styles.card}>
          {isEmpty ? (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>无数据</Text>
            </View>
          ) : (
            <EmotionLineChart data={lineChartData} />
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          负面情绪强度{negativeDiaries.length > 0 ? `（均值 ${avgNegativeIntensity}）` : ''}
        </Text>
        <View className={styles.card}>
          {negativeDiaries.length > 0 ? (
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '16rpx' }}>
              {negativeDiaries.map(d => {
                const emo = getEmotionByType(d.emotion);
                return (
                  <View
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8rpx',
                      padding: '8rpx 16rpx',
                      background: '#FFF5F5',
                      borderRadius: '8rpx'
                    }}
                  >
                    <Text>{emo.emoji}</Text>
                    <Text style={{ fontSize: '24rpx', color: '#666' }}>
                      {formatDate(d.date, 'MM/DD')}
                    </Text>
                    <Text style={{ fontSize: '24rpx', fontWeight: 600, color: d.intensity >= 7 ? '#FF6B6B' : '#999' }}>
                      强度{d.intensity}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={styles.emptyTip}>
              <Text className={styles.emptyText}>无数据</Text>
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
              <Text className={styles.emptyText}>无数据</Text>
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
