import React, { useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { mockAgencies } from '@/data/mockAnalysis';
import { useDiaryStore } from '@/store/useDiaryStore';
import { detectStressType } from '@/utils/emotion';
import { formatDate } from '@/utils/date';

const suggestions = [
  {
    title: '深呼吸放松法',
    desc: '找一个安静的地方，闭上眼睛，慢慢地深呼吸4秒，屏住4秒，再缓缓呼出4秒。重复5-10次，感受身体的放松。',
    icon: '🌬️'
  },
  {
    title: '正念冥想',
    desc: '每天花10分钟进行正念冥想，专注于当下的呼吸和感受，不评判地觉察自己的情绪，让思绪自然流动。',
    icon: '🧘'
  },
  {
    title: '适度运动',
    desc: '进行30分钟的有氧运动，如散步、慢跑或瑜伽。运动能释放内啡肽，有效缓解焦虑和抑郁情绪。',
    icon: '🏃'
  },
  {
    title: '倾诉与陪伴',
    desc: '找一个信任的朋友或家人倾诉，说出内心的感受。有时候被倾听本身就是一种治愈。',
    icon: '💬'
  },
  {
    title: '规律作息',
    desc: '保持规律的睡眠和饮食习惯，身体的健康状态会直接影响情绪。充足的睡眠是情绪稳定的基础。',
    icon: '😴'
  }
];

const categoryMap: Record<string, string> = {
  breath: '呼吸练习',
  sleep: '睡眠建议',
  activity: '可执行任务',
  social: '社交互动',
  mindfulness: '正念练习'
};

const categoryOrder = ['breath', 'sleep', 'activity', 'social', 'mindfulness'];

const stressIconMap: Record<string, string> = {
  anxiety: '😰',
  fatigue: '😴',
  low_mood: '😢',
  anger: '😠',
  mixed: '🌤️'
};

const WarningPage: React.FC = () => {
  const diaries = useDiaryStore(state => state.diaries);
  const copingTasks = useDiaryStore(state => state.appState.copingTasks);
  const planGeneratedDate = useDiaryStore(state => state.appState.planGeneratedDate);
  const toggleCopingTask = useDiaryStore(state => state.toggleCopingTask);
  const regenerateCopingPlan = useDiaryStore(state => state.regenerateCopingPlan);
  const ensurePlanUpToDate = useDiaryStore(state => state.ensurePlanUpToDate);

  useEffect(() => {
    ensurePlanUpToDate();
  }, [ensurePlanUpToDate]);

  useDidShow(() => {
    ensurePlanUpToDate();
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysDiaries = diaries.filter(d => new Date(d.date) >= sevenDaysAgo);
  const { type, label, description } = detectStressType(sevenDaysDiaries);

  const completedCount = copingTasks.filter(t => t.completed).length;
  const totalCount = copingTasks.length;

  const groupedTasks = categoryOrder.reduce<{ category: string; label: string; tasks: typeof copingTasks }[]>((acc, cat) => {
    const tasks = copingTasks.filter(t => t.category === cat);
    if (tasks.length > 0) {
      acc.push({ category: cat, label: categoryMap[cat], tasks });
    }
    return acc;
  }, []);

  const handleRegeneratePlan = () => {
    Taro.showModal({
      title: '重新生成计划',
      content: '确定要重新生成今日调适计划吗？当前进度将被重置。',
      confirmText: '重新生成',
      cancelText: '取消',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          regenerateCopingPlan();
        }
      }
    });
  };

  const handleStressRegen = () => {
    Taro.showModal({
      title: '换一份计划',
      content: '确定要换一份调适计划吗？当前进度将被重置。',
      confirmText: '换一份',
      cancelText: '取消',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          regenerateCopingPlan();
        }
      }
    });
  };

  const handleCallPhone = (phone: string) => {
    Taro.makePhoneCall({ phoneNumber: phone });
  };

  const handleCrisisCall = () => {
    Taro.showModal({
      title: '心理援助热线',
      content: '全国心理援助热线：400-161-9995\n北京心理危机研究与干预中心：010-82951332',
      confirmText: '拨打热线',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          Taro.makePhoneCall({ phoneNumber: '4001619995' });
        }
      }
    });
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) return '🔥';
    if (priority === 2) return '⭐';
    return '';
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerIcon}>🌤️</Text>
        <Text className={styles.headerTitle}>情绪调适指南</Text>
        <Text className={styles.headerDesc}>每个人都有情绪低落的时候，这很正常。让我们一起来调整状态吧。</Text>
      </View>

      <View className={styles.crisisCard} onClick={handleCrisisCall}>
        <View className={styles.crisisIcon}>🆘</View>
        <View className={styles.crisisContent}>
          <Text className={styles.crisisTitle}>紧急心理援助</Text>
          <Text className={styles.crisisDesc}>如果情绪严重影响生活，请拨打心理援助热线</Text>
        </View>
        <Text className={styles.crisisArrow}>›</Text>
      </View>

      <View className={styles.stressCard}>
        <Text className={styles.stressIcon}>{stressIconMap[type] || '🌤️'}</Text>
        <View style={{ flex: 1 }}>
          <Text className={styles.stressTitle}>检测结果：{label}</Text>
          <Text className={styles.stressDesc}>{description}</Text>
        </View>
        <Text className={styles.stressRegenBtn} onClick={handleStressRegen}>换一份计划</Text>
      </View>

      <View className={styles.planSection}>
        <Text className={styles.sectionTitle}>📋 你的调适计划</Text>

        <View className={styles.progressRow}>
          <Text className={styles.progressText}>{completedCount}/{totalCount} 已完成</Text>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </View>
        </View>

        {groupedTasks.map(group => (
          <View key={group.category} className={styles.categoryGroup}>
            <Text className={styles.categoryTitle}>{group.label}</Text>
            {group.tasks.map(task => (
              <View
                key={task.id}
                className={`${styles.taskCard} ${task.completed ? styles.taskCardCompleted : ''}`}
                onClick={() => toggleCopingTask(task.id)}
              >
                <View className={`${styles.taskCheckbox} ${task.completed ? styles.taskCheckboxChecked : ''}`}>
                  {task.completed ? '✅' : ''}
                </View>
                <Text className={styles.taskIcon}>{task.icon}</Text>
                <View className={styles.taskInfo}>
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    <Text className={`${styles.taskTitle} ${task.completed ? styles.taskTitleCompleted : ''}`}>
                      {task.title}
                    </Text>
                    {getPriorityBadge(task.priority) ? (
                      <Text className={styles.priorityBadge}>{getPriorityBadge(task.priority)}</Text>
                    ) : null}
                  </View>
                  <Text className={styles.taskDesc}>{task.desc}</Text>
                  {task.completed && task.completedAt ? (
                    <Text className={styles.completedTime}>完成于 {formatDate(task.completedAt, 'HH:mm')}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View className={styles.planMetaRow}>
          {planGeneratedDate ? (
            <Text>今日计划生成于 {formatDate(planGeneratedDate, 'MM月DD日')}</Text>
          ) : <Text />}
        </View>

        <Button className={styles.resetBtn} onClick={handleRegeneratePlan}>
          重新生成今日计划
        </Button>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💡 自我调适建议</Text>
        {suggestions.map((item, index) => (
          <View key={index} className={styles.suggestionCard}>
            <Text className={styles.suggestionIcon}>{item.icon}</Text>
            <View className={styles.suggestionContent}>
              <Text className={styles.suggestionTitle}>{item.title}</Text>
              <Text className={styles.suggestionDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>🏥 附近心理咨询机构</Text>
        {mockAgencies.map(agency => (
          <View key={agency.id} className={styles.agencyCard}>
            <View className={styles.agencyInfo}>
              <Text className={styles.agencyName}>{agency.name}</Text>
              <Text className={styles.agencyAddress}>📍 {agency.address}</Text>
              <Text className={styles.agencyDistance}>距您 {agency.distance}</Text>
            </View>
            <Button className={styles.callBtn} onClick={() => handleCallPhone(agency.phone)}>
              拨打电话
            </Button>
          </View>
        ))}
      </View>

      <View className={styles.footerTip}>
        <Text className={styles.footerTipText}>请记住：寻求帮助是勇敢的表现，你并不孤单 ❤️</Text>
      </View>
    </ScrollView>
  );
};

export default WarningPage;
