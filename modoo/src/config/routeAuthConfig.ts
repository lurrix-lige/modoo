export interface RouteAuthConfig {
  screenName: string;
  authRequired: boolean;
  paidRequired: boolean;
}

export const AUTH_EXEMPT_ROUTES: RouteAuthConfig[] = [
  { screenName: 'Guide', authRequired: false, paidRequired: false },
  { screenName: 'Home', authRequired: false, paidRequired: false },
  { screenName: 'Login', authRequired: false, paidRequired: false },
  { screenName: 'ChildrenHome', authRequired: false, paidRequired: false },
  { screenName: 'Course', authRequired: false, paidRequired: false },
  { screenName: 'Breathing', authRequired: false, paidRequired: false },
  { screenName: 'CheckIn', authRequired: false, paidRequired: false },
  { screenName: 'StoryPlayer', authRequired: false, paidRequired: false },
  { screenName: 'CourseDetail', authRequired: false, paidRequired: false },
  { screenName: 'BreathingPractice', authRequired: false, paidRequired: false },
  { screenName: 'ChildLock', authRequired: false, paidRequired: false },
  { screenName: 'ComfortMode', authRequired: false, paidRequired: false },
];

export function isRouteAuthExempt(screenName: string): boolean {
  const route = AUTH_EXEMPT_ROUTES.find(r => r.screenName === screenName);
  return route ? !route.authRequired : true;
}

export function isRoutePaidRequired(screenName: string): boolean {
  const route = AUTH_EXEMPT_ROUTES.find(r => r.screenName === screenName);
  return route ? route.paidRequired : false;
}