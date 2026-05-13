import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { authService } from '../services';

interface ActivityContextType {
  recordUserActivity: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

interface ActivityProviderProps {
  children: ReactNode;
}

/**
 * 优雅的用户活动追�?Provider
 * 
 * 使用方式�? * 1. 在根组件中包�?<ActivityProvider>
 * 2. 在需要记录活动的组件中调�?useActivity().recordUserActivity()
 * 3. 或者直接在 TouchableOpacity 等组件中使用
 */
export function ActivityProvider({ children }: ActivityProviderProps) {
  const recordUserActivity = useCallback(() => {
    if (authService.isAuthenticated()) {
      authService.recordActivity();
    }
  }, []);

  return (
    <ActivityContext.Provider value={{ recordUserActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

/**
 * Hook 用于在组件中记录用户活动
 */
export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

/**
 * 高阶组件，用于包装可点击组件，自动记录活�? * 
 * 使用示例�? * const TrackedTouchableOpacity = withActivityTracking(TouchableOpacity);
 * <TrackedTouchableOpacity onPress={...}>...</TrackedTouchableOpacity>
 */
export function withActivityTracking<P extends { onPress?: () => void }>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithActivityTracking(props: P) {
    const { recordUserActivity } = useActivity();
    
    const handlePress = () => {
      recordUserActivity();
      props.onPress?.();
    };

    return <WrappedComponent {...props} onPress={handlePress} />;
  };
}