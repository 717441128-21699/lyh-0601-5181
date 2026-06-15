import React from 'react';
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
  const hasLikedPost = useDiaryStore(state => state.hasLikedPost);
  const reportPost = useDiaryStore(state => state.reportPost);
  const isAdmin = useDiaryStore(state => state.appState.isAdmin);

  const liked = hasLikedPost(post.id);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      Taro.showToast({ title: '你已经点过赞啦', icon: 'none' });
      return;
    }
    const success = likePost(post.id);
    if (success) {
      Taro.vibrateShort({ type: 'light' }).catch(() => {});
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.reportStatus === 'pending') {
      Taro.showToast({ title: '该内容已在审核中', icon: 'none' });
      return;
    }
    if (post.reportStatus === 'approved') {
      Taro.showToast({ title: '该内容已被下架', icon: 'none' });
      return;
    }
    Taro.showActionSheet({
      itemList: ['垃圾广告', '色情低俗', '违法违规', '其他'],
      success: (res) => {
        const reasons = ['垃圾广告', '色情低俗', '违法违规', '其他'];
        const reason = reasons[res.tapIndex];
        Taro.showModal({
          title: '举报确认',
          content: `确认举报该内容吗？理由：${reason}`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              reportPost(post.id, reason);
              Taro.showToast({ title: '举报已提交，等待审核', icon: 'success' });
            }
          }
        });
      }
    });
  };

  const handleLongPress = () => {
    if (isAdmin) {
      Taro.showActionSheet({
        itemList: ['下架该内容', '驳回举报（恢复显示）'],
        success: (res) => {
          const reviewPost = useDiaryStore.getState().reviewPost;
          if (res.tapIndex === 0) {
            reviewPost(post.id, true);
            Taro.showToast({ title: '已下架', icon: 'success' });
          } else if (res.tapIndex === 1) {
            reviewPost(post.id, false);
            Taro.showToast({ title: '已驳回举报', icon: 'success' });
          }
        }
      });
    } else {
      handleReport({ stopPropagation: () => {} } as React.MouseEvent);
    }
  };

  const isPending = post.reportStatus === 'pending';

  return (
    <View className={styles.card} onLongPress={handleLongPress}>
      {isPending && (
        <View className={styles.pendingBadge}>
          <Text className={styles.pendingText}>⏳ 审核中</Text>
        </View>
      )}
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
          <Text className={styles.actionCount}>{post.likes}</Text>
        </View>
        <View className={styles.action}>
          <Text className={styles.actionIcon}>💬</Text>
          <Text className={styles.actionCount}>{post.comments}</Text>
        </View>
        <View className={styles.actionReport} onClick={handleReport}>
          <Text className={styles.actionReportText}>
            {post.reportStatus === 'pending' ? '审核中' : '举报'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
