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
  try {
    return new Intl.NumberFormat(locale, options).format(value);
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