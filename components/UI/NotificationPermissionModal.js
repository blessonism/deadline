import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';

export default function NotificationPermissionModal({ isOpen, onClose, onAllow, onDeny }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('request'); // 'request', 'success', 'failed'
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setStep('success');
        setTimeout(() => {
          onAllow();
          handleClose();
        }, 2000);
      } else {
        setStep('failed');
        setTimeout(() => {
          setStep('request');
        }, 3000);
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      setStep('failed');
      setTimeout(() => {
        setStep('request');
      }, 3000);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    handleClose();
  };

  const handleClose = () => {
    setStep('request');
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'success':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <FiCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3">
              {t('notification.success')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('notification.successMessage')}
            </p>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto w-16 h-16 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center mb-6"
            >
              <FiAlertCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3">
              {t('notification.failed')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('notification.failedMessage')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('notification.failedRetry')}
            </p>
          </div>
        );

      default:
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-primary-500/80 backdrop-blur-sm">
                  <FiBell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">
                  {t('notification.title')}
                </h3>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {t('notification.description')}
              </p>
              <div className="p-4 rounded-lg bg-yellow-50/80 dark:bg-yellow-900/20 border-l-4 border-yellow-500/60 backdrop-blur-sm">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('notification.iosHint')}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAllow}
                disabled={isRequesting}
                className="flex-1 btn-glass-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('notification.requesting')}</span>
                  </div>
                ) : (
                  t('notification.allow')
                )}
              </button>
              <button
                onClick={handleDeny}
                disabled={isRequesting}
                className="flex-1 btn-glass-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('notification.deny')}
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto py-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-md m-4 p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
