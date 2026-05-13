import { SharePlatform, ShareOptions } from './types';

export interface PlatformShareOptions {
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
}

export class ShareContentOptimizer {
  private static platformRules: Record<SharePlatform, {
    maxTitleLength: number;
    maxDescriptionLength: number;
    useEmoji: boolean;
    format: 'text' | 'rich';
  }> = {
    native: {
      maxTitleLength: 100,
      maxDescriptionLength: 500,
      useEmoji: true,
      format: 'text',
    },
    wechat: {
      maxTitleLength: 50,
      maxDescriptionLength: 100,
      useEmoji: false,
      format: 'rich',
    },
    qq: {
      maxTitleLength: 60,
      maxDescriptionLength: 120,
      useEmoji: false,
      format: 'rich',
    },
    weibo: {
      maxTitleLength: 140,
      maxDescriptionLength: 140,
      useEmoji: true,
      format: 'text',
    },
  };

  static optimize(
    options: ShareOptions,
    platform: SharePlatform
  ): PlatformShareOptions {
    const rules = this.platformRules[platform];
    
    let title = options.title || '';
    let description = options.description || '';
    let url = options.url;
    let imageUrl = options.imageUrl;

    title = this.truncate(title, rules.maxTitleLength);
    
    const descriptionParts: string[] = [];
    if (description) {
      descriptionParts.push(description);
    }
    
    if (url && platform === 'weibo') {
      descriptionParts.push(url);
    }
    
    description = this.truncate(
      descriptionParts.join('\n'),
      rules.maxDescriptionLength
    );

    if (!rules.useEmoji) {
      title = this.removeEmoji(title);
      description = this.removeEmoji(description);
    }

    return {
      title,
      description,
      url: platform !== 'weibo' ? url : undefined,
      imageUrl,
    };
  }

  static generateShareMessage(
    options: ShareOptions,
    platform: SharePlatform
  ): string {
    const optimized = this.optimize(options, platform);
    const parts: string[] = [];

    if (optimized.title) {
      parts.push(optimized.title);
    }
    
    if (optimized.description) {
      parts.push('');
      parts.push(optimized.description);
    }
    
    if (optimized.url) {
      parts.push('');
      parts.push(optimized.url);
    }

    return parts.join('\n');
  }

  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  private static removeEmoji(text: string): string {
    return text.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  }

  static getPlatformRules(platform: SharePlatform) {
    return this.platformRules[platform];
  }

  static getPlatformConfig(platform: SharePlatform) {
    const rules = this.platformRules[platform] || this.platformRules.native;
    return {
      maxTitleLength: rules.maxTitleLength,
      maxDescriptionLength: rules.maxDescriptionLength,
      allowEmoji: rules.useEmoji,
    };
  }
}