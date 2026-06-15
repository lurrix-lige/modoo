import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * 全局导航函数 - 用于从任何地方发起导航
 */
export function navigate(name: string, params?: Record<string, any>) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}

/**
 * 全局导航到主界面（Main）并携带初始路由参数
 */
export function navigateToMain(initialRoute?: string, initialParams?: Record<string, any>) {
  if (navigationRef.isReady()) {
    if (initialRoute) {
      navigationRef.navigate('Main', { screen: initialRoute, params: initialParams });
    } else {
      navigationRef.navigate('Main');
    }
  }
}

/**
 * 重置导航堆栈
 */
export function reset(index: number, routes: { name: string; params?: Record<string, any> }[]) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index,
      routes,
    });
  }
}