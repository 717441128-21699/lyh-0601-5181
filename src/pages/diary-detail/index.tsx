import React, { useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import { getEmotionByType } from '@/utils/emotion';
import { formatDate } from '@/utils/date';

const DiaryDetailPage: React.FC = () => {
  const router = useRouter();
  const getDiaryById = useDiaryStore(state => state.getDiaryById);
  const id = router.params.id;
  const diary = getDiaryById(id || '');

  useEffect(() => {
    if (!diary) {
      Taro.showToast({ title: '日记不存在', icon: 'none' });
    }
  }, [diary]);

  if (!diary) {
    return (
      <View className={styles.emptyPage}>
        <Text className={styles.emptyText}>日记不存在或已删除</Text>
      </View>
    );
  }

  const emotion = getEmotionByType(diary.emotion);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header} style={{ background: `linear-gradient(135deg, ${emotion.color}80 0%, ${emotion.color}40 100%)` }}>
        <Text className={styles.emoji}>{emotion.emoji}</Text>
        <Text className={styles.emotionLabel} style={{ color: emotion.color }}>{emotion.label}</Text>
        <Text className={styles.date}>{formatDate(diary.date, 'YYYY年MM月DD日')}</Text>
      </View>

      <View className={styles.contentCard}>
        <Text className={styles.content}>{diary.content}</Text>
      </View>

      {diary.images.length > 0 && (
        <View className={styles.imagesSection}>
          <Text className={styles.sectionTitle}>照片</Text>
          <View className={styles.imagesGrid}>
            {diary.images.map((img, index) => (
              <Image key={index} src={img} className={styles.image} mode="aspectFill" />
            ))}
          </View>
        </View>
      )}

      {diary.tags.length > 0 && (
        <View className={styles.tagsSection}>
          <Text className={styles.sectionTitle}>标签</Text>
          <View className={styles.tags}>
            {diary.tags.map((tag, idx) => (
              <View key={idx} className={styles.tag}>
                <Text className={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default DiaryDetailPage;
