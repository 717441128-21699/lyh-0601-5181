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
  const padding = 30;

  console.log('[LineChart] 收到数据:', data);

  if (data.length === 0) {
    return (
      <View className={styles.container}>
        <View className={styles.empty}>
          <Text className={styles.emptyText}>暂无数据</Text>
        </View>
      </View>
    );
  }

  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const minDate = new Date(sortedData[0].date);
  const maxDate = new Date(sortedData[sortedData.length - 1].date);
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const points = sortedData.map((d) => {
    const daysFromStart = (new Date(d.date).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const x = padding + (daysFromStart / totalDays) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((d.score - 1) / (maxScore - 1)) * (chartHeight - 2 * padding);
    const emotion = getEmotionByType(d.emotion);
    return { x, y, ...d, emotion, daysFromStart };
  });

  console.log('[LineChart] 计算后点坐标:', points.map(p => ({ date: p.date, x: p.x.toFixed(1), y: p.y.toFixed(1), score: p.score })));

  const pathD = points.map((p, i) => {
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ');

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return { day, weekDay };
  };

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
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="10" fill={p.emotion.color} stroke="#fff" strokeWidth="3" />
              </g>
            ))}
          </svg>
        </View>
      </View>
      <View className={styles.xAxis}>
        {points.map((p, i) => {
          const { day, weekDay } = getDayLabel(p.date);
          return (
            <View key={i} className={styles.xTick}>
              <Text className={styles.xLabel}>{day}日</Text>
              <Text className={styles.xLabel}>周{weekDay}</Text>
              <Text className={styles.xEmoji}>{p.emotion.emoji}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default EmotionLineChart;
