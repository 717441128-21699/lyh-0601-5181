import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { CommunityPost } from '@/types';
import { getEmotionByType } from '@/utils/emotion';
import { getRelativeTime } from '@/utils/date';
import { useDiaryStore } from '@/store/useDiaryStore';

interface PostCardProps {
  post: CommunityPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const emotion = getEmotionByType(post.emotion);
  const likePost = useDiaryStore(state => state.likePost);
  const reportPost = useDiaryStore(state => state.reportPost);
  const [liked, setLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      likePost(post.id);
      setLiked(true);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.showActionSheet({
      itemList: ['举报该内容'],
      success: (res) => {
        if (res.tapIndex === 0) {
          reportPost(post.id);
          Taro.showToast({ title: '已提交举报，我们会尽快审核', icon: 'none' });
        }
      }
    });
    setShowMenu(false);
  };

  const handleLongPress = () => {
    Taro.showActionSheet({
      itemList: ['举报该内容'],
      success: (res) => {
        if (res.tapIndex === 0) {
          reportPost(post.id);
          Taro.showToast({ title: '已提交举报', icon: 'none' });
        }
      }
    });
  };

  return (
    <View className={styles.card} onLongPress={handleLongPress}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>匿</Text>
          </View>
          <View className={styles.userMeta}>
            <Text className={styles.nickname}>匿名用户</Text>
            <Text className={styles.time}>{getRelativeTime(post.createdAt)}</Text>
          </View>
        </View>
        <View className={styles.emotionTag} style={{ backgroundColor: emotion.color + '20' }}>
          <Text className={styles.emotionEmoji}>{emotion.emoji}</Text>
          <Text className={styles.emotionText} style={{ color: emotion.color }}>{emotion.label}</Text>
        </View>
      </View>
      <Text className={styles.content}>{post.content}</Text>
      <View className={styles.footer}>
        <View className={styles.action} onClick={handleLike}>
          <Text className={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text className={styles.actionCount}>{post.likes + (liked ? 1 : 0)}</Text>
        </View>
        <View className={styles.action}>
          <Text className={styles.actionIcon}>💬</Text>
          <Text className={styles.actionCount}>{post.comments}</Text>
        </View>
        <View className={styles.actionReport} onClick={handleReport}>
          <Text className={styles.actionReportText}>举报</Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
