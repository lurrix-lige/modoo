import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePermission } from '../hooks';
import { PermissionLevel } from '../hooks/usePermission';
import { logger } from '../utils/logger';

interface PermissionGateProps {
  requiredLevel: PermissionLevel;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ requiredLevel, children, fallback }: PermissionGateProps) {
  const { hasPermission, redirectTo, reason } = usePermission(requiredLevel);
  const navigation = useNavigation();

  useEffect(() => {
    if (!hasPermission && redirectTo) {
      navigation.navigate(redirectTo as never);
    }
  }, [hasPermission, redirectTo, navigation]);

  useEffect(() => {
    if (!hasPermission && reason === 'not_authenticated') {
      logger.debug('[PermissionGate] User not authenticated, redirecting...');
    } else if (!hasPermission && reason === 'no_membership') {
      logger.debug('[PermissionGate] User has no active membership');
    }
  }, [hasPermission, reason]);

  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
}
