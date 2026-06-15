import React from 'react';
import { View, Text, ScrollView, Button, Switch, Picker, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useDiaryStore } from '@/store/useDiaryStore';

const SettingsPage: React.FC = () => {
  const reminder = useDiaryStore(state => state.reminder);
  const setReminders = useDiaryStore(state => state.setReminders);
  const addReminder = useDiaryStore(state => state.addReminder);
  const updateReminder = useDiaryStore(state => state.updateReminder);
  const removeReminder = useDiaryStore(state => state.removeReminder);
  const isAdmin = useDiaryStore(state => state.appState.isAdmin);
  const toggleAdminMode = useDiaryStore(state => state.toggleAdminMode);
  const getPendingReports = useDiaryStore(state => state.getPendingReports);

  const handleAddReminder = () => {
    addReminder({
      id: Date.now().toString(),
      enabled: true,
      time: '08:00',
      label: '新提醒'
    });
  };

  const handleSave = () => {
    setReminders({ items: reminder.items });
    Taro.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500
    });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  const handleAdminToggle = () => {
    if (!isAdmin) {
      Taro.showActionSheet({
        itemList: ['输入管理员密码'],
        success: () => {
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
        }
      });
    } else {
      toggleAdminMode();
      Taro.showToast({ title: '已退出管理员模式', icon: 'none' });
    }
  };

  const handleReview = () => {
    Taro.navigateTo({ url: '/pages/admin-review/index' });
  };

  const pendingCount = getPendingReports().length;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>每日提醒</Text>
        <View className={styles.card}>
          {reminder.items.map((item) => (
            <View key={item.id} className={styles.reminderItem}>
              <View className={styles.reminderRow}>
                <View className={styles.reminderLeft}>
                  <Switch
                    checked={item.enabled}
                    onChange={(e) => updateReminder(item.id, { enabled: e.detail.value })}
                    color="#FF9B7B"
                  />
                  <Picker mode="time" value={item.time} onChange={(e) => updateReminder(item.id, { time: e.detail.value })}>
                    <View className={styles.timePicker}>
                      <Text className={styles.timeText}>{item.time}</Text>
                      <Text className={styles.arrow}>›</Text>
                    </View>
                  </Picker>
                </View>
                <View className={styles.deleteBtn} onClick={() => removeReminder(item.id)}>
                  <Text className={styles.deleteText}>删除</Text>
                </View>
              </View>
              <Input
                className={styles.labelInput}
                value={item.label}
                placeholder="提醒标签"
                onInput={(e) => updateReminder(item.id, { label: e.detail.value })}
              />
            </View>
          ))}

          <View className={styles.addBtn} onClick={handleAddReminder}>
            <Text className={styles.addBtnText}>+ 添加提醒</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>管理员</Text>
        <View className={styles.card}>
          <View className={styles.row} onClick={handleAdminToggle}>
            <View className={styles.rowLeft}>
              <Text className={styles.rowIcon}>🔐</Text>
              <View>
                <Text className={styles.rowLabel}>管理员模式</Text>
                <Text className={styles.rowDesc}>{isAdmin ? '已开启' : '点击开启'}</Text>
              </View>
            </View>
            <Switch
              checked={isAdmin}
              onChange={() => {}}
              color="#FF9B7B"
              disabled
            />
          </View>
          {isAdmin && (
            <View className={styles.row} onClick={handleReview}>
              <View className={styles.rowLeft}>
                <Text className={styles.rowIcon}>📋</Text>
                <View>
                  <Text className={styles.rowLabel}>审核举报内容</Text>
                  <Text className={styles.rowDesc}>{pendingCount > 0 ? `${pendingCount} 条待审核` : '暂无待审核'}</Text>
                </View>
              </View>
              <Text className={styles.arrow}>›</Text>
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
