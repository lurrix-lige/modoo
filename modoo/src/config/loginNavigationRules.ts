export interface NavigationRule {
  fromScreen: string | '*';
  requireChildProfile: boolean;
  navigateTo: string;
  params?: Record<string, unknown>;
}

export const LOGIN_NAVIGATION_RULES: NavigationRule[] = [
  {
    fromScreen: 'Membership',
    requireChildProfile: true,
    navigateTo: 'ChildProfile',
    params: { mode: 'create', source: 'membership' },
  },
  {
    fromScreen: 'CheckIn',
    requireChildProfile: true,
    navigateTo: 'ChildProfile',
    params: { mode: 'create', source: 'checkin' },
  },
  {
    fromScreen: '*',
    requireChildProfile: false,
    navigateTo: 'ChildProfile',
    params: { mode: 'create', source: 'auth', optional: true },
  },
];

export const findNavigationRule = (fromScreen?: string): NavigationRule => {
  return LOGIN_NAVIGATION_RULES.find(rule => 
    rule.fromScreen === fromScreen || rule.fromScreen === '*'
  ) || LOGIN_NAVIGATION_RULES[LOGIN_NAVIGATION_RULES.length - 1];
};