import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, getYear, setYear } from 'date-fns';
import { getFromRemoteCache, saveToRemoteCache } from '../utils/syncService';
import { scheduleCountdownNotification, cancelCountdownNotification } from '../utils/notifications';
import { addNotification, removeNotification } from '../utils/notificationManager';
import solarlunar from 'solarlunar';

const TimerContext = createContext();

// 获取当前年份
const currentYear = new Date().getFullYear();

// 添加计算清明节日期的辅助函数
const getQingmingDate = (year) => {
  // 使用公式计算清明节日期（大致公式）
  const day = Math.floor((year - 2000) * 0.2422 + 4.81) - Math.floor((year - 2000) / 4);
  return new Date(Date.UTC(year, 3, day)); // 四月：月索引为3
};

// 生成固定日期的节日列表，考虑时区调整
const generateFixedHolidays = (year) => {
  // 获取用户时区偏移量（分钟）
  const userTimezoneOffsetMinutes = new Date().getTimezoneOffset();
  // UTC+0 时区和用户时区的差异小时数（注意符号相反）
  const userTimezoneOffsetHours = -userTimezoneOffsetMinutes / 60;
  
  // 创建时区补偿函数
  const createDateWithOffset = (monthIndex, day) => {
    // 创建UTC时间
    const date = new Date(Date.UTC(year, monthIndex, day));
    
    // 格式化为ISO字符串，保留T00:00:00Z的UTC标志
    return date.toISOString();
  };
  
  return [
    // 国际节日 - 日期固定
    { name: `${year}年元旦`, date: createDateWithOffset(0, 1), color: '#1890FF' },
    { name: `${year}年情人节`, date: createDateWithOffset(1, 14), color: '#EB2F96' },
    { name: `${year}年妇女节`, date: createDateWithOffset(2, 8), color: '#C71585' },
    { name: `${year}年植树节`, date: createDateWithOffset(2, 12), color: '#52C41A' },
    { name: `${year}年愚人节`, date: createDateWithOffset(3, 1), color: '#722ED1' },
    { name: `${year}年青年节`, date: createDateWithOffset(4, 4), color: '#722ED1' },
    { name: `${year}年劳动节`, date: createDateWithOffset(4, 1), color: '#FA8C16' },
    { name: `${year}年清明节`, date: getQingmingDate(year).toISOString(), color: '#228B22' },
    { name: `${year}年儿童节`, date: createDateWithOffset(5, 1), color: '#13C2C2' },
    { name: `${year}年建党节`, date: createDateWithOffset(6, 1), color: '#FF0000' },
    { name: `${year}年建军节`, date: createDateWithOffset(7, 1), color: '#CF1322' },
    { name: `${year}年教师节`, date: createDateWithOffset(8, 10), color: '#096DD9' },
    { name: `${year}年国庆节`, date: createDateWithOffset(9, 1), color: '#FF4D4F' },
    { name: `${year}年万圣节`, date: createDateWithOffset(9, 31), color: '#FF7A45' },
    { name: `${year}年平安夜`, date: createDateWithOffset(11, 24), color: '#36CFC9' },
    { name: `${year}年圣诞节`, date: createDateWithOffset(11, 25), color: '#F759AB' },
  ];
};

