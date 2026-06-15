import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { DiaryEntry } from '@/types';
import { getEmotionByType } from '@/utils/emotion';
import { formatDate } from '@/utils/date';

interface DiaryCardProps {
  diary: DiaryEntry;
  onClick?: () => void;
}

const DiaryCard: React.FC<DiaryCardProps> = ({ diary, onClick }) => {
  const emotion = getEmotionByType(diary.emotion);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({ url: `/pages/diary-detail/index?id=${diary.id}` });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.emotionWrapper} style={{ backgroundColor: emotion.color + '20' }}>
          <Text className={styles.emoji}>{emotion.emoji}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.date}>{formatDate(diary.date, 'MM月DD日')}</Text>
          <Text className={styles.emotionLabel} style={{ color: emotion.color }}>{emotion.label}</Text>
        </View>
      </View>
      <Text className={styles.content}>{diary.content}</Text>
      {diary.tags.length > 0 && (
        <View className={styles.tags}>
          {diary.tags.map((tag, idx) => (
            <View key={idx} className={styles.tag}>
              <Text className={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default DiaryCard;
