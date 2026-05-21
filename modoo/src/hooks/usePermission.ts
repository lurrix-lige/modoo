import { useAppStore } from '../store';

export type PermissionLevel = 0 | 1 | 2 | 3;

interface PermissionResult {
  hasPermission: boolean;
  redirectTo: string | null;
  reason: 'anonymous' | 'not_authenticated' | 'no_membership' | 'ok';
}

const PERMISSION_REQUIREMENTS: Record<
  PermissionLevel,
  { authRequired: boolean; paidRequired: boolean }
> = {
  0: { authRequired: false, paidRequired: false },
  1: { authRequired: true, paidRequired: false },
  2: { authRequired: true, paidRequired: true },
  3: { authRequired: true, paidRequired: true },
};

export function usePermission(requiredLevel: PermissionLevel): PermissionResult {
  const { userState } = useAppStore();
  const { isAuthenticated, isPaid } = userState;
  const requirement = PERMISSION_REQUIREMENTS[requiredLevel];

  if (!requirement.authRequired) {
    return { hasPermission: true, redirectTo: null, reason: 'ok' };
  }

  if (!isAuthenticated) {
    return { hasPermission: false, redirectTo: 'Auth', reason: 'not_authenticated' };
  }

  if (requirement.paidRequired && !isPaid) {
    return { hasPermission: false, redirectTo: 'Membership', reason: 'no_membership' };
  }

  return { hasPermission: true, redirectTo: null, reason: 'ok' };
}
