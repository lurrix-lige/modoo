import React, { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { healthCheckService, authService, errorHandler, NotificationService } from './src/services';
import { AppContainer } from './src/components/AppContainer';
import { ActivityProvider } from './src/components/ActivityProvider';
import { useAppStore } from './src/store';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ErrorProvider } from './src/contexts/ErrorContext';
import { AudioProvider } from './src/providers/AudioProvider';
import { CourseAudioProvider } from './src/providers/CourseAudioProvider';
import { NavigationCallbackProvider } from './src/contexts';
import { logger } from './src/utils/logger';
import './src/i18n';

function AppContent() {
  const { logout } = useAppStore();

  const handleSessionTimeout = useCallback(() => {
    logout();
    errorHandler.navigateToAuthWithReset();
  }, [logout]);

  const handleTokenRefreshed = useCallback(() => {
    logger.info('[APP:AuthService:token refresh callback] Token refreshed successfully');
  }, []);

  useEffect(() => {
    errorHandler.setConfig({
      onAuthError: () => {
        logout();
        errorHandler.navigateToAuthWithReset();
      },
    });
  }, [logout]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        authService.setCallbacks(handleSessionTimeout, handleTokenRefreshed);
        const isAuth = await authService.initialize();

        if (isAuth) {
          const user = await authService.getUser();
          const isPaid = authService.getPaidStatus();
          if (user) {
            useAppStore.getState().setAuthenticated(true, user);
          }
          if (isPaid) {
            useAppStore.getState().setPaidStatus(true);
          }
        }
      } catch (error) {
        logger.error('Failed to initialize auth:', { error });
      }
    };

    const initializeNotifications = async () => {
      try {
        await NotificationService.getInstance().initialize();
      } catch (error) {
        logger.error('Failed to initialize notifications:', { error });
      }
    };

    initializeApp();
    initializeNotifications();

    try {
      healthCheckService.initialize();
    } catch (error) {
      logger.error('Failed to initialize health check:', { error });
    }

    return () => {
      try {
        healthCheckService.destroy();
      } catch (error) {
        logger.error('Failed to destroy health check:', { error });
      }
    };
  }, [handleSessionTimeout, handleTokenRefreshed]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        authService.recordActivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  return <AppContainer />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationCallbackProvider>
            <AudioProvider>
              <CourseAudioProvider>
                <ErrorProvider>
                  <ErrorBoundary>
                    <ActivityProvider>
                      <AppContent />
                    </ActivityProvider>
                  </ErrorBoundary>
                </ErrorProvider>
              </CourseAudioProvider>
            </AudioProvider>
          </NavigationCallbackProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
