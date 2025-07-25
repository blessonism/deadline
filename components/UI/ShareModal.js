import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCopy, FiShare2, FiCheck, FiList } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { useTimers } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { createShareUrl } from '../../utils/shareUtils';
import CustomSelect from './CustomSelect';

export default function ShareModal({ onClose }) {
  const { timers, activeTimerId } = useTimers();
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(activeTimerId);
  const [shareAll, setShareAll] = useState(false);
  
  // 生成分享URL
  useEffect(() => {
    const url = createShareUrl(
      shareAll 
        ? timers 
        : timers.filter(timer => timer.id === selectedTimer)
    );
    
    // 构建完整URL
    const fullUrl = `${window.location.origin}${window.location.pathname}?share=${url}`;
    setShareUrl(fullUrl);
  }, [timers, selectedTimer, shareAll]);
  
  // 复制URL到剪贴板
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error(t('share.copyError', '无法复制URL: '), err);
      });
  };
  
  // 尝试使用Web Share API分享
  const handleWebShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('share.shareTitle', '查看我的TimePulse倒计时'),
        text: t('share.shareText', '我分享了一个倒计时，点击链接查看'),
        url: shareUrl
      })
      .catch(err => {
        console.log(t('share.shareError', '分享失败:'), err);
      });
    }
  };

  // 处理选择下拉菜单改变
  const handleSelectChange = (e) => {
    if (e.target.value === 'all') {
      setShareAll(true);
    } else {
      setShareAll(false);
      setSelectedTimer(e.target.value);
    }
  };

  // 创建下拉菜单选项
  const selectOptions = [
    { value: 'all', label: t('share.shareAll', '分享所有计时器') },
    ...timers.map(timer => ({
      value: timer.id,
      label: timer.name
    }))
  ];  return (
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">{t('share.title')}</h2>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="text-xl" />
          </button>
        </div>
        
        <div className="mb-6">
          <CustomSelect
            name="shareTimer"
            value={shareAll ? 'all' : selectedTimer}
            onChange={handleSelectChange}
            options={selectOptions}
            placeholder={t('share.selectTimer', '选择要分享的倒计时')}
            label={t('share.selectTimer', '选择要分享的倒计时')}
            icon={FiList}
            data-umami-event="选择分享计时器"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('share.url')}</label>
          <div className="flex">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-l-lg bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <button
              className={`px-4 py-2 rounded-r-lg text-white`}
              style={{ 
                backgroundColor: copied ? '#10b981' : accentColor 
              }}
              onClick={handleCopy}
              data-umami-event="复制分享链接"
            >
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>
        
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/favicon.ico",
                x: undefined,
                y: undefined,
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            className="flex-1 btn-glass-secondary flex items-center justify-center"
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          {navigator.share && (
            <button
              className="flex-1 btn-glass-primary flex items-center justify-center"
              onClick={handleWebShare}
              data-umami-event={t('share.systemShare', '使用系统分享')}
            >
              <FiShare2 className="mr-2" />
              {t('share.systemShare', '系统分享')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
