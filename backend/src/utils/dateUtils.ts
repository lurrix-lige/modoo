export const formatDate = (
  date: Date | string | number,
  locale: string = 'zh-CN',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    return String(date);
  }
};

export const formatTime = (
  date: Date | string | number,
  locale: string = 'zh-CN',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    return String(date);
  }
};

export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = 'zh-CN'
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return formatDate(dateObj, locale, { month: 'short', day: 'numeric' });
    } else if (diffDays >= 1) {
      return `${diffDays}${locale === 'zh-CN' ? '天前' : 'd ago'}`;
    } else if (diffHours >= 1) {
      return `${diffHours}${locale === 'zh-CN' ? '小时前' : 'h ago'}`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes}${locale === 'zh-CN' ? '分钟前' : 'm ago'}`;
    } else {
      return locale === 'zh-CN' ? '刚刚' : 'Just now';
    }
  } catch (error) {
    return String(date);
  }
};

export const getWeekDayNames = (locale: string = 'zh-CN', type: 'long' | 'short' | 'narrow' = 'short'): string[] => {
  try {
    const days: string[] = [];
    const date = new Date(2024, 0, 7);
    
    for (let i = 0; i < 7; i++) {
      date.setDate(date.getDate() + 1);
      days.push(date.toLocaleDateString(locale, { weekday: type }));
    }
    
    return days;
  } catch (error) {
    return locale === 'zh-CN' 
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
};

export const getMonthNames = (locale: string = 'zh-CN', type: 'long' | 'short' | 'narrow' = 'long'): string[] => {
  try {
    const months: string[] = [];
    const date = new Date(2024, 0, 1);
    
    for (let i = 0; i < 12; i++) {
      date.setMonth(i);
      months.push(date.toLocaleDateString(locale, { month: type }));
    }
    
    return months;
  } catch (error) {
    return locale === 'zh-CN'
      ? ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  }
};