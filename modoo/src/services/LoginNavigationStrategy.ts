import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { findNavigationRule, NavigationRule } from '../config/loginNavigationRules';
import { logger } from '../utils/logger';

export interface ChildProfile {
  id: string;
  nickname: string;
  birthday?: string;
  gender?: string;
  guardianIP?: string;
  sleepProblems?: string | string[];
  createdAt?: string;
}

export interface LoginNavigationParams {
  fromScreen?: string;
  selectedPlanId?: string;
  childProfile?: ChildProfile | null;
}

class ConfigurableNavigationStrategy {
  navigate(
    navigation: NavigationContainerRef<RootStackParamList>,
    params: LoginNavigationParams,
  ): void {
    const { fromScreen, childProfile, selectedPlanId } = params;
    logger.info('Navigation strategy', { fromScreen, hasChild: !!childProfile, selectedPlanId });

    if (childProfile) {
      this.navigateWithProfile(navigation, fromScreen, selectedPlanId);
      return;
    }

    const rule = findNavigationRule(fromScreen);
    logger.info('Navigation rule found', { rule });
    this.navigateWithoutProfile(navigation, rule, selectedPlanId);
  }

  private navigateWithProfile(
    navigation: NavigationContainerRef<RootStackParamList>,
    fromScreen?: string,
    selectedPlanId?: string,
  ): void {
    const navigationMap: Record<string, () => void> = {
      Membership: () => navigation.navigate('Membership', { selectedPlanId }),
      CheckIn: () => navigation.goBack(),
      ParentHome: () => navigation.navigate('Main'),
    };

    const navigateFn = navigationMap[fromScreen || ''] || (() => navigation.goBack());
    navigateFn();
  }

  private navigateWithoutProfile(
    navigation: NavigationContainerRef<RootStackParamList>,
    rule: NavigationRule,
    selectedPlanId?: string,
  ): void {
    const params: Record<string, unknown> = {
      ...rule.params,
      ...(selectedPlanId && { selectedPlanId }),
      onSuccess: this.createOnSuccessCallback(navigation, rule),
    };

    logger.info('Navigating to', { screen: rule.navigateTo, params });
    navigation.navigate(rule.navigateTo as any, params);
  }

  private createOnSuccessCallback(
    navigation: NavigationContainerRef<RootStackParamList>,
    rule: NavigationRule,
  ): () => void {
    const successMap: Record<string, () => void> = {
      Membership: () => navigation.navigate('Membership'),
      CheckIn: () => navigation.goBack(),
      ParentHome: () => navigation.navigate('Main'),
    };

    return successMap[rule.fromScreen] || (() => navigation.goBack());
  }
}

export class LoginNavigationStrategyFactory {
  private readonly strategy: ConfigurableNavigationStrategy;

  constructor() {
    this.strategy = new ConfigurableNavigationStrategy();
  }

  navigate(
    navigation: NavigationContainerRef<RootStackParamList>,
    params: LoginNavigationParams,
  ): void {
    this.strategy.navigate(navigation, params);
  }
}

export const loginNavigationStrategyFactory = new LoginNavigationStrategyFactory();
