import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCalendar, FiClock, FiGlobe, FiCheck } from 'react-icons/fi';
import { HexColorPicker } from 'react-colorful';
import { useTimers } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import CustomSelect from './CustomSelect';
import TimezoneSelectionModal from './TimezoneSelectionModal';

// 丰富的预设颜色选择
const presetColors = [
  '#FF4D4F', // 红色
  '#FA8C16', // 橙色
  '#FAAD14', // 黄色
  '#52C41A', // 绿色
  '#13C2C2', // 青色
  '#1890FF', // 蓝色
  '#722ED1', // 紫色
  '#EB2F96', // 粉色
  '#F759AB', // 玫红
  '#FF7A45', // 珊瑚红
  '#FFC53D', // 金黄
  '#BFBFBF', // 灰色
  '#69C0FF', // 浅蓝
  '#95DE64', // 浅绿
  '#FF9C6E', // 浅橙
  '#B37FEB', // 浅紫
  '#5CDBD3', // 蓝绿
  '#FF85C0', // 浅粉
  '#FFC069', // 浅橙黄
  '#85A5FF'  // 浅蓝紫
];

export default function AddTimerModal({ onClose }) {
  const { addTimer, holidaysList } = useTimers();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHolidaysList, setShowHolidaysList] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 选择颜色, 3: 完成
  
  // 随机选择一个预设颜色作为默认
  const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
  
  const [formData, setFormData] = useState({
    name: '',
    targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 默认明天
    targetTime: '00:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: randomColor,
  });
  
  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 设置颜色
  const handleColorChange = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };
  
  // 处理时区选择
  const handleTimezoneSelect = (timezone, city, country) => {
    setFormData(prev => ({ ...prev, timezone }));
    setShowTimezoneModal(false);
  };

  // 选择节假日
  const handleSelectHoliday = (holiday) => {
    const date = new Date(holiday.date);
    setFormData({
      name: holiday.name,
      targetDate: date.toISOString().slice(0, 10),
      targetTime: date.toTimeString().slice(0, 5),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      color: holiday.color,
    });
    setShowHolidaysList(false);
  };
  
  // 提交表单
  const handleSubmit = () => {
    const targetDateObj = new Date(`${formData.targetDate}T${formData.targetTime}`);
    
    const timerData = {
      name: formData.name,
      type: 'countdown',
      targetDate: targetDateObj.toISOString(),
      timezone: formData.timezone,
      color: formData.color,
    };
    
    // 添加计时器
    addTimer(timerData);
    setStep(3); // 进入完成步骤
    
    // 3秒后关闭弹窗
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {step === 1 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{t('modal.countdown.create', '创建倒计时')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="mb-6">
              <button 
                className="w-full glass-card p-4 mb-4 text-left flex items-center hover:bg-white/10 dark:hover:bg-black/10"
                onClick={() => setShowHolidaysList(!showHolidaysList)}
                data-umami-event="查看节假日列表"
              >
                <FiCalendar className="mr-2 text-primary-500" />
                <span>{t('modal.countdown.selectHoliday', '选择常用节假日')}</span>
              </button>
              
              {showHolidaysList && (
                <div className="bg-white/10 dark:bg-black/10 rounded-xl p-3 mb-4 max-h-60 overflow-y-auto">
                  {holidaysList.map((holiday, index) => (
                    <button
                      key={index}
                      className="w-full p-2 mb-2 rounded-lg flex items-center justify-between hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                      onClick={() => handleSelectHoliday(holiday)}
                      data-umami-event={`选择节假日-${holiday.name}`}
                    >
                      <span>{holiday.name}</span>
                      <span 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: holiday.color }}
                      ></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.name', '计时器名称')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('modal.countdown.namePlaceholder', '例如: 春节倒计时')}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.date', '目标日期')}</label>
                <div className="flex items-center">
                  <span className="absolute pl-3 text-gray-500 z-10"><FiCalendar /></span>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.countdown.time', '目标时间')}</label>
                <div className="flex items-center">
                  <span className="absolute pl-3 text-gray-500 z-10"><FiClock /></span>
                  <input
                    type="time"
                    name="targetTime"
                    value={formData.targetTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.timezone.title', '时区')}</label>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                  onClick={() => setShowTimezoneModal(true)}
                >
                  <div className="flex items-center">
                    <FiGlobe className="mr-2 text-gray-400" />
                    <span className="text-sm">
                      {formData.timezone === 'Asia/Shanghai' ? t('modal.timezone.chinaTime', '中国标准时间 (UTC+8)') :
                       formData.timezone === 'America/New_York' ? t('modal.timezone.eastTime', '美国东部时间') :
                       formData.timezone === 'Europe/London' ? t('modal.timezone.ukTime', '英国时间') :
                       formData.timezone === 'Europe/Paris' ? t('modal.timezone.centralEuropeTime', '欧洲中部时间') :
                       formData.timezone === 'Asia/Tokyo' ? t('modal.timezone.japanTime', '日本时间') :
                       formData.timezone}
                    </span>
                  </div>
                </button>
              </div>
            </form>
            
            <div className="mt-6 flex justify-between">
              <button
                className="btn-glass-secondary"
                onClick={onClose}
              >
                {t('common.cancel', '取消')}
              </button>
              <button
                className="btn-glass-primary"
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.targetDate || !formData.targetTime}
                data-umami-event="下一步-选择颜色"
              >
                {t('common.next', '下一步')}
              </button>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{t('modal.countdown.selectColor', '选择颜色')}</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onClose}
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="flex justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-full"
                style={{ backgroundColor: formData.color }}
              ></div>
            </div>
            
            <HexColorPicker 
              color={formData.color} 
              onChange={handleColorChange} 
              className="w-full mb-6"
            />
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {presetColors.slice(0, 20).map(color => (
                <button
                  key={color}
                  className={`w-full aspect-square rounded-full ${formData.color === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  data-umami-event={`选择预设颜色-${color}`}
                ></button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                className="btn-glass-secondary"
                onClick={() => setStep(1)}
              >
                {t('common.previous', '上一步')}
              </button>
              <button
                className="btn-glass-primary"
                onClick={handleSubmit}
                data-umami-event="创建计时器-确认"
              >
                {t('common.create', '创建')}
              </button>
            </div>
          </>
        )}
        
        {step === 3 && (
          <div className="py-8 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
            >
              <FiCheck className="text-white text-3xl" />
            </motion.div>
            <h2 className="text-2xl font-semibold mb-2">{t('modal.countdown.created', '倒计时已创建')}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t('modal.countdown.createdDesc', '您的倒计时已成功创建')}</p>
          </div>
        )}
      </motion.div>
      
      {/* 时区选择弹窗 */}
      {showTimezoneModal && (
        <TimezoneSelectionModal
          onClose={() => setShowTimezoneModal(false)}
          onSelectTimezone={handleTimezoneSelect}
          title={t('modal.timezone.title', '选择时区')}
        />
      )}
    </motion.div>
  );
}
