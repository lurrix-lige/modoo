import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePermission } from '../hooks';
import { PermissionLevel } from '../hooks/usePermission';
import { AuthModal } from '../features/auth/components/AuthModal';
import { logger } from '../utils/logger';

interface PermissionGateProps {
  requiredLevel: PermissionLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** 'redirect': navigate away to Auth/Membership (default). 'modal': show inline AuthModal. */
  mode?: 'redirect' | 'modal';
  /** Custom title for AuthModal when mode='modal' */
  authTitle?: string;
  /** Custom message for AuthModal when mode='modal' */
  authMessage?: string;
}

export function PermissionGate({
  requiredLevel,
  children,
  fallback,
  mode = 'redirect',
  authTitle,
  authMessage,
}: PermissionGateProps) {
  const { hasPermission, redirectTo, reason } = usePermission(requiredLevel);
  const navigation = useNavigation();
  const [dismissed, setDismissed] = useState(false);

  const handleLogin = useCallback(() => {
    navigation.navigate('Auth' as never);
  }, [navigation]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    navigation.goBack();
  }, [navigation]);

  // Permission granted — render children
  if (hasPermission) {
    return <>{children}</>;
  }

  // User dismissed the modal — show nothing (or custom fallback)
  if (dismissed && mode === 'modal') {
    return fallback ? <>{fallback}</> : null;
  }

  // Modal mode: show inline AuthModal (children hidden until permission granted)
  if (mode === 'modal') {
    logger.debug('[PermissionGate] Showing AuthModal', { reason, requiredLevel });
    return (
      <AuthModal
        visible={true}
        onLogin={handleLogin}
        onDismiss={handleDismiss}
        title={authTitle}
        message={authMessage}
      />
    );
  }

  // Redirect mode: navigate away (original behavior)
  if (redirectTo) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      navigation.navigate(redirectTo as never);
    }, 0);
  }

  return fallback ? <>{fallback}</> : null;
}
