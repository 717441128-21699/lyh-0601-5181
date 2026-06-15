import React, { useEffect } from 'react';
import { useDidShow } from '@tarojs/taro';
import './app.scss';
import { useDiaryStore } from '@/store/useDiaryStore';

function App(props) {
  useEffect(() => {
    console.log('[App] 启动，初始化提醒调度');
    useDiaryStore.getState().scheduleAllReminders();
  }, []);

  useDidShow(() => {
    console.log('[App] 显示，恢复提醒调度');
    useDiaryStore.getState().scheduleAllReminders();
  });

  return props.children;
}

export default App;
