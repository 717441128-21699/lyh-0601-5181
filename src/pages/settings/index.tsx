import React, { useState } from 'react';
import { View, Text, ScrollView, Button, Switch, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';

const SettingsPage: React.FC = () => {
  const reminder = useDiaryStore(state => state.reminder);
  const setReminder = useDiaryStore(state => state.setReminder);

  const [enabled, setEnabled] = useState(reminder.enabled);
  const [time, setTime] = useState(reminder.time);

  const handleTimeChange = (e: any) => {
    setTime(e.detail.value);
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
  };

  const handleSave = () => {
    setReminder({ enabled, time });
    Taro.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500
    });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>每日提醒</Text>
        <View className={styles.card}>
          <View className={styles.row}>
            <View className={styles.rowLeft}>
              <Text className={styles.rowIcon}>⏰</Text>
              <View>
                <Text className={styles.rowLabel}>打卡提醒</Text>
                <Text className={styles.rowDesc}>开启后每日定时提醒记录情绪</Text>
              </View>
            </View>
            <Switch
              checked={enabled}
              onChange={(e) => handleToggle(e.detail.value)}
              color="#FF9B7B"
            />
          </View>

          {enabled && (
            <View className={styles.row}>
              <View className={styles.rowLeft}>
                <Text className={styles.rowIcon}>🕐</Text>
                <View>
                  <Text className={styles.rowLabel}>提醒时间</Text>
                  <Text className={styles.rowDesc}>每天将在 {time} 提醒你记录心情</Text>
                </View>
              </View>
              <Picker mode="time" value={time} onChange={handleTimeChange}>
                <View className={styles.timePicker}>
                  <Text className={styles.timeText}>{time}</Text>
                  <Text className={styles.arrow}>›</Text>
                </View>
              </Picker>
            </View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关于</Text>
        <View className={styles.card}>
          <View className={styles.row}>
            <View className={styles.rowLeft}>
              <Text className={styles.rowIcon}>📱</Text>
              <View>
                <Text className={styles.rowLabel}>版本信息</Text>
                <Text className={styles.rowDesc}>心语日记 v1.0.0</Text>
              </View>
            </View>
          </View>
          <View className={styles.row}>
            <View className={styles.rowLeft}>
              <Text className={styles.rowIcon}>❤️</Text>
              <View>
                <Text className={styles.rowLabel}>用户协议</Text>
              </View>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
          <View className={styles.row}>
            <View className={styles.rowLeft}>
              <Text className={styles.rowIcon}>🔒</Text>
              <View>
                <Text className={styles.rowLabel}>隐私政策</Text>
              </View>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <Button className={styles.saveBtn} onClick={handleSave}>
          保存设置
        </Button>
      </View>
    </ScrollView>
  );
};

export default SettingsPage;
