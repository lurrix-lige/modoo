import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw, Birdhouse } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors } from '../theme';
import { errorHandler } from '../services/ErrorHandler';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { error, errorInfo });
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.props.onGoHome?.() ?? errorHandler.navigateToHome();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.errorLight }]}>
          <AlertCircle size={64} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('common.error')}</Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('common.errorMessage')}
        </Text>

        {error && __DEV__ && (
          <View style={[styles.devInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.devInfoText, { color: colors.error }]}>{error.message}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}
          >
            <RefreshCw size={20} color={commonColors.white} />
            <Text style={[styles.retryButtonText, { color: commonColors.white }]}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeButton, { borderColor: colors.primary }]}
            onPress={onGoHome}
          >
            <Birdhouse size={20} color={colors.primary} />
            <Text style={[styles.homeButtonText, { color: colors.primary }]}>
              {t('common.backToHome')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  devInfo: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    width: '100%',
  },
  devInfoText: {
    fontFamily: 'monospace',
    fontSize: typography.fontSize.xs,
  },
  homeButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    justifyContent: 'center',
  },
  homeButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 120,
  },
  message: {
    fontSize: typography.fontSize.md,
    lineHeight: 24,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
