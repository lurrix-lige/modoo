import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatPercentage, getCurrencySymbol } from '../currencyUtils';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format CNY in Chinese locale', () => {
      const result = formatCurrency(100, 'CNY', 'zh-CN');
      expect(result).toBe('¥100.00');
    });

    it('should format CNY in English locale', () => {
      const result = formatCurrency(100, 'CNY', 'en');
      expect(result).toBe('CN¥100.00');
    });

    it('should format USD in English locale', () => {
      const result = formatCurrency(100, 'USD', 'en');
      expect(result).toBe('$100.00');
    });

    it('should format USD in Chinese locale', () => {
      const result = formatCurrency(100, 'USD', 'zh-CN');
      expect(result).toBe('US$100.00');
    });

    it('should format EUR in English locale', () => {
      const result = formatCurrency(100, 'EUR', 'en');
      expect(result).toBe('€100.00');
    });

    it('should format JPY without decimals', () => {
      const result = formatCurrency(100, 'JPY', 'en');
      expect(result).toBe('¥100');
    });

    it('should handle decimal amounts', () => {
      const result = formatCurrency(123.45, 'CNY', 'zh-CN');
      expect(result).toBe('¥123.45');
    });
  });

  describe('formatNumber', () => {
    it('should format number in Chinese locale', () => {
      const result = formatNumber(1000, 'zh-CN');
      expect(result).toBe('1,000');
    });

    it('should format number in English locale', () => {
      const result = formatNumber(1000, 'en');
      expect(result).toBe('1,000');
    });

    it('should format large number', () => {
      const result = formatNumber(1000000, 'zh-CN');
      expect(result).toBe('1,000,000');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage in Chinese locale', () => {
      const result = formatPercentage(0.75, 'zh-CN');
      expect(result).toBe('75%');
    });

    it('should format percentage in English locale', () => {
      const result = formatPercentage(0.75, 'en');
      expect(result).toBe('75%');
    });

    it('should format percentage with decimals', () => {
      const result = formatPercentage(0.755, 'zh-CN', 2);
      expect(result).toBe('75.50%');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return CNY symbol', () => {
      const result = getCurrencySymbol('CNY', 'zh-CN');
      expect(result).toBe('¥');
    });

    it('should return USD symbol', () => {
      const result = getCurrencySymbol('USD', 'en');
      expect(result).toBe('$');
    });

    it('should return EUR symbol', () => {
      const result = getCurrencySymbol('EUR', 'en');
      expect(result).toBe('€');
    });

    it('should return GBP symbol', () => {
      const result = getCurrencySymbol('GBP', 'en');
      expect(result).toBe('£');
    });

    it('should return JPY symbol', () => {
      const result = getCurrencySymbol('JPY', 'en');
      expect(result).toBe('¥');
    });

    it('should return fallback for unknown currency', () => {
      const result = getCurrencySymbol('XYZ', 'en');
      expect(result).toBe('XYZ');
    });
  });
});