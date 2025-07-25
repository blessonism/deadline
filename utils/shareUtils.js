// 分享和同步相关工具函数

/**
 * 创建分享URL
 * @param {Array} timers - 要分享的计时器数组
 * @returns {string} 编码后的分享字符串
 */
export function createShareUrl(timers) {
  // 只保留必要的字段以减小URL长度
  const minimalTimers = timers.map(timer => ({
    id: timer.id,
    name: timer.name,
    targetDate: timer.targetDate,
    timezone: timer.timezone,
    color: timer.color,
  }));
  
  // 将数据转换为JSON字符串
  const data = JSON.stringify({ timers: minimalTimers });
  
  // 使用 encodeURIComponent 处理非 Latin1 字符，然后再使用 Base64 编码
  return btoa(encodeURIComponent(data));
}

/**
 * 解析分享URL
 * @param {string} shareString - 编码后的分享字符串
 * @returns {Object} 解析后的计时器数据
 */
export function parseShareUrl(shareString) {
  try {
    // 解码Base64字符串，然后使用 decodeURIComponent 解码
    const decodedString = decodeURIComponent(atob(shareString));
    
    // 解析JSON
    return JSON.parse(decodedString);
  } catch (error) {
    console.error('解析分享URL失败:', error);
    return null;
  }
}

/**
 * 请求通知权限
 * @returns {Promise<boolean>} 是否授予权限
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("此浏览器不支持通知");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

/**
 * 发送计时器到期通知
 * @param {Object} timer - 计时器对象
 */
export function sendTimerExpiredNotification(timer) {
  if (Notification.permission === "granted") {
    new Notification("TimePulse 倒计时完成", {
      body: `${timer.name} 的倒计时已结束！`,
      icon: "/favicon.ico",
    });
  }
}