// 计算动态节日日期，也考虑时区
const calculateDynamicHolidays = (year) => {
  const holidays = [];
  
  // 获取用户时区的偏移量
  const userTimezoneOffsetMinutes = new Date().getTimezoneOffset();
  const userTimezoneOffsetHours = -userTimezoneOffsetMinutes / 60;
  
  // 创建ISO格式的UTC日期字符串
  const createISODate = (date) => {
    return date.toISOString();
  };
  
  // 母亲节 - 5月第二个星期日
  const firstDayOfMay = new Date(Date.UTC(year, 4, 1));
  const motherDayDay = firstDayOfMay.getUTCDay(); // 获取星期几
  const daysUntilSecondSunday = (7 - motherDayDay) % 7 + 7; // 到第二个星期日的天数
  const motherDayDate = new Date(Date.UTC(year, 4, 1 + daysUntilSecondSunday)); 
  holidays.push({
    name: `${year}年母亲节`,
    date: createISODate(motherDayDate),
    color: '#F759AB'
  });
  
  // 父亲节 - 6月第三个星期日
  const firstDayOfJune = new Date(Date.UTC(year, 5, 1));
  const fatherDayDay = firstDayOfJune.getUTCDay(); // 获取星期几
  const daysUntilThirdSunday = (7 - fatherDayDay) % 7 + 14; // 到第三个星期日的天数
  const fatherDayDate = new Date(Date.UTC(year, 5, 1 + daysUntilThirdSunday)); 
  holidays.push({
    name: `${year}年父亲节`,
    date: createISODate(fatherDayDate),
    color: '#1890FF'
  });
  
  // 感恩节 - 11月第四个星期四
  const firstDayOfNovember = new Date(Date.UTC(year, 10, 1));
  const thanksgivingDayDay = firstDayOfNovember.getUTCDay(); // 获取星期几
  const daysToThursday = (4 + 7 - thanksgivingDayDay) % 7; // 到第一个星期四的天数
  const thanksgivingDayDate = new Date(Date.UTC(year, 10, 1 + daysToThursday + 21)); // 加21天到第四个星期四
  holidays.push({
    name: `${year}年感恩节`,
    date: createISODate(thanksgivingDayDate),
    color: '#FAAD14'
  });
  
  return holidays;
};

// 添加农历节日转换函数
const getChineseFestivals = (year) => {
  const lunarHolidays = [];
  const holidaysMapping = [
    { name: `${year}年春节`, lunarMonth: 1, lunarDay: 1, color: '#FF0000' },
    { name: `${year}年元宵节`, lunarMonth: 1, lunarDay: 15, color: '#FF6347' },
    { name: `${year}年端午节`, lunarMonth: 5, lunarDay: 5, color: '#32CD32' },
    { name: `${year}年七夕节`, lunarMonth: 7, lunarDay: 7, color: '#FF1493' },
    { name: `${year}年中元节`, lunarMonth: 7, lunarDay: 15, color: '#708090' },
    { name: `${year}年中秋节`, lunarMonth: 8, lunarDay: 15, color: '#FFA500' },
    { name: `${year}年重阳节`, lunarMonth: 9, lunarDay: 9, color: '#800080' },
    { name: `${year}年腊八节`, lunarMonth: 12, lunarDay: 8, color: '#8B4513' },
  ];
  
  holidaysMapping.forEach(holiday => {
    // 使用 solarlunar 将农历日期转换为公历日期
    const solarDate = solarlunar.lunar2solar(year, holiday.lunarMonth, holiday.lunarDay, false);
    // 构造 ISO 格式日期字符串，注意月-1
    const date = new Date(Date.UTC(solarDate.cYear, solarDate.cMonth - 1, solarDate.cDay)).toISOString();
    lunarHolidays.push({
      name: holiday.name,
      date: date,
      color: holiday.color
    });
  });
  
  return lunarHolidays;
};

