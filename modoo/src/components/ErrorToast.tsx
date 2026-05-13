import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from "react-native";
import {
  X,
  CheckCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react-native";

const iconMap: Record<
  string,
  React.ComponentType<{ size: number; color: string }>
> = {
  "checkmark-circle": CheckCircle,
  "information-circle": Info,
  warning: AlertTriangle,
  "alert-circle": AlertCircle,
};
import { useTranslation } from "react-i18next";
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  commonColors,
} from "../theme";

export type ErrorSeverity = "info" | "warning" | "error" | "success";

export interface ToastConfig {
  visible: boolean;
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  duration?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryButtonText?: string;
  showRetry?: boolean;
  position?: "top" | "bottom";
  showDetails?: boolean;
}

interface ToastItemProps {
  toast: ToastConfig;
  index: number;
  totalCount: number;
  onDismiss: (id: string) => void;
  maxVisibleToasts: number;
}

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  index,
  totalCount,
  onDismiss,
  maxVisibleToasts,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showDetails, setShowDetails] = useState(toast.showDetails || false);
  const toastId = useRef(`toast-${Date.now()}-${Math.random()}`).current;

  const retryBgColor = useMemo(() => {
    return isDark ? colors.surfaceVariant : colors.primaryLight;
  }, [isDark, colors.surfaceVariant, colors.primaryLight]);

  type IconName =
    | "checkmark-circle"
    | "information-circle"
    | "warning"
    | "alert-circle";

  const getConfig = (): {
    icon: IconName;
    background: string;
    textColor: string;
    borderColor: string;
  } => {
    switch (toast.severity || "error") {
      case "success":
        return {
          icon: "checkmark-circle",
          background: isDark ? "rgba(46, 125, 50, 0.95)" : "rgba(76, 175, 80, 0.95)",
          textColor: commonColors.white,
          borderColor: isDark ? "#2E7D32" : "#81C784",
        };
      case "info":
        return {
          icon: "information-circle",
          background: isDark ? "rgba(2, 136, 209, 0.95)" : "rgba(33, 150, 243, 0.95)",
          textColor: commonColors.white,
          borderColor: isDark ? "#0277BD" : "#64B5F6",
        };
      case "warning":
        return {
          icon: "warning",
          background: isDark ? "rgba(230, 81, 0, 0.95)" : "rgba(255, 152, 0, 0.95)",
          textColor: commonColors.white,
          borderColor: isDark ? "#E65100" : "#FFB74D",
        };
      default:
        return {
          icon: "alert-circle",
          background: isDark ? "rgba(198, 40, 40, 0.95)" : "rgba(244, 67, 54, 0.95)",
          textColor: commonColors.white,
          borderColor: isDark ? "#C62828" : "#EF5350",
        };
    }
  };

  const config = getConfig();
  const isTopPosition = toast.position !== "bottom";

  const offsetValue = useMemo(() => {
    const topOffset = Platform.OS === "ios" ? 60 : 40;
    const bottomOffset = 100;
    const itemHeight = 100;
    const gap = 10;

    if (isTopPosition) {
      return topOffset + index * (itemHeight + gap);
    } else {
      return bottomOffset + (totalCount - 1 - index) * (itemHeight + gap);
    }
  }, [index, totalCount, isTopPosition, screenWidth]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      closeTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [toast.duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isTopPosition ? -150 : 150,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDismiss(toastId);
      if (toast.onDismiss) toast.onDismiss();
    });
  };

  const handleRetry = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    handleDismiss();
    if (toast.onRetry) {
      setTimeout(() => toast.onRetry?.(), 300);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          top: isTopPosition ? offsetValue : undefined,
          bottom: !isTopPosition ? offsetValue : undefined,
          backgroundColor: config.background,
          borderColor: config.borderColor,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.toastContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {(() => {
              const IconComp = iconMap[config.icon];
              return IconComp ? (
                <IconComp size={24} color={config.textColor} />
              ) : null;
            })()}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: config.textColor }]} numberOfLines={showDetails ? undefined : 2}>
              {toast.message}
            </Text>
            {toast.code && (
              <Text style={[styles.code, { color: config.textColor }]}>
                {toast.code}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X size={20} color={config.textColor} />
          </TouchableOpacity>
        </View>

        {showDetails && toast.code && (
          <View style={[styles.detailsContainer, { borderTopColor: config.borderColor }]}>
            <Text style={[styles.detailsText, { color: config.textColor }]}>
              {t("common.errorCode")}: {toast.code}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {toast.code && (
            <TouchableOpacity style={styles.detailsButton} onPress={toggleDetails}>
              <Text style={[styles.buttonText, { color: config.textColor }]}>
                {showDetails ? t("common.hideDetails") : t("common.viewDetails")}
              </Text>
              <ChevronRight size={14} color={config.textColor} />
            </TouchableOpacity>
          )}

          {toast.showRetry && (
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: retryBgColor }]}
              onPress={handleRetry}
            >
              <RefreshCw size={16} color={config.textColor} />
              <Text style={[styles.buttonText, { color: config.textColor }]}>
                {toast.retryButtonText || t("common.retry")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export interface ToastManager {
  show: (config: ToastConfig) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  update: (id: string, config: Partial<ToastConfig>) => void;
}

class ToastManagerImpl implements ToastManager {
  private toasts: Map<string, ToastConfig & { id: string }> = new Map();
  private listeners: Set<(toasts: (ToastConfig & { id: string })[]) => void> = new Set();
  private idCounter = 0;

  show(config: ToastConfig): string {
    const id = `toast-${++this.idCounter}-${Date.now()}`;
    const toast = { ...config, id };
    this.toasts.set(id, toast);
    this.notifyListeners();
    return id;
  }

  hide(id: string): void {
    this.toasts.delete(id);
    this.notifyListeners();
  }

  hideAll(): void {
    this.toasts.clear();
    this.notifyListeners();
  }

  update(id: string, config: Partial<ToastConfig>): void {
    const existing = this.toasts.get(id);
    if (existing) {
      this.toasts.set(id, { ...existing, ...config });
      this.notifyListeners();
    }
  }

  subscribe(listener: (toasts: (ToastConfig & { id: string })[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getToasts(): (ToastConfig & { id: string })[] {
    return Array.from(this.toasts.values());
  }

  private notifyListeners(): void {
    const toastList = this.getToasts();
    this.listeners.forEach(listener => listener(toastList));
  }
}

export const toastManager = new ToastManagerImpl();

interface ErrorToastProviderProps {
  children: React.ReactNode;
  maxVisibleToasts?: number;
}

export const ErrorToastProvider: React.FC<ErrorToastProviderProps> = ({
  children,
  maxVisibleToasts = 3,
}) => {
  const [toasts, setToasts] = useState<(ToastConfig & { id: string })[]>([]);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts.slice(-maxVisibleToasts));
    });

    return unsubscribe;
  }, [maxVisibleToasts]);

  const handleDismiss = useCallback((id: string) => {
    toastManager.hide(id);
  }, []);

  return (
    <View style={styles.providerContainer} pointerEvents="box-none">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.safeArea, { paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight || 0 }]} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            totalCount={toasts.length}
            onDismiss={handleDismiss}
            maxVisibleToasts={maxVisibleToasts}
          />
        ))}
      </View>
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
};

