// 通用类型定义
export interface Story {
  id: string;
  title: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  category: string;
  description?: string;
  isFavorite?: boolean;
  isPremium?: boolean;
}
