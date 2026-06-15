import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { DiaryEntry } from '@/types';
import { getMonthDates, getCurrentMonth, formatDate } from '@/utils/date';
import { getEmotionByType } from '@/utils/emotion';

interface CheckInCalendarProps {
  diaries: DiaryEntry[];
  month?: string;
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const CheckInCalendar: React.FC<CheckInCalendarProps> = ({ diaries, month }) => {
  const targetMonth = month || getCurrentMonth();
  const dates = getMonthDates(targetMonth);
  const firstDay = new Date(`${targetMonth}-01`).getDay();
  const [year, m] = targetMonth.split('-').map(Number);

  const diaryMap: Record<string, DiaryEntry> = {};
  diaries.forEach(d => {
    diaryMap[d.date] = d;
  });

  const today = formatDate(new Date(), 'YYYY-MM-DD');

  const renderCells = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} className={styles.cellEmpty} />);
    }

    dates.forEach(date => {
      const diary = diaryMap[date];
      const emotion = diary ? getEmotionByType(diary.emotion) : null;
      const isToday = date === today;

      cells.push(
        <View
          key={date}
          className={`${styles.cell} ${isToday ? styles.cellToday : ''}`}
        >
          <Text className={styles.dateText}>{parseInt(date.split('-')[2])}</Text>
          {emotion && (
            <Text className={styles.emoji}>{emotion.emoji}</Text>
          )}
        </View>
      );
    });

    return cells;
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.monthText}>{year}年{m}月</Text>
      </View>
      <View className={styles.weekRow}>
        {weekDays.map(day => (
          <View key={day} className={styles.weekCell}>
            <Text className={styles.weekText}>{day}</Text>
          </View>
        ))}
      </View>
      <View className={styles.grid}>
        {renderCells()}
      </View>
    </View>
  );
};

export default CheckInCalendar;
