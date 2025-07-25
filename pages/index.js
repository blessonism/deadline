import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import GradientBackground from '../components/Background/GradientBackground';
import CountdownDisplay from '../components/Countdown/CountdownDisplay';
import TimerDisplay from '../components/Countdown/TimerDisplay';
import AddTimerModal from '../components/UI/AddTimerModal';
import AddStopwatchModal from '../components/UI/AddStopwatchModal';
import AddWorldClockModal from '../components/UI/AddWorldClockModal';
import TimerTypeModal from '../components/UI/TimerTypeModal';
import ShareModal from '../components/UI/ShareModal';
import LoginModal from '../components/UI/LoginModal';
import { useTimers } from '../context/TimerContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { FaShareAlt } from 'react-icons/fa';
import { parseShareUrl } from '../utils/shareUtils';

export default function Home() {
  const { timers, activeTimerId, setActiveTimerId, addTimer } = useTimers();
  const { theme, accentColor } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTimerTypeModalOpen, setIsTimerTypeModalOpen] = useState(false);
  const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(false);
  const [isStopwatchModalOpen, setIsStopwatchModalOpen] = useState(false);
  const [isWorldClockModalOpen, setIsWorldClockModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [log, setLog] = useState([]);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  
  // 监听滚动事件，检测是否接近底部（与Layout中的逻辑保持一致）
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 与Layout中相同的逻辑：当滚动接近底部时隐藏按钮（调整为更早触发）
      const isNearBottom = scrollPosition + windowHeight >= documentHeight - 300;
      setIsFooterVisible(isNearBottom);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // 添加日志
  const addLog = (message) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 处理计时器类型选择
  const handleTimerTypeSelect = (type) => {
    setIsTimerTypeModalOpen(false);
    
    switch (type) {
      case 'countdown':
        setIsCountdownModalOpen(true);
        break;
      case 'stopwatch':
        setIsStopwatchModalOpen(true);
        break;
      case 'worldclock':
        setIsWorldClockModalOpen(true);
        break;
    }
  };

  // 关闭所有模态框
  const closeAllModals = () => {
    setIsTimerTypeModalOpen(false);
    setIsCountdownModalOpen(false);
    setIsStopwatchModalOpen(false);
    setIsWorldClockModalOpen(false);
    setIsAddModalOpen(false);
    
    // 清除可能的hash
    if (['#add', '#worldclock', '#countdown', '#stopwatch'].includes(window.location.hash)) {
      window.history.replaceState(null, document.title, window.location.pathname);
    }
  };

  // 处理全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        addLog(`错误: 无法进入全屏模式: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // 监听URL参数以同步数据
  useEffect(() => {
    if (router.query.share) {
      try {
        const sharedData = parseShareUrl(router.query.share);
        if (sharedData.timers && sharedData.timers.length > 0) {
          sharedData.timers.forEach(timer => {
            addTimer(timer);
          });
          setActiveTimerId(sharedData.timers[0].id);
          addLog('已从分享链接导入计时器数据');
        }
      } catch (error) {
        addLog(`解析分享数据错误: ${error.message}`);
      }
    }
  }, [router.query.share, addTimer, setActiveTimerId]);

  // 初始化日志
  useEffect(() => {
    addLog('TimePulse 初始化完成');
    addLog(`当前主题: ${theme}`);
    addLog(`加载了 ${timers.length} 个计时器`);
  }, [theme, timers.length]);

  // 监听URL hash变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      console.log(`Hash变更: ${hash}`);
      
      // 处理从Header组件跳转来的创建请求
      if (hash === 'worldclock') {
        setIsWorldClockModalOpen(true);
      }
      if (hash === 'add') {
        setIsTimerTypeModalOpen(true);
      }
      if (hash === 'countdown') {
        setIsCountdownModalOpen(true);
      }
      if (hash === 'stopwatch') {
        setIsStopwatchModalOpen(true);
      }
    };
    
    // 初始执行一次
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <>
      <Layout>
        <GradientBackground />
        
        <main className="relative flex flex-col items-center justify-center min-h-screen py-12 z-10">
          <TimerDisplay />
        </main>
      </Layout>
      
      {/* 将按钮移到Layout组件外部，确保它们总是在最上层 */}
      {/* 分享按钮 - 保持使用动态主题色，在Footer显示时隐藏 */}
      <motion.div 
        className="fixed bottom-6 left-6" 
        style={{ zIndex: 50 }}
        animate={{ 
          opacity: isFooterVisible ? 0 : 1,
          scale: isFooterVisible ? 0.8 : 1,
          pointerEvents: isFooterVisible ? 'none' : 'auto'
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 rounded-full glass-card shadow-lg cursor-pointer"
          style={{ color: accentColor }}
          onClick={() => {
            setIsShareModalOpen(true);
            if (window.location.hash !== '#share') {
              window.location.hash = 'share';
            }
          }}
          data-umami-event={t('timer.share')}
        >
          <FaShareAlt className="text-xl" />
        </motion.button>
      </motion.div>
      
      {/* 弹窗内容 */}
      <AnimatePresence>
        {isTimerTypeModalOpen && (
          <TimerTypeModal 
            onClose={closeAllModals}
            onSelectType={handleTimerTypeSelect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCountdownModalOpen && (
          <AddTimerModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStopwatchModalOpen && (
          <AddStopwatchModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isWorldClockModalOpen && (
          <AddWorldClockModal onClose={closeAllModals} />
        )}
      </AnimatePresence>

      {/* 保持原有的旧版兼容 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddTimerModal onClose={() => {
            setIsAddModalOpen(false);
            if (window.location.hash === '#add') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
      
      {/* 分享弹窗 */}
      <AnimatePresence>
        {isShareModalOpen && (
          <ShareModal onClose={() => {
            setIsShareModalOpen(false);
            if (window.location.hash === '#share') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
      
      {/* 登录弹窗 */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <LoginModal onClose={() => {
            setIsLoginModalOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>
    </>
  );
}
