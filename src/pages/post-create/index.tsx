import React, { useState } from 'react';
import { View, Text, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import EmotionPicker from '@/components/EmotionPicker';
import { EmotionType } from '@/types';
import { validateContent } from '@/utils/validator';

const PostCreatePage: React.FC = () => {
  const addPost = useDiaryStore(state => state.addPost);
  const [emotion, setEmotion] = useState<EmotionType>('calm');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    const validation = validateContent(content);
    if (!validation.valid) {
      Taro.showToast({ title: validation.error || '请输入内容', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      addPost({
        content: content.trim(),
        emotion,
        isAnonymous
      });

      Taro.showToast({
        title: '发布成功！',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('[PostCreate] submit error:', err);
      Taro.showToast({ title: '发布失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <Text className={styles.label}>此刻的心情</Text>
        <EmotionPicker selected={emotion} onSelect={setEmotion} size="sm" />
      </View>

      <View className={styles.section}>
        <Text className={styles.label}>分享你的故事</Text>
        <Textarea
          className={styles.textarea}
          placeholder="在这里写下你想分享的心情..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className={styles.charCount}>{content.length}/500</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.anonymousRow}>
          <Text className={styles.anonymousLabel}>匿名发布</Text>
          <View
            className={`${styles.switch} ${isAnonymous ? styles.switchOn : ''}`}
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <View className={styles.switchDot} />
          </View>
        </View>
        <Text className={styles.tip}>💡 匿名发布可以更好保护你的隐私</Text>
      </View>

      <View className={styles.footer}>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '发布中...' : '发布到社区'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default PostCreatePage;
