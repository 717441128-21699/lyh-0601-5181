import React, { useState } from 'react';
import { View, Text, Textarea, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import EmotionPicker from '@/components/EmotionPicker';
import { EmotionType } from '@/types';
import { validateImage, validateContent } from '@/utils/validator';
import { getToday } from '@/utils/date';

const RecordPage: React.FC = () => {
  const addDiary = useDiaryStore(state => state.addDiary);

  const [emotion, setEmotion] = useState<EmotionType | undefined>();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 3 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      for (let i = 0; i < res.tempFiles.length; i++) {
        const file = res.tempFiles[i];
        const validation = validateImage({
          size: file.size,
          type: file.type,
          path: file.path
        });

        if (!validation.valid) {
          Taro.showToast({
            title: validation.error || '图片校验失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      }

      const newImages = res.tempFilePaths || res.tempFiles.map(f => f.path);
      setImages([...images, ...newImages].slice(0, 3));
    } catch (err) {
      console.error('[Record] chooseImage error:', err);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!emotion) {
      Taro.showToast({ title: '请选择今日情绪', icon: 'none' });
      return;
    }

    const contentValidation = validateContent(content);
    if (!contentValidation.valid) {
      Taro.showToast({ title: contentValidation.error || '内容校验失败', icon: 'none' });
      return;
    }

    setSubmitting(true);

    try {
      addDiary({
        date: getToday(),
        emotion,
        content: content.trim(),
        images,
        tags
      });

      Taro.showToast({
        title: '记录成功！',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('[Record] submit error:', err);
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <Text className={styles.label}>今天的心情如何？</Text>
        <EmotionPicker selected={emotion} onSelect={setEmotion} size="md" />
      </View>

      <View className={styles.section}>
        <Text className={styles.label}>写下此刻的感受</Text>
        <Textarea
          className={styles.textarea}
          placeholder="记录今天的心情、遇到的事情、想倾诉的话..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={5000}
          autoHeight
        />
        <Text className={styles.charCount}>{content.length}/5000</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.label}>添加标签（最多5个）</Text>
        <View className={styles.tagInputRow}>
          <Textarea
            className={styles.tagInput}
            placeholder="输入标签后点击添加"
            value={tagInput}
            onInput={(e) => setTagInput(e.detail.value)}
            maxlength={10}
            confirmType="done"
            onConfirm={handleAddTag}
          />
          <Button className={styles.tagAddBtn} onClick={handleAddTag}>
            添加
          </Button>
        </View>
        {tags.length > 0 && (
          <View className={styles.tagsList}>
            {tags.map(tag => (
              <View key={tag} className={styles.tagItem}>
                <Text className={styles.tagText}>#{tag}</Text>
                <Text className={styles.tagRemove} onClick={() => handleRemoveTag(tag)}>×</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.label}>添加照片（最多3张，仅JPEG/PNG，≤5MB）</Text>
        <View className={styles.imagesList}>
          {images.map((img, index) => (
            <View key={index} className={styles.imageItem}>
              <Image src={img} className={styles.image} mode="aspectFill" />
              <View className={styles.imageRemove} onClick={() => handleRemoveImage(index)}>
                <Text className={styles.imageRemoveText}>×</Text>
              </View>
            </View>
          ))}
          {images.length < 3 && (
            <View className={styles.imageAdd} onClick={handleChooseImage}>
              <Text className={styles.imageAddIcon}>+</Text>
              <Text className={styles.imageAddText}>添加照片</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '保存中...' : '保存日记'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default RecordPage;
