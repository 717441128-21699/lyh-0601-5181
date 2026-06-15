import Taro from '@tarojs/taro';

const PREFIX = 'emotion_diary_';

export const setStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (err) {
    console.error('[Storage] setStorage error:', err);
  }
};

export const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(`${PREFIX}${key}`);
    if (data) return JSON.parse(data);
    return defaultValue;
  } catch (err) {
    console.error('[Storage] getStorage error:', err);
    return defaultValue;
  }
};

export const removeStorage = (key: string): void => {
  try {
    Taro.removeStorageSync(`${PREFIX}${key}`);
  } catch (err) {
    console.error('[Storage] removeStorage error:', err);
  }
};
