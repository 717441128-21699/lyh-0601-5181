import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import PostCard from '@/components/PostCard';
import { EmotionType } from '@/types';

const CommunityPage: React.FC = () => {
  const posts = useDiaryStore(state => state.posts);
  const [activeTab, setActiveTab] = useState<string>('hot');
  const [filterEmotion, setFilterEmotion] = useState<EmotionType | 'all'>('all');

  const filteredPosts = posts
    .filter(p => filterEmotion === 'all' || p.emotion === filterEmotion)
    .filter(p => !p.isReported)
    .sort((a, b) => {
      if (activeTab === 'hot') {
        return (b.likes + b.comments * 2) - (a.likes + a.comments * 2);
      }
      return b.createdAt - a.createdAt;
    });

  const handleCreatePost = () => {
    Taro.navigateTo({ url: '/pages/post-create/index' });
  };

  const emotionFilters: { type: EmotionType | 'all'; label: string; emoji: string }[] = [
    { type: 'all', label: '全部', emoji: '🌈' },
    { type: 'happy', label: '开心', emoji: '😊' },
    { type: 'calm', label: '平静', emoji: '😌' },
    { type: 'sad', label: '难过', emoji: '😢' },
    { type: 'anxious', label: '焦虑', emoji: '😰' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>情感社区</Text>
        <Text className={styles.subtitle}>匿名分享，温暖相伴</Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={`${styles.tab} ${activeTab === 'hot' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('hot')}
        >
          <Text className={styles.tabText}>🔥 热门</Text>
        </View>
        <View
          className={`${styles.tab} ${activeTab === 'latest' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('latest')}
        >
          <Text className={styles.tabText}>✨ 最新</Text>
        </View>
      </View>

      <ScrollView
        className={styles.scrollArea}
        scrollY
        scrollWithAnimation
      >
        <View className={styles.filterArea}>
          {emotionFilters.map(f => (
            <View
              key={f.type}
              className={`${styles.filterChip} ${filterEmotion === f.type ? styles.filterChipActive : ''}`}
              onClick={() => setFilterEmotion(f.type)}
            >
              <Text className={styles.filterEmoji}>{f.emoji}</Text>
              <Text className={styles.filterLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.postsList}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <View className={styles.empty}>
              <Text className={styles.emptyEmoji}>💭</Text>
              <Text className={styles.emptyText}>还没有相关帖子</Text>
              <Text className={styles.emptyDesc}>来分享你的心情吧～</Text>
            </View>
          )}
        </View>

        <View style={{ height: '160rpx' }} />
      </ScrollView>

      <View className={styles.fabWrapper}>
        <Button className={styles.fabBtn} onClick={handleCreatePost}>
          <Text className={styles.fabIcon}>✍️</Text>
          <Text className={styles.fabText}>发布</Text>
        </Button>
      </View>
    </View>
  );
};

export default CommunityPage;
