import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { EmotionType } from '@/types';
import { getEmotionByType } from '@/utils/emotion';

interface EmotionPieChartProps {
  data: Record<EmotionType, number>;
}

const EmotionPieChart: React.FC<EmotionPieChartProps> = ({ data }) => {
  const entries = Object.entries(data) as [EmotionType, number][];
  const validEntries = entries.filter(([, count]) => count > 0);
  const total = validEntries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  let cumulativePercent = 0;
  const gradients: { color: string; percent: string }[] = validEntries.map(([type, count]) => {
    const emotion = getEmotionByType(type);
    const percent = (count / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      color: emotion.color,
      percent: `${startPercent}% ${cumulativePercent}%`
    };
  });

  const backgroundImage = `conic-gradient(${gradients.map(g => `${g.color} ${g.percent}`).join(', ')})`;

  return (
    <View className={styles.container}>
      <View className={styles.chartWrapper}>
        <View className={styles.pieChart} style={{ backgroundImage }}>
          <View className={styles.innerCircle}>
            <Text className={styles.totalLabel}>总计</Text>
            <Text className={styles.totalValue}>{total}</Text>
          </View>
        </View>
      </View>
      <View className={styles.legend}>
        {validEntries.map(([type, count]) => {
          const emotion = getEmotionByType(type);
          const percent = ((count / total) * 100).toFixed(0);
          return (
            <View key={type} className={styles.legendItem}>
              <View className={styles.legendColor} style={{ backgroundColor: emotion.color }} />
              <Text className={styles.legendEmoji}>{emotion.emoji}</Text>
              <Text className={styles.legendLabel}>{emotion.label}</Text>
              <Text className={styles.legendValue}>{count} ({percent}%)</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default EmotionPieChart;