// 寻找下一个即将到来的节日
const findNextHoliday = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  
  // 获取当前年和下一年的所有节日
  const allHolidays = [
    ...generateFixedHolidays(currentYear),
    ...calculateDynamicHolidays(currentYear),
    ...getChineseFestivals(currentYear),
    ...generateFixedHolidays(nextYear),
    ...calculateDynamicHolidays(nextYear),
    ...getChineseFestivals(nextYear)
  ];
  
  // 过滤出未来的节日并按日期排序
  const futureHolidays = allHolidays
    .filter(holiday => new Date(holiday.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // 返回最近的下一个节日
  return futureHolidays[0];
};

// 获取默认计时器
const getDefaultTimer = () => {
  const nextHoliday = findNextHoliday();
  
  return {
    id: 'default',
    name: nextHoliday.name,
    targetDate: nextHoliday.date,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: nextHoliday.color,
    createdAt: new Date().toISOString(),
    isAutoGenerated: true // 添加标记，表示这是系统自动生成的计时器
  };
};

// 获取节假日列表
const getHolidaysList = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  
  // 获取当前年和下一年的所有节日
  const allHolidays = [
    ...generateFixedHolidays(currentYear),
    ...calculateDynamicHolidays(currentYear),
    ...getChineseFestivals(currentYear),
    ...generateFixedHolidays(nextYear),
    ...calculateDynamicHolidays(nextYear),
    ...getChineseFestivals(nextYear)
  ];
  
  // 过滤出未来的节日并按日期排序
  return allHolidays
    .filter(holiday => new Date(holiday.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export function TimerProvider({ children }) {
  const [timers, setTimers] = useState([]);
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [holidaysList, setHolidaysList] = useState([]);

  // 初始化节假日列表
  useEffect(() => {
    setHolidaysList(getHolidaysList());
  }, []);

  // 从localStorage加载计时器
  useEffect(() => {
    const loadedTimers = JSON.parse(localStorage.getItem('timers') || '[]');
    
    // 如果没有计时器，添加默认计时器
    if (loadedTimers.length === 0) {
      const defaultTimer = getDefaultTimer();
      setTimers([defaultTimer]);
      setActiveTimerId(defaultTimer.id);
    } else {
      setTimers(loadedTimers);
      setActiveTimerId(loadedTimers[0].id);
    }
    
    setIsLoaded(true);
    console.log(`已加载${loadedTimers.length || 1}个计时器 - ${new Date().toLocaleString()}`);
    
    // 检查是否需要从远程同步数据
    const syncData = async () => {
      const syncId = localStorage.getItem('timepulse_sync_id');
      const syncPass = localStorage.getItem('timepulse_sync_password');
      
      if (syncId && syncPass) {
        try {
          setIsSyncing(true);
          const remoteData = await getFromRemoteCache(syncId, syncPass);
          
          if (remoteData && remoteData.timers && remoteData.timers.length > 0) {
            // 使用远程数据更新计时器
            setTimers(remoteData.timers);
            setActiveTimerId(remoteData.timers[0].id);
            localStorage.setItem('timers', JSON.stringify(remoteData.timers));
            console.log(`已从远程同步 ${remoteData.timers.length} 个计时器 - ${new Date().toLocaleString()}`);
          }
        } catch (error) {
          console.error('从远程同步数据失败:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    
    syncData();
  }, []);

  // 保存到localStorage
  useEffect(() => {
    if (isLoaded && timers.length > 0) {
      localStorage.setItem('timers', JSON.stringify(timers));
      console.log(`已保存${timers.length}个计时器到本地 - ${new Date().toLocaleString()}`);
      
      // 如果有同步ID和密码，也保存到远程
      const syncId = localStorage.getItem('timepulse_sync_id');
      const syncPass = localStorage.getItem('timepulse_sync_password');
      
      if (syncId && syncPass && !isSyncing) {
        // 防抖：只在用户停止操作500ms后再同步到云端
        const syncToRemote = setTimeout(() => {
          saveToRemoteCache(syncId, syncPass, { timers }, 30 * 24 * 60 * 60 * 1000)
            .then(() => console.log(`已自动同步${timers.length}个计时器到云端 - ${new Date().toLocaleString()}`))
            .catch(err => console.error('自动同步到云端失败:', err));
        }, 500);
        
        return () => clearTimeout(syncToRemote);
      }
    }
  }, [timers, isLoaded, isSyncing]);

  // 检查并更新过期的默认计时器
  const checkAndUpdateDefaultTimer = () => {
    const defaultTimer = timers.find(timer => timer.isAutoGenerated === true);
    if (defaultTimer) {
      const now = new Date();
      const targetDate = new Date(defaultTimer.targetDate);
      
      // 如果默认计时器已过期
      if (targetDate <= now) {
        // 删除旧的默认计时器
        const newTimers = timers.filter(timer => timer.id !== defaultTimer.id);
        
        // 添加新的默认计时器
        const newDefaultTimer = getDefaultTimer();
        
        // 更新计时器列表
        setTimers([newDefaultTimer, ...newTimers]);
        
        // 如果当前活动的是过期的默认计时器，则切换到新的默认计时器
        if (activeTimerId === defaultTimer.id) {
          setActiveTimerId(newDefaultTimer.id);
        }
        
        console.log(`默认计时器 ${defaultTimer.name} 已过期，已替换为 ${newDefaultTimer.name} - ${new Date().toLocaleString()}`);
      }
    }
  };

  // 添加一个Effect，定期检查默认计时器
  useEffect(() => {
    // 仅在已加载完成且有计时器时执行
    if (isLoaded && timers.length > 0) {
      // 每分钟检查一次
      const intervalId = setInterval(checkAndUpdateDefaultTimer, 60 * 1000);
      
      // 先立即执行一次检查
      checkAndUpdateDefaultTimer();
      
      return () => clearInterval(intervalId);
    }
  }, [timers, isLoaded, activeTimerId]);

  // 添加计时器
  const addTimer = (timerData) => {
    const newTimer = {
      ...timerData,
      id: timerData.id || uuidv4(),
      createdAt: timerData.createdAt || new Date().toISOString(),
      // 只有明确传入isAutoGenerated=true时才保留，否则设为false
      isAutoGenerated: timerData.isAutoGenerated === true ? true : false,
      // 如果没有指定类型，默认为倒计时
      type: timerData.type || 'countdown'
    };
    
    setTimers(prev => {
      // 检查是否已存在相同ID的计时器
      const exists = prev.some(t => t.id === newTimer.id);
      if (exists) {
        return prev.map(t => t.id === newTimer.id ? newTimer : t);
      } else {
        return [...prev, newTimer];
      }
    });
    
    setActiveTimerId(newTimer.id);
    console.log(`已添加计时器: ${newTimer.name} (${newTimer.type || 'countdown'}) - ${new Date().toLocaleString()}`);
    
    // 只为倒计时类型设置通知（异步处理，不阻塞UI）
    if (newTimer.type === 'countdown' || !newTimer.type) {
      addNotification({
        id: newTimer.id,
        title: newTimer.name,
        targetTime: new Date(newTimer.targetDate).getTime()
      }).catch(error => {
        console.log('设置通知失败:', error);
      });
    }
    
    return newTimer.id;
  };

  // 删除计时器
  const deleteTimer = (id) => {
    // 取消该计时器的通知
    removeNotification(id);
    
    setTimers(prev => {
      const newTimers = prev.filter(timer => timer.id !== id);
      
      // 如果删除的是当前活动计时器，切换到第一个计时器
      if (id === activeTimerId && newTimers.length > 0) {
        setActiveTimerId(newTimers[0].id);
      } else if (newTimers.length === 0) {
        // 如果删除后没有计时器，添加默认计时器
        const defaultTimer = getDefaultTimer();
        setTimers([defaultTimer]);
        setActiveTimerId(defaultTimer.id);
        return [defaultTimer];
      }
      
      return newTimers;
    });
    
    console.log(`已删除计时器ID: ${id} - ${new Date().toLocaleString()}`);
  };

  // 更新计时器
  const updateTimer = (id, updatedData) => {
    setTimers(prev => {
      const newTimers = prev.map(timer => 
        timer.id === id ? { ...timer, ...updatedData } : timer
      );
      
      // 获取更新后的计时器对象
      const updatedTimer = newTimers.find(t => t.id === id);
      
      // 只为倒计时更新通知（异步处理，不阻塞UI）
      if (updatedTimer && (updatedTimer.type === 'countdown' || !updatedTimer.type)) {
        addNotification({
          id: updatedTimer.id,
          title: updatedTimer.name,
          targetTime: new Date(updatedTimer.targetDate).getTime()
        }).catch(error => {
          console.log('更新通知失败:', error);
        });
      }
      
      return newTimers;
    });
    
    console.log(`已更新计时器ID: ${id} - ${new Date().toLocaleString()}`);
  };

  // 获取活动计时器
  const getActiveTimer = () => {
    return timers.find(timer => timer.id === activeTimerId) || null;
  };

  return (
    <TimerContext.Provider value={{
      timers,
      activeTimerId,
      setActiveTimerId,
      addTimer,
      deleteTimer,
      updateTimer,
      getActiveTimer,
      holidaysList,
      checkAndUpdateDefaultTimer // 将函数暴露给外部组件，以便在需要时手动触发检查
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimers() {
  return useContext(TimerContext);
}
