import { logger } from './logger';

export class DateLabelUtils {
  private static readonly WEEK_DAY_MAP: Record<string, string> = {
    周一: 'parentHome.monday',
    周二: 'parentHome.tuesday',
    周三: 'parentHome.wednesday',
    周四: 'parentHome.thursday',
    周五: 'parentHome.friday',
    周六: 'parentHome.saturday',
    周日: 'parentHome.sunday',
  };

  private static readonly WEEK_DAY_MAP_EN: Record<string, string> = {
    Mon: 'parentHome.monday',
    Tue: 'parentHome.tuesday',
    Wed: 'parentHome.wednesday',
    Thu: 'parentHome.thursday',
    Fri: 'parentHome.friday',
    Sat: 'parentHome.saturday',
    Sun: 'parentHome.sunday',
  };

  public static readonly DATE_PATTERNS = {
    WEEK_DAY: /^周[一二三四五六日]$/,
    WEEK_DAY_EN: /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i,
    MONTH_DAY: /^\d+日$/,
    PURE_NUMBER: /^\d+$/,
  };

  public static getDayLabel(day: string, t: (key: string) => string): string {
    try {
      if (typeof day !== 'string') {
        return String(day);
      }

      if (!day || day.trim().length === 0) {
        return '';
      }

      if (this.DATE_PATTERNS.PURE_NUMBER.test(day)) {
        return day;
      }

      if (this.DATE_PATTERNS.WEEK_DAY.test(day)) {
        const translationKey = this.WEEK_DAY_MAP[day];
        if (translationKey) {
          return t(translationKey);
        }
        return day;
      }

      const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1);
      if (this.DATE_PATTERNS.WEEK_DAY_EN.test(day)) {
        const translationKey = this.WEEK_DAY_MAP_EN[normalizedDay];
        if (translationKey) {
          return t(translationKey);
        }
        return day;
      }

      if (this.DATE_PATTERNS.MONTH_DAY.test(day)) {
        return day;
      }

      return day;
    } catch (error) {
      logger.error('[DateLabelUtils] Error in getDayLabel', { error });
      return day;
    }
  }

  public static isWeekDay(day: string): boolean {
    try {
      return this.DATE_PATTERNS.WEEK_DAY.test(day) || this.DATE_PATTERNS.WEEK_DAY_EN.test(day);
    } catch (error) {
      logger.error('[DateLabelUtils] Error in isWeekDay', { error });
      return false;
    }
  }

  public static isMonthDay(day: string): boolean {
    try {
      return this.DATE_PATTERNS.MONTH_DAY.test(day);
    } catch (error) {
      logger.error('[DateLabelUtils] Error in isMonthDay', { error });
      return false;
    }
  }

  public static getWeekDays(): string[] {
    return Object.keys(this.WEEK_DAY_MAP);
  }

  public static getTranslationKey(day: string): string | undefined {
    try {
      return this.WEEK_DAY_MAP[day];
    } catch (error) {
      logger.error('[DateLabelUtils] Error in getTranslationKey', { error });
      return undefined;
    }
  }
}

export const getDayLabel = (day: string, t: (key: string) => string): string => {
  return DateLabelUtils.getDayLabel(day, t);
};

export const formatDate = (
  date: Date | string | number,
  locale: string = 'zh-CN',
  options: Intl.DateTimeFormatOptions = {},
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    logger.error('[DateUtils] Error in formatDate', { error });
    return String(date);
  }
};

export const formatTime = (
  date: Date | string | number,
  locale: string = 'zh-CN',
  options: Intl.DateTimeFormatOptions = {},
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    logger.error('[DateUtils] Error in formatTime', { error });
    return String(date);
  }
};

export const formatDateTime = (
  date: Date | string | number,
  locale: string = 'zh-CN',
  dateOptions: Intl.DateTimeFormatOptions = {},
  timeOptions: Intl.DateTimeFormatOptions = {},
): string => {
  try {
    const formattedDate = formatDate(date, locale, dateOptions);
    const formattedTime = formatTime(date, locale, timeOptions);
    return `${formattedDate} ${formattedTime}`;
  } catch (error) {
    logger.error('[DateUtils] Error in formatDateTime', { error });
    return String(date);
  }
};

export const formatRelativeTime = (
  date: Date | string | number,
  locale: string = 'zh-CN',
): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

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
    logger.error('[DateUtils] Error in formatRelativeTime', { error });
    return String(date);
  }
};

export const getMonthNames = (
  locale: string = 'zh-CN',
  type: 'long' | 'short' | 'narrow' = 'long',
): string[] => {
  try {
    const months: string[] = [];
    const date = new Date(2024, 0, 1);

    for (let i = 0; i < 12; i++) {
      date.setMonth(i);
      months.push(date.toLocaleDateString(locale, { month: type }));
    }

    return months;
  } catch (error) {
    logger.error('[DateUtils] Error in getMonthNames', { error });
    return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  }
};

export const getWeekDayNames = (
  locale: string = 'zh-CN',
  type: 'long' | 'short' | 'narrow' = 'short',
): string[] => {
  try {
    const days: string[] = [];
    const date = new Date(2024, 0, 7);

    for (let i = 0; i < 7; i++) {
      date.setDate(date.getDate() + 1);
      days.push(date.toLocaleDateString(locale, { weekday: type }));
    }

    return days;
  } catch (error) {
    logger.error('[DateUtils] Error in getWeekDayNames', { error });
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  }
};

export default DateLabelUtils;
