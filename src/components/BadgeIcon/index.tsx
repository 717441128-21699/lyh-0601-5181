import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Badge } from '@/types';

interface BadgeIconProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, size = 'md' }) => {
  return (
    <View className={classnames(
      styles.badge,
      styles[`size-${size}`],
      !badge.unlocked && styles.locked
    )}>
      <Text className={styles.icon}>{badge.icon}</Text>
      <Text className={styles.name}>{badge.name}</Text>
    </View>
  );
};

export default BadgeIcon;
