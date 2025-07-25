import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimers } from '../../context/TimerContext';
import { useTranslation } from '../../hooks/useTranslation';
import DigitColumn from './DigitColumn';
import { addNotification } from '../../utils/notificationManager';
import { FiPlay, FiPause, FiSquare } from 'react-icons/fi';

export default function TimerDisplay() {
  const { getActiveTimer, updateTimer, checkAndUpdateDefaultTimer } = useTimers();
  const { t } = useTranslation();
  const [timeValue, setTimeValue] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showDays, setShowDays] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // 使用 ref 跟踪最后计算的时间，避免不必要的重渲染
  const lastTimeRef = useRef({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const timerIdRef = useRef(null);
  const syncTimerRef = useRef(null); // 高频同步定时器
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0); // 记录已暂停的总时间
  const lastSecondRef = useRef(-1); // 记录上一次的秒数
  
  // 判断两个时间对象是否相等
  const areTimesEqual = (time1, time2) => {
    return time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds === time2.seconds;
  };

  // 自动对时系统 - 高精度时间同步
  const startTimeSyncSystem = () => {
    // 清除现有的定时器
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    
    // 只在页面可见时启动高频检测
    if (document.visibilityState !== 'visible') {
      return;
    }
    
    // 获取当前秒数作为基准
    const now = new Date();
    lastSecondRef.current = now.getSeconds();
    
    // 启动高频检测（每毫秒检测一次）
    syncTimerRef.current = setInterval(() => {
      // 检查页面可见性
      if (document.visibilityState !== 'visible') {
        clearInterval(syncTimerRef.current);
        clearInterval(timerIdRef.current);
        return;
      }
      
      const currentTime = new Date();
      const currentSecond = currentTime.getSeconds();
      
      // 检测秒数是否发生变化
      if (currentSecond !== lastSecondRef.current) {
        lastSecondRef.current = currentSecond;
        
        // 清除高频检测，因为我们已经同步到秒数变化了
        clearInterval(syncTimerRef.current);
        
        // 秒数变化时立即执行一次主进程
        const timer = getActiveTimer();
        if (timer) {
          calculateTime(timer);
        }
        
        // 设置循环间隔1000ms运行主进程
        timerIdRef.current = setInterval(() => {
          const activeTimer = getActiveTimer();
          if (activeTimer && document.visibilityState === 'visible') {
            calculateTime(activeTimer);
          }
        }, 1000);
      }
    }, 1);
  };
  
  // 统一的计时计算函数
  const calculateTime = (timer) => {
    // 当页面在后台时，可能会暂停
    if (document.visibilityState !== 'visible') {
      return;
    }
    
    switch (timer.type) {
      case 'stopwatch':
        calculateStopwatchTime(timer);
        break;
      case 'worldclock':
        calculateWorldClockTime(timer);
        break;
      default: // countdown
        calculateCountdownTime(timer);
        break;
    }
  };
  
  // 判断是否只有秒数变化（避免分钟数字不必要的重新渲染）
  const isOnlySecondsChanged = (time1, time2) => {
    return time1.days === time2.days && 
           time1.hours === time2.hours && 
           time1.minutes === time2.minutes && 
           time1.seconds !== time2.seconds;
  };
  
  // 计算倒计时剩余时间
  const calculateCountdownTime = (timer) => {
    const now = new Date();
    const targetDate = new Date(timer.targetDate);
    const difference = targetDate - now;
    
    if (difference <= 0) {
      // 倒计时结束
      if (!isFinished) {
        setIsFinished(true);
        setTimeValue({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        lastTimeRef.current = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        // 检查并更新过期的默认计时器
        if (checkAndUpdateDefaultTimer) {
          checkAndUpdateDefaultTimer();
        }
        
        // 当倒计时结束时发送通知
        try {
          console.log('倒计时结束，尝试发送通知:', timer.name);
          addNotification({
            id: timer.id,
            title: timer.name,
            targetTime: Date.now()
          }).catch(error => {
            console.error('发送倒计时结束通知失败:', error);
          });
        } catch (error) {
          console.error('发送倒计时结束通知失败:', error);
        }
      }
      return;
    }
    
    // 倒计时未结束
    if (isFinished) {
      setIsFinished(false);
    }
    
    // 计算天、时、分、秒
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
    
    const newTimeLeft = { days, hours, minutes, seconds };
    
    // 只有当时间真正变化时才更新状态
    if (!areTimesEqual(newTimeLeft, lastTimeRef.current)) {
      setTimeValue(newTimeLeft);
      lastTimeRef.current = newTimeLeft;
      setShowDays(days > 0);
    }
  };
  
  // 计算正计时经过时间
  const calculateStopwatchTime = (timer) => {
    const now = new Date();
    const startTime = new Date(timer.startTime);
    let elapsedMs = 0;
    
    if (timer.isRunning) {
      // 正在运行中
      elapsedMs = now - startTime - (timer.totalPausedTime || 0);
    } else if (timer.pausedAt) {
      // 已暂停，显示暂停时的时间
      const pausedAt = new Date(timer.pausedAt);
      elapsedMs = pausedAt - startTime - (timer.totalPausedTime || 0);
    } else {
      // 初始状态或已重置
      elapsedMs = 0;
    }
    
    elapsedMs = Math.max(0, elapsedMs); // 确保不为负数
    
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    const newTimeValue = { days, hours, minutes, seconds };
    
    // 智能更新：只有当时间确实变化时才更新状态
    // 对于正计时，我们特别处理避免不必要的重新渲染
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      // 如果只是秒数变化，我们延迟更新其他数字避免闪烁
      if (timer.type === 'stopwatch' && isOnlySecondsChanged(newTimeValue, lastTimeRef.current)) {
        // 只更新秒数
        setTimeValue(prev => ({ ...prev, seconds }));
      } else {
        // 全部更新
        setTimeValue(newTimeValue);
      }
      lastTimeRef.current = newTimeValue;
      setShowDays(days > 0);
    }
  };
  
  // 计算世界时钟时间
  const calculateWorldClockTime = (timer) => {
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timer.timezone}));
    
    const hours = timeInTimezone.getHours();
    const minutes = timeInTimezone.getMinutes();
    const seconds = timeInTimezone.getSeconds();
    
    const newTimeValue = { 
      days: 0, 
      hours: hours, 
      minutes: minutes, 
      seconds: seconds 
    };
    
    if (!areTimesEqual(newTimeValue, lastTimeRef.current)) {
      setTimeValue(newTimeValue);
      lastTimeRef.current = newTimeValue;
      setShowDays(false); // 世界时钟不显示天数
    }
  };
  
  // 主计时逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
    }
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }
    
    const timer = getActiveTimer();
    if (!timer) return;
    
    // 设置初始运行状态
    if (timer.type === 'stopwatch') {
      setIsRunning(timer.isRunning === true);
      pausedTimeRef.current = timer.totalPausedTime || 0;
    }
    
    // 步骤1：刚打开页面/切换计时器时，执行一次主进程
    calculateTime(timer);
    
    // 步骤2：然后开始高频检测
    startTimeSyncSystem();
    
    // 处理页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时，重新执行步骤1和2
        const activeTimer = getActiveTimer();
        if (activeTimer) {
          // 步骤1：执行一次主进程
          calculateTime(activeTimer);
          // 步骤2：开始高频检测
          startTimeSyncSystem();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(timerIdRef.current);
      clearInterval(syncTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getActiveTimer, isFinished, checkAndUpdateDefaultTimer, isRunning]);
  
  // 正计时控制函数
  const handleStopwatchControl = (action) => {
    const timer = getActiveTimer();
    if (!timer || timer.type !== 'stopwatch') return;
    
    const now = new Date();
    
    switch (action) {
      case 'play':
        if (timer.pausedAt) {
          // 从暂停状态恢复，计算已暂停的总时间
          const pausedDuration = now - new Date(timer.pausedAt);
          const newTotalPausedTime = (timer.totalPausedTime || 0) + pausedDuration;
          updateTimer(timer.id, {
            isRunning: true,
            pausedAt: null,
            totalPausedTime: newTotalPausedTime
          });
        } else {
          // 第一次开始
          updateTimer(timer.id, {
            isRunning: true,
            startTime: timer.startTime || now.toISOString(),
            pausedAt: null,
            totalPausedTime: timer.totalPausedTime || 0
          });
        }
        setIsRunning(true);
        break;
        
      case 'pause':
        updateTimer(timer.id, {
          isRunning: false,
          pausedAt: now.toISOString()
        });
        setIsRunning(false);
        break;
        
      case 'stop':
        updateTimer(timer.id, {
          isRunning: false,
          startTime: now.toISOString(),
          pausedAt: null,
          totalPausedTime: 0
        });
        setIsRunning(false);
        setTimeValue({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        lastTimeRef.current = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        break;
    }
  };
  
  // 格式化为两位数
  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };
  
  const activeTimer = getActiveTimer();
  
  if (!activeTimer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-400">{t('timer.noActiveTimer')}</p>
      </div>
    );
  }
  
  // 获取显示标题和描述
  const getTimerTitle = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return activeTimer.name;
      case 'worldclock':
        return activeTimer.name; // 直接使用用户设置的名称
      default:
        return activeTimer.name;
    }
  };
  
  const getTimerDescription = () => {
    switch (activeTimer.type) {
      case 'stopwatch':
        return isRunning ? t('timer.running') : t('timer.paused');
      case 'worldclock':
        return `${activeTimer.country} - ${activeTimer.timezone}`;
      default:
        return `${t('timer.target')}: ${new Date(activeTimer.targetDate).toLocaleString()}`;
    }
  };
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      key={activeTimer.id}
    >
      {/* 计时器名称 */}
      <motion.h2 
        className="text-xl sm:text-2xl md:text-3xl font-medium mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          color: activeTimer.color,
          transition: 'color 0.3s var(--transition-timing)'
        }}
      >
        {getTimerTitle()}
      </motion.h2>
      
      {/* 时间显示 */}
      <motion.div 
        className="flex items-center justify-center space-x-2 sm:space-x-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* 天数 - 仅在需要时显示 */}
        {showDays && (
          <>
            <DigitColumn 
              value={formatNumber(timeValue.days)} 
              label={t('time.days')}
              color={activeTimer.color || '#0ea5e9'}
            />
            <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400">:</span>
          </>
        )}
        
        {/* 小时 */}
        <DigitColumn 
          value={formatNumber(timeValue.hours)} 
          label={t('time.hours')}
          color={activeTimer.color || '#0ea5e9'}
        />
        <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400">:</span>
        
        {/* 分钟 */}
        <DigitColumn 
          value={formatNumber(timeValue.minutes)} 
          label={t('time.minutes')}
          color={activeTimer.color || '#0ea5e9'}
        />
        <span className="text-4xl sm:text-5xl md:text-6xl font-thin text-gray-400">:</span>
        
        {/* 秒 */}
        <DigitColumn 
          value={formatNumber(timeValue.seconds)} 
          label={t('time.seconds')}
          color={activeTimer.color || '#0ea5e9'}
        />
      </motion.div>
      
      {/* 正计时控制按钮 */}
      {activeTimer.type === 'stopwatch' && (
        <motion.div 
          className="mt-8 flex space-x-4 relative"
          style={{ 
            zIndex: 40,
            pointerEvents: 'auto'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => handleStopwatchControl(isRunning ? 'pause' : 'play')}
            className="glass-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
            style={{ 
              color: activeTimer.color,
              zIndex: 41,
              position: 'relative',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            {isRunning ? <FiPause className="text-xl pointer-events-none" /> : <FiPlay className="text-xl pointer-events-none" />}
          </button>
          <button
            onClick={() => handleStopwatchControl('stop')}
            className="glass-card p-4 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer select-none"
            style={{ 
              color: activeTimer.color,
              zIndex: 41,
              position: 'relative',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            <FiSquare className="text-xl pointer-events-none" />
          </button>
        </motion.div>
      )}
      
      {/* 倒计时结束提示 */}
      <AnimatePresence>
        {isFinished && activeTimer.type === 'countdown' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-8 glass-card px-6 py-4 rounded-xl"
          >
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {t('timer.finished')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 描述信息 */}
      <motion.p 
        className="mt-6 text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {getTimerDescription()}
      </motion.p>
    </motion.div>
  );
}
