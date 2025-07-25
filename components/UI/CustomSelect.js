import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * 自定义下拉菜单组件
 * @param {Object} props
 * @param {string} props.name - 表单名称
 * @param {string} props.value - 当前选中的值
 * @param {function} props.onChange - 值变化时的回调函数
 * @param {Array} props.options - 选项数组，格式为 [{value: 'value1', label: '选项1'}, ...]
 * @param {string} [props.placeholder] - 占位符文本
 * @param {string} [props.label] - 标签文本
 * @param {string} [props.icon] - 图标组件
 * @param {string} [props.className] - 附加类名
 */
export default function CustomSelect({ 
  name, 
  value, 
  onChange, 
  options, 
  placeholder,
  label,
  icon: Icon,
  className = '',
  disabled = false,
  required = false
}) {
  const { accentColor } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);
  
  // 设置默认占位符
  const defaultPlaceholder = placeholder || t('common.select', '请选择');
  
  // 设置初始选中项的标签
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      if (option) {
        setSelectedLabel(option.label);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, options]);
  
  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = options.findIndex(opt => opt.value === value);
        let nextIndex;
        
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        }
        
        const nextOption = options[nextIndex];
        handleSelect(nextOption.value, nextOption.label);
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, options, value]);
  
  // 处理选项选择
  const handleSelect = (optionValue, optionLabel) => {
    setSelectedLabel(optionLabel);
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };
  
  // 从下拉值转换为HSL色彩，用于创建渐变效果
  const hexToHsl = (hex) => {
    // 将HEX颜色转换为HSL
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // 无彩色
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };
  
  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* 选择器触发按钮 */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-lg 
          bg-white/10 dark:bg-black/10 backdrop-blur-sm border 
          ${isOpen ? 'border-primary-400 dark:border-primary-500' : 'border-white/20 dark:border-white/10'} 
          cursor-pointer transition-all duration-200 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/20 dark:hover:bg-black/20'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`select-dropdown-${name}`}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          boxShadow: isOpen ? `0 0 0 2px ${accentColor}40` : 'none'
        }}
      >
        <div className="flex items-center space-x-2 truncate">
          {Icon && <Icon className="text-gray-500 dark:text-gray-400" />}
          <span className={selectedLabel ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedLabel || defaultPlaceholder}
          </span>
        </div>
        <FiChevronDown 
          className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          style={{ color: isOpen ? accentColor : 'currentColor' }}
        />
      </div>
      
      {/* 下拉菜单列表 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 glass-card rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            id={`select-dropdown-${name}`}
            role="listbox"
            style={{
              backgroundColor: 'rgba(var(--color-background), 0.7)',
              borderColor: 'rgba(var(--color-primary), 0.2)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer flex items-center justify-between transition-colors duration-150
                  ${value === option.value 
                    ? 'text-white font-medium' 
                    : 'text-gray-800 dark:text-gray-100 hover:bg-white/10 dark:hover:bg-black/20'}`}
                onClick={() => handleSelect(option.value, option.label)}
                role="option"
                aria-selected={value === option.value}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(option.value, option.label);
                  }
                }}
                style={value === option.value ? {
                  background: `linear-gradient(90deg, ${accentColor}99, ${accentColor}40)`,
                } : {}}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <FiCheck className="text-white" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 隐藏的原生select，用于表单提交 */}
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        required={required}
        disabled={disabled}
      >
        <option value="" disabled>{defaultPlaceholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
