import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { EmotionType } from '@/types';
import { getEmotionByType } from '@/utils/emotion';

interface EmotionLineChartProps {
  data: { date: string; emotion: EmotionType; score: number }[];
}

const EmotionLineChart: React.FC<EmotionLineChartProps> = ({ data }) => {
  const maxScore = 5;
  const chartHeight = 200;
  const chartWidth = 600;

  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = chartHeight - (d.score / maxScore) * chartHeight;
    const emotion = getEmotionByType(d.emotion);
    return { x, y, ...d, emotion };
  });

  const pathD = points.map((p, i) => {
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ');

  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <View className={styles.container}>
      <View className={styles.chart}>
        <View className={styles.yAxis}>
          {[5, 4, 3, 2, 1].map(score => (
            <View key={score} className={styles.yTick}>
              <Text className={styles.yLabel}>{score}</Text>
            </View>
          ))}
        </View>
        <View className={styles.chartArea}>
          <View className={styles.gridLines}>
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} className={styles.gridLine} style={{ bottom: `${(i / 4) * 100}%` }} />
            ))}
          </View>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.svg}>
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF9B7B" />
                <stop offset="100%" stopColor="#FFD93D" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="10" fill={p.emotion.color} stroke="#fff" strokeWidth="3" />
              </g>
            ))}
          </svg>
        </View>
      </View>
      <View className={styles.xAxis}>
        {weekLabels.map((label, i) => (
          <View key={i} className={styles.xTick}>
            <Text className={styles.xLabel}>周{label}</Text>
            {points[i] && (
              <Text className={styles.xEmoji}>{points[i].emotion.emoji}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default EmotionLineChart;
