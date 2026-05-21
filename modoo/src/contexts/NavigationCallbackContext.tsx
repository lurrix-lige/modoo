import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

interface NavigationCallback {
  id: string;
  callback: () => void;
  timeout?: number;
}

interface NavigationCallbackContextType {
  registerCallback: (id: string, callback: () => void, timeout?: number) => void;
  triggerCallback: (id: string) => void;
  unregisterCallback: (id: string) => void;
  hasCallback: (id: string) => boolean;
}

const NavigationCallbackContext = createContext<NavigationCallbackContextType | null>(null);

const DEFAULT_TIMEOUT = 5 * 60 * 1000;

export const NavigationCallbackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const callbacks = React.useRef<Map<string, NavigationCallback>>(new Map());

  const registerCallback = useCallback(
    (id: string, callback: () => void, timeout = DEFAULT_TIMEOUT) => {
      const existing = callbacks.current.get(id);
      if (existing && existing.timeout) {
        clearTimeout(existing.timeout);
      }

      const timeoutId = window.setTimeout(() => {
        callbacks.current.delete(id);
      }, timeout);

      callbacks.current.set(id, {
        id,
        callback,
        timeout: timeoutId,
      });
    },
    [],
  );

  const triggerCallback = useCallback((id: string) => {
    const callbackEntry = callbacks.current.get(id);
    if (callbackEntry) {
      try {
        callbackEntry.callback();
      } catch (error) {
        logger.error('Navigation callback error:', { error });
      } finally {
        if (callbackEntry.timeout) {
          clearTimeout(callbackEntry.timeout);
        }
        callbacks.current.delete(id);
      }
    }
  }, []);

  const unregisterCallback = useCallback((id: string) => {
    const callbackEntry = callbacks.current.get(id);
    if (callbackEntry && callbackEntry.timeout) {
      clearTimeout(callbackEntry.timeout);
    }
    callbacks.current.delete(id);
  }, []);

  const hasCallback = useCallback((id: string) => {
    return callbacks.current.has(id);
  }, []);

  useEffect(() => {
    return () => {
      callbacks.current.forEach((entry) => {
        if (entry.timeout) {
          clearTimeout(entry.timeout);
        }
      });
      callbacks.current.clear();
    };
  }, []);

  return (
    <NavigationCallbackContext.Provider
      value={{
        registerCallback,
        triggerCallback,
        unregisterCallback,
        hasCallback,
      }}
    >
      {children}
    </NavigationCallbackContext.Provider>
  );
};

const noopCallback: NavigationCallbackContextType = {
  registerCallback: () => {},
  triggerCallback: () => {},
  unregisterCallback: () => {},
  hasCallback: () => false,
};

export const useNavigationCallback = () => {
  const context = useContext(NavigationCallbackContext);
  if (!context) {
    logger.warn(
      'useNavigationCallback used outside NavigationCallbackProvider, using no-op fallback',
    );
    return noopCallback;
  }
  return context;
};

export const generateCallbackId = (prefix: string = 'nav_callback') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
