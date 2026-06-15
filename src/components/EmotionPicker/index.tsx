import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { EMOTIONS } from '@/utils/emotion';
import { EmotionType } from '@/types';

interface EmotionPickerProps {
  selected?: EmotionType;
  onSelect: (type: EmotionType) => void;
  size?: 'sm' | 'md' | 'lg';
}

const EmotionPicker: React.FC<EmotionPickerProps> = ({ selected, onSelect, size = 'md' }) => {
  return (
    <View className={styles.container}>
      {EMOTIONS.map(emotion => (
        <View
          key={emotion.type}
          className={classnames(
            styles.emotionItem,
            styles[`size-${size}`],
            selected === emotion.type && styles.selected
          )}
          style={selected === emotion.type ? { backgroundColor: emotion.color + '20', borderColor: emotion.color } : {}}
          onClick={() => onSelect(emotion.type)}
        >
          <Text className={styles.emoji}>{emotion.emoji}</Text>
          <Text className={styles.label}>{emotion.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default EmotionPicker;
