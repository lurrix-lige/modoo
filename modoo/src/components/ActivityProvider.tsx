import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { authService } from '../services';

interface ActivityContextType {
  recordUserActivity: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

interface ActivityProviderProps {
  children: ReactNode;
}

export function ActivityProvider({ children }: ActivityProviderProps) {
  const recordUserActivity = useCallback(() => {
    if (authService.isAuthenticated()) {
      authService.recordActivity();
    }
  }, []);

  return (
    <ActivityContext.Provider value={{ recordUserActivity }}>{children}</ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

export function withActivityTracking<P extends { onPress?: () => void }>(
  WrappedComponent: React.ComponentType<P>,
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