interface ErrorToastProps {
  visible: boolean;
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  duration?: number;
  onClose?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryButtonText?: string;
  showRetry?: boolean;
  position?: "top" | "bottom";
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  visible,
  message,
  code,
  severity = "error",
  duration = 5000,
  onClose,
  onRetry,
  onDismiss,
  retryButtonText: retryButtonTextProp,
  showRetry = true,
  position = "top",
}) => {
  const { t } = useTranslation();
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (visible && message) {
      toastIdRef.current = toastManager.show({
        visible: true,
        message,
        code,
        severity,
        duration,
        onRetry,
        onDismiss,
        retryButtonText: retryButtonTextProp,
        showRetry,
        position,
      });
    }

    return () => {
      if (toastIdRef.current) {
        toastManager.hide(toastIdRef.current);
      }
    };
  }, [visible, message]);

  return null;
};

interface ErrorAlertProps {
  visible: boolean;
  message: string;
  code?: string;
  severity?: ErrorSeverity;
  onClose?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  visible,
  message,
  code,
  severity = "error",
  onClose,
  onRetry,
  showRetry = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [localVisible, setLocalVisible] = useState(visible);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  type AlertIconName =
    | "checkmark-circle"
    | "information-circle"
    | "warning"
    | "alert-circle";

  const getConfig = (): { icon: AlertIconName; iconColor: string } => {
    switch (severity) {
      case "success":
        return { icon: "checkmark-circle", iconColor: colors.success };
      case "info":
        return { icon: "information-circle", iconColor: colors.info };
      case "warning":
        return { icon: "warning", iconColor: colors.warning };
      default:
        return { icon: "alert-circle", iconColor: colors.error };
    }
  };

  const config = getConfig();

  useEffect(() => {
    if (visible) {
      setLocalVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setLocalVisible(false);
      if (onClose) onClose();
    });
  };

  if (!localVisible) return null;

  return (
    <View style={styles.alertOverlayContainer} pointerEvents="box-none">
      <Animated.View style={[styles.alertOverlay, { opacity: opacityAnim }]} />
      <Animated.View
        style={[
          styles.alertContainer,
          {
            backgroundColor: colors.surface,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.alertIconContainer}>
          {(() => {
            const IconComp = iconMap[config.icon];
            return IconComp ? (
              <IconComp size={64} color={config.iconColor} />
            ) : null;
          })()}
        </View>
        <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
          {severity === "error"
            ? t("common.error")
            : severity === "success"
              ? t("common.success")
              : severity === "warning"
                ? t("common.warning") || "Warning"
                : t("common.hint")}
        </Text>
        <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
          {message}
        </Text>
        {code && (
          <Text style={[styles.alertCode, { color: colors.textSecondary }]}>
            {t("common.code") || "Code"}: {code}
          </Text>
        )}
        <View style={styles.alertActions}>
          {showRetry && (
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: config.iconColor }]}
              onPress={() => {
                handleClose();
                if (onRetry) onRetry();
              }}
            >
              <Text style={[styles.alertButtonText, { color: commonColors.white }]}>
                {t("common.retry")}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.alertButton,
              showRetry
                ? { backgroundColor: colors.border }
                : { backgroundColor: config.iconColor },
            ]}
            onPress={handleClose}
          >
            <Text
              style={[
                styles.alertButtonText,
                showRetry
                  ? { color: colors.textPrimary }
                  : { color: commonColors.white },
              ]}
            >
              {t("common.confirm")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  providerContainer: {
    flex: 1,
  },
  safeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  childrenContainer: {
    flex: 1,
  },
  toastContainer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 10000,
  },
  toastContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 22,
  },
  code: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  closeButton: {
    padding: spacing.xs,
    margin: -spacing.xs,
  },
  detailsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  detailsText: {
    fontSize: typography.fontSize.xs,
    opacity: 0.9,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  alertOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertContainer: {
    width: "90%",
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  alertIconContainer: {
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  alertMessage: {
    fontSize: typography.fontSize.md,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  alertCode: {
    fontSize: typography.fontSize.xs,
    fontFamily: "monospace",
    marginBottom: spacing.lg,
  },
  alertActions: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  alertButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  alertButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ErrorToast;
