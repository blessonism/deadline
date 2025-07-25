import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiSettings, FiMoon, FiSun, FiUser, FiMaximize, FiMinimize, FiEdit, FiSave, FiGlobe, FiPlus } from 'react-icons/fi';
import { useTimers } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import LoginModal from '../UI/LoginModal';
import TimerTypeModal from '../UI/TimerTypeModal';
import { HexColorPicker } from 'react-colorful';

export default function Header() {
  const { timers, activeTimerId, setActiveTimerId, deleteTimer, updateTimer, addTimer } = useTimers();
  const { theme, toggleTheme, accentColor } = useTheme();
  const { t, changeLanguage, currentLang } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingTimer, setEditingTimer] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isTimerTypeModalOpen, setIsTimerTypeModalOpen] = useState(false);
  const [timerBarHovered, setTimerBarHovered] = useState(false);

  // 打开登录模态框
  const openLoginModal = () => {
    setIsLoginOpen(true);
    if (window.location.hash !== '#login') {
      window.location.hash = 'login';
    }
  };

  // 处理计时器类型选择
  const handleTimerTypeSelect = (type) => {
    setIsTimerTypeModalOpen(false);
    
    // 根据类型创建不同的计时器模板，或重定向到原有组件
    switch (type) {
      case 'countdown':
        // 设置为编辑倒计时 - 使用类似AddTimerModal的默认值，确保日期格式正确
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        setEditingTimer({
          id: 'new',
          name: '',
          type: 'countdown',
          color: '#0ea5e9',
          targetDate: tomorrow.toISOString().slice(0, 10),
          targetTime: '00:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        setIsManageOpen(true);
        break;
      case 'stopwatch':
        // 设置为编辑秒表
        setEditingTimer({
          id: 'new',
          name: '',
          type: 'stopwatch',
          color: '#10B981',
          isLimitedEdit: true
        });
        setIsManageOpen(true);
        break;
      case 'worldclock':
        // 使用hash跳转到worldclock创建页，让主页面的逻辑处理它
        if (window.location.hash !== '#worldclock') {
          window.location.hash = 'worldclock';
        }
        break;
    }
  };

  // 处理全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`错误: 无法进入全屏模式: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // 处理语言切换
  const switchLanguage = (lang) => {
    changeLanguage(lang);
    setIsLanguageOpen(false);
  };

  // 开始编辑计时器
  const startEditTimer = (timer) => {
    if (timer.type === 'countdown' || !timer.type) {
      // 倒计时可以编辑所有属性
      setEditingTimer({
        ...timer,
        targetDate: new Date(timer.targetDate).toISOString().substring(0, 10),
        targetTime: new Date(timer.targetDate).toTimeString().substring(0, 5)
      });
    } else {
      // 正计时和世界时钟只能编辑名字和颜色
      setEditingTimer({
        ...timer,
        isLimitedEdit: true // 标记为限制编辑模式
      });
    }
  };

  // 保存编辑的计时器
  const saveEditedTimer = () => {
    if (!editingTimer) return;
    
    // 处理新增计时器
    if (editingTimer.id === 'new') {
      try {
        let timerData;
        
        if (editingTimer.type === 'countdown') {
          // 创建有效的日期对象
          const targetDateObj = new Date(`${editingTimer.targetDate}T${editingTimer.targetTime || '00:00'}`);
          
          // 检查日期是否有效
          if (isNaN(targetDateObj.getTime())) {
            console.error('无效的日期:', editingTimer.targetDate, editingTimer.targetTime);
            return;
          }
          
          timerData = {
            name: editingTimer.name || '新计时器',
            targetDate: targetDateObj.toISOString(),
            color: editingTimer.color,
            type: 'countdown',
            timezone: editingTimer.timezone
          };
        } else if (editingTimer.type === 'stopwatch') {
          timerData = {
            name: editingTimer.name || '新秒表',
            color: editingTimer.color,
            type: 'stopwatch',
            startTime: null,
            pausedTime: 0,
            isRunning: false
          };
        }
        // worldclock类型已经移除，由专门组件处理
        
        // 调用addTimer函数添加新计时器
        addTimer(timerData);
        setEditingTimer(null);
        setShowColorPicker(false);
        setIsManageOpen(false);
      } catch (error) {
        console.error('创建计时器错误:', error);
      }
      return;
    }
    
    // 处理现有计时器的编辑
    if (editingTimer.isLimitedEdit) {
      // 限制编辑模式：只更新名字和颜色
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        color: editingTimer.color
      });
    } else {
      // 完整编辑模式：更新所有属性（倒计时）
      const targetDateObj = new Date(`${editingTimer.targetDate}T${editingTimer.targetTime}`);
      
      updateTimer(editingTimer.id, {
        name: editingTimer.name,
        targetDate: targetDateObj.toISOString(),
        color: editingTimer.color
      });
    }
    
    setEditingTimer(null);
    setShowColorPicker(false);
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 获取当前活动计时器
  const activeTimer = timers.find(timer => timer.id === activeTimerId) || null;

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <nav className="glass-card mx-4 mt-4 px-6 py-4 flex md:grid md:grid-cols-3 items-center justify-between">
        {/* Logo - 增强渐变效果，使用较深的相似色 */}
        <motion.div 
          className="flex items-center justify-start"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 
            className="text-xl md:text-2xl font-bold font-display bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(45deg, ${accentColor}, ${accentColor}66)` 
            }}
          >
            <a href="https://timepulse.ravelloh.top/">TimePulse</a>
          </h1>
        </motion.div>

        {/* 计时器选择器 - 桌面版 - 居中显示 */}
        <div 
          className="hidden md:flex justify-center relative"
          onMouseEnter={() => setTimerBarHovered(true)}
          onMouseLeave={() => setTimerBarHovered(false)}
        >
          {/* 使用更简单、更高效的方式实现标签显示/隐藏 */}
          <div 
            className={`flex py-2 scrollbar-hide transition-transform duration-300 ease-out`}
            style={{ 
              maxWidth: '60vw',
              overflowX: timerBarHovered ? 'auto' : 'visible'
            }}
          >
            {/* 简化动画，使用硬件加速，提高性能 */}
            {timers.map((timer) => (
              <motion.button
                key={timer.id}
                className={`mx-1 px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transform-gpu transition-all duration-300 ${
                  activeTimerId === timer.id 
                    ? 'text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={{
                  backgroundColor: activeTimerId === timer.id ? (timer.color || '#0ea5e9') : undefined,
                  opacity: timer.id === activeTimerId || timerBarHovered ? 1 : 0,
                  transform: timer.id === activeTimerId || timerBarHovered 
                    ? 'scale(1) translateX(0)' 
                    : 'scale(0.8) translateX(-10px)',
                  maxWidth: timer.id === activeTimerId || timerBarHovered ? '200px' : '0px',
                  overflow: 'hidden',
                  margin: timer.id === activeTimerId || timerBarHovered ? '0 4px' : '0',
                  padding: timer.id === activeTimerId || timerBarHovered ? '0.25rem 0.75rem' : '0.25rem 0',
                  pointerEvents: timer.id === activeTimerId || timerBarHovered ? 'auto' : 'none',
                  // 添加过渡属性
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, max-width 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out'
                }}
                onClick={() => setActiveTimerId(timer.id)}
                data-umami-event="切换计时器"
              >
                {timer.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 右侧按钮组 */}
        <div className="flex items-center justify-end">
          {/* 桌面端所有按钮 */}
          <div className="hidden md:flex items-center">
            {/* 全屏按钮 */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleFullscreen}
              data-umami-event={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
            >
              {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
            </button>
            
            {/* 添加计时器按钮 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsTimerTypeModalOpen(true);
              }}
              data-umami-event={t('header.addTimer')}
            >
              <FiPlus className="text-xl" />
            </button>
            
            {/* 登录按钮 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={openLoginModal}
              data-umami-event={t('header.login')}
            >
              <FiUser className="text-xl" />
            </button>
            
            {/* 主题切换 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={toggleTheme}
              data-umami-event={t('header.themeToggle')}
            >
              {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
            </button>

            {/* 语言切换 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsLanguageOpen(true)}
              data-umami-event={t('header.languageSelect')}
            >
              <FiGlobe className="text-xl" />
            </button>

            {/* 设置按钮 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                setIsManageOpen(true);
                if (window.location.hash !== '#manage') {
                  window.location.hash = 'manage';
                }
              }}
              data-umami-event={t('header.manage')}
            >
              <FiSettings className="text-xl" />
            </button>
          </div>

          {/* 移动端只显示登录和菜单按钮 */}
          <div className="flex items-center md:hidden">
            {/* 移动端登录按钮 */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={openLoginModal}
              data-umami-event={t('header.login')}
            >
              <FiUser className="text-xl" />
            </button>

            {/* 移动端菜单按钮 */}
            <button
              className="p-2 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-umami-event={t('header.menu')}
            >
              {isMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端下拉菜单 - 同样使用计时器的颜色和动画效果 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card mx-4 mt-2 p-4 md:hidden max-h-[70vh] overflow-y-auto"
          >
            {/* 功能按钮区域 - 分两行，每行两个，放在上面 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('header.functions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 第一行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleFullscreen();
                    setIsMenuOpen(false);
                  }}
                  data-umami-event={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
                >
                  {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  data-umami-event={t('header.themeToggle')}
                >
                  {theme === 'dark' ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.themeToggle')}</span>
                </button>

                {/* 添加计时器按钮 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsTimerTypeModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  data-umami-event={t('timer.create')}
                >
                  <FiPlus className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('timer.create')}</span>
                </button>

                {/* 第二行 */}
                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsLanguageOpen(true);
                    setIsMenuOpen(false);
                  }}
                  data-umami-event={t('header.languageSelect')}
                >
                  <FiGlobe className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.language')}</span>
                </button>

                <button
                  className="flex items-center justify-between p-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20 cursor-pointer transition-colors"
                  onClick={() => {
                    setIsManageOpen(true);
                    setIsMenuOpen(false);
                    if (window.location.hash !== '#manage') {
                      window.location.hash = 'manage';
                    }
                  }}
                  data-umami-event={t('header.manage')}
                >
                  <FiSettings className="text-xl" />
                  <span className="text-xs ml-2 flex-1 text-right">{t('header.settings')}</span>
                </button>
              </div>
            </div>

            {/* 计时器选择区域 - 只有有滚动条时才显示，放在下面 */}
            {timers.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('header.timers')}</h3>
                <div className="flex flex-col space-y-2 max-h-48 overflow-y-auto">
                  {timers.map(timer => (
                    <motion.button
                      key={timer.id}
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`px-4 py-2 rounded-md text-left ${
                        activeTimerId === timer.id 
                          ? 'text-white' 
                          : 'bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-black/20'
                      }`}
                      style={
                        activeTimerId === timer.id 
                          ? { backgroundColor: timer.color || '#0ea5e9' } 
                          : {}
                      }
                      onClick={() => {
                        setActiveTimerId(timer.id);
                        setIsMenuOpen(false);
                      }}
                      data-umami-event="移动端切换计时器"
                    >
                      {timer.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理计时器弹窗 */}
      <AnimatePresence>
        {isManageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-4"
            onClick={() => {
              setIsManageOpen(false);
              setEditingTimer(null);
              if (window.location.hash === '#manage') {
                window.location.hash = '';
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('header.manage')}</h2>
                <button
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    setIsManageOpen(false);
                    setEditingTimer(null);
                    if (window.location.hash === '#manage') {
                      window.location.hash = '';
                    }
                  }}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {editingTimer ? (
                <div className="space-y-4">
                  <h3 className="font-medium mb-2">
                    {editingTimer.id === 'new' 
                      ? t('modal.countdown.create', '创建倒计时')
                      : editingTimer.isLimitedEdit 
                        ? t('modal.edit.editTimer') 
                        : t('modal.edit.editCountdown')
                    }
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.name')}</label>
                    <input
                      type="text"
                      value={editingTimer.name}
                      onChange={(e) => setEditingTimer({...editingTimer, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  {/* 只有倒计时可以编辑日期和时间 */}
                  {!editingTimer.isLimitedEdit && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.date')}</label>
                        <input
                          type="date"
                          value={editingTimer.targetDate}
                          onChange={(e) => setEditingTimer({...editingTimer, targetDate: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">{t('modal.edit.time')}</label>
                        <input
                          type="time"
                          value={editingTimer.targetTime}
                          onChange={(e) => setEditingTimer({...editingTimer, targetTime: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('modal.edit.color')}</label>
                    <div 
                      className="h-10 w-full rounded-lg cursor-pointer"
                      style={{ backgroundColor: editingTimer.color }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    ></div>
                    {showColorPicker && (
                      <div className="mt-2">
                        <HexColorPicker 
                          color={editingTimer.color} 
                          onChange={(color) => setEditingTimer({...editingTimer, color})} 
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      className="flex-1 btn-glass-secondary"
                      onClick={() => setEditingTimer(null)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="flex-1 btn-glass-primary flex items-center justify-center"
                      onClick={saveEditedTimer}
                      data-umami-event={t('modal.edit.saveChanges')}
                    >
                      <FiSave className="mr-2" />
                      {t('modal.edit.saveChanges')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {timers.map(timer => (
                    <div 
                      key={timer.id}
                      className="flex items-center justify-between p-3 mb-2 rounded-lg bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50"
                      style={{
                        borderLeft: `4px solid ${timer.color || '#0ea5e9'}`
                      }}
                    >
                      <div>
                        <h3 className="font-medium">{timer.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {timer.type === 'stopwatch' 
                            ? t('timer.stopwatch')
                            : timer.type === 'worldclock' 
                            ? `${timer.country || t('timer.worldClock')} - ${timer.timezone || ''}`
                            : new Date(timer.targetDate).toLocaleString()
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {/* 所有计时器都可以编辑名字和颜色 */}
                        <button
                          className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer"
                          onClick={() => startEditTimer(timer)}
                          data-umami-event={t('timer.editTimer')}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                          onClick={() => deleteTimer(timer.id)}
                          data-umami-event={t('timer.deleteTimer')}
                        >
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 语言切换弹窗 */}
      <AnimatePresence>
        {isLanguageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsLanguageOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-sm m-4 p-6 rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('header.selectLanguage')}</h2>
                <button
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setIsLanguageOpen(false)}
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('zh-CN')}
                  data-umami-event={t('header.chinese')}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇨🇳</span>
                    <div>
                      <div className="font-medium">{t('header.chinese')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.chineseSimplified')}</div>
                    </div>
                  </div>
                </button>

                <button
                  className="w-full px-4 py-3 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 text-left transition-all cursor-pointer"
                  onClick={() => switchLanguage('en-US')}
                  data-umami-event={t('header.english')}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🇺🇸</span>
                    <div>
                      <div className="font-medium">{t('header.english')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t('header.englishUS')}</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 登录模态框 */}
      <AnimatePresence>
        {isLoginOpen && (
          <LoginModal onClose={() => {
            setIsLoginOpen(false);
            if (window.location.hash === '#login') {
              window.location.hash = '';
            }
          }} />
        )}
      </AnimatePresence>

      {/* 计时器类型选择弹窗 */}
      <AnimatePresence>
        {isTimerTypeModalOpen && (
          <TimerTypeModal
            onClose={() => setIsTimerTypeModalOpen(false)}
            onSelectType={handleTimerTypeSelect}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
