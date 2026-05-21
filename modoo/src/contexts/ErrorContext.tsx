import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toastManager, ErrorToastProvider } from '../components/ErrorToast';
import { errorHandler, AppError } from '../services/ErrorHandler';
import { logger } from '../utils/logger';

interface ErrorContextValue {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  showToast: (
    message: string,
    severity?: 'info' | 'warning' | 'error' | 'success',
    duration?: number,
  ) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export const useError = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: React.ReactNode;
  maxVisibleToasts?: number;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children, maxVisibleToasts = 3 }) => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const isHandledRef = useRef(false);
  const errorQueueRef = useRef<AppError[]>([]);
  const processingRef = useRef(false);

  const processErrorQueue = useCallback(() => {
    if (processingRef.current || errorQueueRef.current.length === 0) return;

    processingRef.current = true;
    const error = errorQueueRef.current.shift()!;

    setErrors((prev) => {
      if (prev.some((e) => e.id === error.id)) {
        processingRef.current = false;
        processErrorQueue();
        return prev;
      }
      return [...prev, error];
    });

    toastManager.show({
      visible: true,
      message: error.message,
      code: error.code,
      severity: error.severity,
      duration: error.duration ?? (error.severity === 'error' ? 0 : 5000),
      onDismiss: () => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      },
      onRetry: error.onRetry
        ? () => {
            error.onRetry?.();
            setErrors((prev) => prev.filter((e) => e.id !== error.id));
          }
        : undefined,
      showRetry: !!error.onRetry && error.severity === 'error',
      position: error.severity === 'error' ? 'top' : 'bottom',
    });

    processingRef.current = false;

    if (errorQueueRef.current.length > 0) {
      setTimeout(processErrorQueue, 100);
    }
  }, []);

  useEffect(() => {
    isHandledRef.current = false;

    const unsubscribe = errorHandler.subscribe((error) => {
      if (isHandledRef.current) return;
      isHandledRef.current = true;

      // 如果是认证错误，不显示 toast，直接处理导航
      if (error.isAuthError) {
        logger.debug('[ErrorContext] Auth error received, skipping toast notification');
        isHandledRef.current = false;
        return;
      }

      errorQueueRef.current.push(error);

      setTimeout(() => {
        isHandledRef.current = false;
      }, 100);

      processErrorQueue();
    });

    return () => {
      unsubscribe();
      isHandledRef.current = true;
    };
  }, [processErrorQueue]);

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
    toastManager.hide(id);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    toastManager.hideAll();
  }, []);

  const addError = useCallback(
    (error: AppError) => {
      errorQueueRef.current.push(error);
      processErrorQueue();
    },
    [processErrorQueue],
  );

  const showToast = useCallback(
    (
      message: string,
      severity: 'info' | 'warning' | 'error' | 'success' = 'info',
      duration: number = 5000,
    ) => {
      const toastId = toastManager.show({
        visible: true,
        message,
        severity,
        duration,
        position: severity === 'error' ? 'top' : 'bottom',
      });
    },
    [],
  );

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors, showToast }}>
      <ErrorToastProvider maxVisibleToasts={maxVisibleToasts}>{children}</ErrorToastProvider>
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;
