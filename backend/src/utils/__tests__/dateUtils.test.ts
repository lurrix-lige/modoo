import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatRelativeTime, getWeekDayNames, getMonthNames } from '../dateUtils';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date in Chinese locale', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'zh-CN');
      expect(result).toContain('2024');
      expect(result).toContain('1月');
      expect(result).toContain('15');
    });

    it('should format date in English locale', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('should accept string date', () => {
      const result = formatDate('2024-01-15', 'zh-CN');
      expect(result).toContain('2024');
    });

    it('should accept timestamp', () => {
      const timestamp = new Date(2024, 0, 15).getTime();
      const result = formatDate(timestamp, 'zh-CN');
      expect(result).toContain('2024');
    });
  });

  describe('formatTime', () => {
    it('should format time in Chinese locale', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      const result = formatTime(date, 'zh-CN');
      expect(result).toBe('14:30');
    });

    it('should format time in English locale', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      const result = formatTime(date, 'en');
      expect(result).toBe('02:30 PM');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent time in Chinese', () => {
      const date = new Date();
      const result = formatRelativeTime(date, 'zh-CN');
      expect(result).toBe('刚刚');
    });

    it('should return "Just now" for recent time in English', () => {
      const date = new Date();
      const result = formatRelativeTime(date, 'en');
      expect(result).toBe('Just now');
    });

    it('should return minutes ago in Chinese', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatRelativeTime(date, 'zh-CN');
      expect(result).toBe('30分钟前');
    });

    it('should return minutes ago in English', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const result = formatRelativeTime(date, 'en');
      expect(result).toBe('30m ago');
    });

    it('should return hours ago in Chinese', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'zh-CN');
      expect(result).toBe('2小时前');
    });

    it('should return hours ago in English', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'en');
      expect(result).toBe('2h ago');
    });

    it('should return days ago in Chinese', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'zh-CN');
      expect(result).toBe('5天前');
    });

    it('should return days ago in English', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'en');
      expect(result).toBe('5d ago');
    });

    it('should return formatted date for older than 7 days', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'zh-CN');
      expect(result).not.toContain('天前');
    });
  });

  describe('getWeekDayNames', () => {
    it('should return Chinese weekday names', () => {
      const days = getWeekDayNames('zh-CN', 'short');
      expect(days).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
    });

    it('should return English weekday names', () => {
      const days = getWeekDayNames('en', 'short');
      expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });
  });

  describe('getMonthNames', () => {
    it('should return Chinese month names', () => {
      const months = getMonthNames('zh-CN', 'long');
      expect(months).toEqual([
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
      ]);
    });

    it('should return English month names', () => {
      const months = getMonthNames('en', 'long');
      expect(months).toEqual([
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]);
    });
  });
});