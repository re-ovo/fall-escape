import { useState, useEffect } from 'react';

// 本地存储键名
const CUSTOM_LEVELS_KEY = 'custom-levels';

export const useCustomLevels = () => {
  const [customLevels, setCustomLevels] = useState<number[][][]>([]);

  // 初始化加载已保存的自定义关卡
  useEffect(() => {
    const savedLevels = localStorage.getItem(CUSTOM_LEVELS_KEY);
    if (savedLevels) {
      try {
        const parsedLevels = JSON.parse(savedLevels);
        setCustomLevels(parsedLevels);
      } catch (error) {
        console.error('无法解析已保存的关卡:', error);
        // 如果解析失败，重置localStorage
        localStorage.removeItem(CUSTOM_LEVELS_KEY);
      }
    }
  }, []);

  // 添加新关卡
  const addCustomLevel = (level: number[][]) => {
    const newCustomLevels = [...customLevels, level];
    setCustomLevels(newCustomLevels);
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(newCustomLevels));
    return newCustomLevels.length - 1; // 返回新关卡的索引
  };

  // 更新关卡
  const updateCustomLevel = (index: number, level: number[][]) => {
    if (index < 0 || index >= customLevels.length) {
      return false;
    }

    const newCustomLevels = [...customLevels];
    newCustomLevels[index] = level;
    setCustomLevels(newCustomLevels);
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(newCustomLevels));
    return true;
  };

  // 删除关卡
  const deleteCustomLevel = (index: number) => {
    if (index < 0 || index >= customLevels.length) {
      return false;
    }

    const newCustomLevels = customLevels.filter((_, i) => i !== index);
    setCustomLevels(newCustomLevels);
    localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(newCustomLevels));
    return true;
  };

  // 清空所有自定义关卡
  const clearCustomLevels = () => {
    setCustomLevels([]);
    localStorage.removeItem(CUSTOM_LEVELS_KEY);
  };

  return {
    customLevels,
    addCustomLevel,
    updateCustomLevel,
    deleteCustomLevel,
    clearCustomLevels
  };
}; 