import { useAppStore } from '../store';
import {
  AUTH_EXEMPT_ROUTES,
  isRouteAuthExempt,
  isRoutePaidRequired,
} from '../config/routeAuthConfig';

export interface RoutePermissionResult {
  hasPermission: boolean;
  redirectTo: string | null;
  reason: 'anonymous' | 'not_authenticated' | 'no_membership' | 'ok';
}

export function useRoutePermission(screenName: string): RoutePermissionResult {
  const { userState } = useAppStore();
  const { isAuthenticated, isPaid } = userState;

  if (isRouteAuthExempt(screenName)) {
    return { hasPermission: true, redirectTo: null, reason: 'ok' };
  }

  const paidRequired = isRoutePaidRequired(screenName);

  if (!isAuthenticated) {
    return { hasPermission: false, redirectTo: 'Auth', reason: 'not_authenticated' };
  }

  if (paidRequired && !isPaid) {
    return { hasPermission: false, redirectTo: 'Membership', reason: 'no_membership' };
  }

  return { hasPermission: true, redirectTo: null, reason: 'ok' };
}

export function getAllAuthExemptRoutes(): string[] {
  return AUTH_EXEMPT_ROUTES.filter((route) => !route.authRequired).map((route) => route.screenName);
}

export function getChildrenRoutes(): string[] {
  return AUTH_EXEMPT_ROUTES.filter((route) =>
    [
      'ChildrenHome',
      'Course',
      'Breathing',
      'CheckIn',
      'StoryPlayer',
      'CourseDetail',
      'BreathingPractice',
    ].includes(route.screenName),
  ).map((route) => route.screenName);
}
