export const formatCurrency = (
  amount: number,
  currency: string = 'CNY',
  locale: string = 'zh-CN',
  options: Intl.NumberFormatOptions = {}
): string => {
  const currencyMap: Record<string, string> = {
    CNY: 'CNY',
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    JPY: 'JPY',
    KRW: 'KRW',
    HKD: 'HKD',
    AUD: 'AUD',
    CAD: 'CAD',
    SGD: 'SGD',
  };

  const currencyCode = currencyMap[currency] || currency;

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    ...options,
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount);
  } catch (error) {
    const symbol = currencyCode === 'CNY' ? '¥' : 
                   currencyCode === 'USD' ? '$' : 
                   currencyCode === 'EUR' ? '€' : 
                   currencyCode === 'GBP' ? '£' : 
                   currencyCode === 'JPY' ? '¥' : currencyCode;
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    });
    return `${symbol}${formatter.format(amount)}`;
  }
};

export const formatNumber = (
  value: number,
  locale: string = 'zh-CN',
  options: Intl.NumberFormatOptions = {}
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    ...options,
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  } catch (error) {
    return String(value);
  }
};

export const formatPercentage = (
  value: number,
  locale: string = 'zh-CN',
  decimals: number = 0,
  options: Intl.NumberFormatOptions = {}
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...options,
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  } catch (error) {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

export const formatCompactNumber = (
  value: number,
  locale: string = 'zh-CN',
  style: 'decimal' | 'percent' = 'decimal'
): string => {
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    style,
  };

  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    return String(value);
  }
};

export const getCurrencySymbol = (currency: string = 'CNY', locale: string = 'zh-CN'): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find(part => part.type === 'currency');
    return symbolPart?.value || currency;
  } catch (error) {
    const fallbackSymbols: Record<string, string> = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      KRW: '₩',
      HKD: 'HK$',
      AUD: 'A$',
      CAD: 'C$',
      SGD: 'S$',
    };
    return fallbackSymbols[currency] || currency;
  }
};

export const getCurrencyName = (currency: string = 'CNY', locale: string = 'zh-CN'): string => {
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    });
    
    const parts = formatter.formatToParts(1);
    return parts.map(part => part.type === 'currency' ? '' : part.value).join('').trim() || currency;
  } catch (error) {
    const fallbackNames: Record<string, Record<string, string>> = {
      CNY: { 'zh-CN': '人民币', 'en': 'Chinese Yuan' },
      USD: { 'zh-CN': '美元', 'en': 'US Dollar' },
      EUR: { 'zh-CN': '欧元', 'en': 'Euro' },
      GBP: { 'zh-CN': '英镑', 'en': 'British Pound' },
      JPY: { 'zh-CN': '日元', 'en': 'Japanese Yen' },
      KRW: { 'zh-CN': '韩元', 'en': 'Korean Won' },
    };
    return fallbackNames[currency]?.[locale] || fallbackNames[currency]?.['en'] || currency;
  }
};