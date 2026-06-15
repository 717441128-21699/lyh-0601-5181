import React from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';
import CheckInCalendar from '@/components/CheckInCalendar';
import BadgeIcon from '@/components/BadgeIcon';
import { getCurrentMonth } from '@/utils/date';

const MinePage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const badges = useDiaryStore(state => state.badges);
  const reminder = useDiaryStore(state => state.reminder);
  const getStreakDays = useDiaryStore(state => state.getStreakDays);
  const posts = useDiaryStore(state => state.posts);
  const isAdmin = useDiaryStore(state => state.appState.isAdmin);
  const getPendingReports = useDiaryStore(state => state.getPendingReports);
  const toggleAdminMode = useDiaryStore(state => state.toggleAdminMode);

  const streak = getStreakDays();
  const totalDiaries = diaries.length;
  const totalPosts = posts.length;
  const unlockedBadges = badges.filter(b => b.unlocked).length;

  const handleSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' });
  };

  const handleMonthlyReport = () => {
    Taro.navigateTo({ url: '/pages/monthly-report/index' });
  };

  const handleAgencies = () => {
    Taro.navigateTo({ url: '/pages/warning/index' });
  };

  const pendingCount = getPendingReports().length;

  const handleAdminQuick = () => {
    if (!isAdmin) {
      Taro.showModal({
        title: '管理员登录',
        editable: true,
        placeholderText: '请输入密码 (admin123)',
        success: (res) => {
          if (res.confirm && res.content === 'admin123') {
            toggleAdminMode();
            Taro.showToast({ title: '管理员模式已开启', icon: 'success' });
          } else if (res.confirm) {
            Taro.showToast({ title: '密码错误', icon: 'none' });
          }
        }
      });
    } else {
      Taro.navigateTo({ url: '/pages/admin-review/index' });
    }
  };

  const menuItems = [
    { icon: '📅', label: '月度报告', desc: '查看本月综合分析', onClick: handleMonthlyReport },
    { icon: '⏰', label: '提醒设置', desc: (() => { const enabledCount = reminder.items.filter(i => i.enabled).length; return enabledCount > 0 ? `${enabledCount}个提醒已开启` : '未开启'; })(), onClick: handleSettings },
    { icon: '🏥', label: '心理咨询', desc: '附近心理咨询机构', onClick: handleAgencies }
  ];

  if (isAdmin || pendingCount > 0) {
    menuItems.splice(2, 0, {
      icon: '📋',
      label: isAdmin ? '内容审核' : '管理员入口',
      desc: pendingCount > 0 ? `${pendingCount} 条待审核` : (isAdmin ? '审核举报内容' : '点击进入'),
      onClick: handleAdminQuick
    });
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.profileCard}>
        <View className={styles.avatar}>
          <Text className={styles.avatarIcon}>🌿</Text>
        </View>
        <View className={styles.profileInfo}>
          <Text className={styles.nickname}>心灵旅者</Text>
          <Text className={styles.motto}>记录情绪，了解自己</Text>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{totalDiaries}</Text>
          <Text className={styles.statLabel}>日记</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{streak}</Text>
          <Text className={styles.statLabel}>连续天数</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{totalPosts}</Text>
          <Text className={styles.statLabel}>社区帖子</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{unlockedBadges}</Text>
          <Text className={styles.statLabel}>勋章</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>打卡日历</Text>
        </View>
        <CheckInCalendar diaries={diaries} month={getCurrentMonth()} />
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>我的勋章</Text>
          <Text className={styles.sectionSubtitle}>{unlockedBadges}/{badges.length}</Text>
        </View>
        <View className={styles.badgesGrid}>
          {badges.map(badge => (
            <BadgeIcon key={badge.id} badge={badge} size="md" />
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能中心</Text>
        <View className={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.label} className={styles.menuItem} onClick={item.onClick}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>{item.icon}</Text>
                <View className={styles.menuText}>
                  <Text className={styles.menuLabel}>{item.label}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
