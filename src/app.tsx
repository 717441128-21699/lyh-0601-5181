import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useDiaryStore } from '@/store/useDiaryStore';

function App(props) {
  useEffect(() => {
    console.log('[App] 启动，初始化提醒调度');
    useDiaryStore.getState().scheduleNextReminder();
  }, []);

  useDidShow(() => {
    console.log('[App] 显示，检查提醒状态');
    const reminder = useDiaryStore.getState().reminder;
    if (reminder.enabled) {
      useDiaryStore.getState().scheduleNextReminder();
    }
  });

  useDidHide(() => {
    console.log('[App] 隐藏');
  });

  return props.children;
}

export default App;
