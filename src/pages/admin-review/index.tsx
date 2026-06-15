import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import { CommunityPost, ReportStatus } from '@/types';
import { getEmotionByType } from '@/utils/emotion';
import { formatDate } from '@/utils/date';

type TabType = 'pending' | 'approved' | 'rejected';

const AdminReviewPage: React.FC = () => {
  const isAdmin = useDiaryStore(state => state.appState.isAdmin);
  const posts = useDiaryStore(state => state.posts);
  const reviewPost = useDiaryStore(state => state.reviewPost);

  const [activeTab, setActiveTab] = useState<TabType>('pending');

  React.useEffect(() => {
    if (!isAdmin) {
      Taro.showModal({
        title: '无权限',
        content: '请先登录管理员账号',
        showCancel: false,
        success: () => {
          Taro.navigateBack();
        }
      });
    }
  }, [isAdmin]);

  const pendingPosts = posts.filter(p => p.reportStatus === 'pending');
  const approvedPosts = posts.filter(p => p.reportStatus === 'approved');
  const rejectedPosts = posts.filter(p => p.reportStatus === 'rejected');

  const getFilteredPosts = (): CommunityPost[] => {
    switch (activeTab) {
      case 'pending': return pendingPosts;
      case 'approved': return approvedPosts;
      case 'rejected': return rejectedPosts;
      default: return [];
    }
  };

  const filteredPosts = getFilteredPosts();

  const handleReview = (postId: string, approved: boolean) => {
    Taro.showModal({
      title: approved ? '确认下架' : '确认驳回',
      content: approved ? '审核通过后该内容将从列表下架' : '驳回后该内容将继续显示',
      success: (res) => {
        if (res.confirm) {
          reviewPost(postId, approved);
          Taro.showToast({
            title: approved ? '已下架' : '已驳回',
            icon: 'success'
          });
        }
      }
    });
  };

  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '已下架';
      case 'rejected': return '已驳回';
      default: return '';
    }
  };

  const getStatusClass = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      default: return '';
    }
  };

  if (!isAdmin) {
    return <ScrollView className={styles.page} />;
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'pending', label: '待审核', count: pendingPosts.length },
    { key: 'approved', label: '已下架', count: approvedPosts.length },
    { key: 'rejected', label: '已驳回', count: rejectedPosts.length },
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>内容审核</Text>
        <Text className={styles.subtitle}>管理用户举报的内容</Text>
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{pendingPosts.length}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{approvedPosts.length}</Text>
          <Text className={styles.statLabel}>已下架</Text>
        </View>
        <View className={styles.statCard}>
          <Text className={styles.statValue}>{rejectedPosts.length}</Text>
          <Text className={styles.statLabel}>已驳回</Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
          </View>
        ))}
      </View>

      {filteredPosts.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>
            {activeTab === 'pending' ? '暂无待审核内容' :
             activeTab === 'approved' ? '暂无已下架内容' : '暂无已驳回内容'}
          </Text>
        </View>
      ) : (
        filteredPosts.map(post => {
          const emotion = getEmotionByType(post.emotion);
          return (
            <View key={post.id} className={styles.card}>
              <View className={styles.headerRow}>
                <View className={`${styles.statusBadge} ${getStatusClass(post.reportStatus)}`}>
                  {getStatusText(post.reportStatus)}
                </View>
                <View className={styles.emotionTag} style={{ backgroundColor: emotion.color + '20' }}>
                  <Text className={styles.emotionEmoji}>{emotion.emoji}</Text>
                  <Text className={styles.emotionText} style={{ color: emotion.color }}>{emotion.label}</Text>
                </View>
              </View>

              <Text className={styles.content}>{post.content}</Text>

              <View className={styles.reportInfo}>
                {post.reportedAt && (
                  <View className={styles.reportRow}>
                    <Text className={styles.reportLabel}>举报时间：</Text>
                    <Text className={styles.reportValue}>{formatDate(post.reportedAt, 'YYYY-MM-DD HH:mm')}</Text>
                  </View>
                )}
                {post.reportReason && (
                  <View className={styles.reportRow}>
                    <Text className={styles.reportLabel}>举报理由：</Text>
                    <Text className={styles.reportValue}>{post.reportReason}</Text>
                  </View>
                )}
                <View className={styles.reportRow}>
                  <Text className={styles.reportLabel}>互动数据：</Text>
                  <Text className={styles.reportValue}>❤️ {post.likes} · 💬 {post.comments}</Text>
                </View>
              </View>

              {post.reportStatus === 'pending' ? (
                <View className={styles.footer}>
                  <View className={styles.btnReject} onClick={() => handleReview(post.id, false)}>
                    <Text>驳回（显示）</Text>
                  </View>
                  <View className={styles.btnApprove} onClick={() => handleReview(post.id, true)}>
                    <Text>通过（下架）</Text>
                  </View>
                </View>
              ) : (
                <View className={styles.footer}>
                  <View className={styles.btnDisabled}>
                    <Text>{post.reportStatus === 'approved' ? '已下架处理' : '已驳回处理'}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

export default AdminReviewPage;
