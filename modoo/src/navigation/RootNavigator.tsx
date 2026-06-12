import React, { useMemo, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { navigationRef } from './navigationRef';
import {
  EarIcon,
  GraduationCap,
  Leaf,
  Footprints,
  Home,
  Headphones,
  User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, responsive, typography } from '../theme';
import { useAppStore } from '../store';

import {
  RootStackParamList,
  ChildrenTabParamList,
  ParentTabParamList,
  AuthStackParamList,
} from './types';

import { WelcomeHomeScreen } from '../features/home';
import { LoginScreen, GuideScreen } from '../features/auth';

import {
  ChildrenHomeScreen,
  CourseScreen,
  BreathingScreen,
  CheckInScreen,
  CourseDetailScreen,
  BreathingPracticeScreen,
  CourseLearningScreen,
  ChildLockScreen,
  ComfortModeScreen,
} from '../features/child-mode';

import {
  UserDashboardScreen,
  MembershipScreen,
  ChildProfileScreen,
  ParentHomeScreen,
  KnowledgeScreen,
  ServicesScreen,
  ProfileScreen,
  ArticleDetailScreen,
  SettingsScreen,
  DialogueScreen,
  ExpertConsultScreen,
  ExpertBookingsScreen,
  GrowthRecordScreen,
  NotificationSettingsScreen,
  PrivacySettingsScreen,
  AboutUsScreen,
  RelaxSpaceScreen,
  ParentCheckInScreen,
  FavoritesScreen,
} from '../features/parent-mode';

import StoryPlayerScreen from '../features/player/screens/StoryPlayerScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ChildrenStack = createNativeStackNavigator();
const ParentStack = createNativeStackNavigator();
const ChildrenTab = createBottomTabNavigator<ChildrenTabParamList>();
const ParentTab = createBottomTabNavigator<ParentTabParamList>();

function AuthNavigator() {
  const { colors } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function ChildrenTabNavigator({ route, navigation }: { route: { params?: { screen?: string; params?: Record<string, any> } }, navigation: any }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { pendingNavigation, clearPendingNavigation } = useAppStore();

  useEffect(() => {
    console.log('=== ChildrenTabNavigator useEffect (route.params) ===');
    console.log('route.params:', JSON.stringify(route.params));
    
    // 处理从 ChildrenStackNavigator 传递的深层链接
    if (route.params?.screen) {
      console.log('Navigating from route.params to:', route.params.screen);
      // 使用 navigate 方法切换到指定的 tab
      navigation.navigate(route.params.screen as any, route.params.params);
    }
  }, [route.params?.screen, route.params?.params, navigation]);

  useEffect(() => {
    console.log('=== ChildrenTabNavigator useEffect (pendingNavigation) ===');
    console.log('pendingNavigation:', JSON.stringify(pendingNavigation));
    
    if (pendingNavigation) {
      const { screen, params } = pendingNavigation;
      const tabScreens = ['ChildrenHome', 'Course', 'Breathing', 'CheckIn'];
      
      if (tabScreens.includes(screen)) {
        console.log('Navigating from pendingNavigation to tab:', screen);
        // 使用 navigate 方法切换到指定的 tab
        navigation.navigate(screen as any, params);
        clearPendingNavigation();
      }
    }
  }, [pendingNavigation, navigation, clearPendingNavigation]);

  return (
    <ChildrenTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: responsive.verticalScale(80),
          paddingBottom: responsive.verticalScale(20),
          paddingTop: responsive.verticalScale(10),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <ChildrenTab.Screen
        name="ChildrenHome"
        component={ChildrenHomeScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('home.stories')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <EarIcon size={size} color={color} />,
        }}
      />
      <ChildrenTab.Screen
        name="Breathing"
        component={BreathingScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('home.breathing')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <Leaf size={size} color={color} />,
        }}
      />
      <ChildrenTab.Screen
        name="Course"
        component={CourseScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('home.courses')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
        }}
      />
      <ChildrenTab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('home.checkIn')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <Footprints size={size} color={color} />,
        }}
      />
    </ChildrenTab.Navigator>
  );
}

function ChildrenStackNavigator() {
  const { colors } = useTheme();
  const { pendingNavigation, clearPendingNavigation } = useAppStore();
  const navigation = useNavigation() as any;

  useEffect(() => {
    console.log('=== ChildrenStackNavigator useEffect triggered ===');
    console.log('pendingNavigation:', JSON.stringify(pendingNavigation));
    
    if (pendingNavigation) {
      const { screen, params } = pendingNavigation;
      const stackScreens = ['StoryPlayer', 'CourseDetail', 'BreathingPractice', 'CourseLearning'];
      
      if (stackScreens.includes(screen)) {
        // 直接导航到栈屏幕
        console.log('Navigating directly to stack screen:', screen);
        navigation.navigate(screen, params);
        clearPendingNavigation();
        console.log('Stack navigation completed, pendingNavigation cleared');
      }
      // Tab 屏幕导航由 ChildrenTabNavigator 处理
    }
  }, [pendingNavigation, navigation, clearPendingNavigation]);

  return (
    <ChildrenStack.Navigator
      initialRouteName="ChildrenTab"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ChildrenStack.Screen name="ChildrenTab" component={ChildrenTabNavigator} />
      <ChildrenStack.Screen name="StoryPlayer" component={StoryPlayerScreen} />
      <ChildrenStack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <ChildrenStack.Screen name="BreathingPractice" component={BreathingPracticeScreen} />
      <ChildrenStack.Screen name="CourseLearning" component={CourseLearningScreen} />
    </ChildrenStack.Navigator>
  );
}

function ParentTabNavigator({ route, navigation }: { route: { params?: { screen?: string; params?: Record<string, any> } }, navigation: any }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    // 处理从 ParentStackNavigator 传递的 tab 导航
    if (route.params?.screen) {
      navigation.navigate(route.params.screen, route.params.params);
    }
  }, [route.params?.screen, route.params?.params, navigation]);

  return (
    <ParentTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: responsive.verticalScale(70),
          paddingBottom: responsive.verticalScale(15),
          paddingTop: responsive.verticalScale(10),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <ParentTab.Screen
        name="ParentHome"
        component={ParentHomeScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('parentHome.home')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <ParentTab.Screen
        name="Knowledge"
        component={KnowledgeScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('parentHome.knowledge')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <EarIcon size={size} color={color} />,
        }}
      />
      <ParentTab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('parentHome.services')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <Headphones size={size} color={color} />,
        }}
      />
      <ParentTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ color }) => (
            <Text
              style={{
                fontSize: responsive.scaledFontSize(typography.fontSize.xs),
                fontWeight: '500',
                color: color,
              }}
            >
              {t('parentHome.profile')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </ParentTab.Navigator>
  );
}

function ParentStackNavigator() {
  const { colors } = useTheme();
  const { pendingNavigation, clearPendingNavigation } = useAppStore();
  const navigation = useNavigation() as any;

  useEffect(() => {
    console.log('=== ParentStackNavigator useEffect triggered ===');
    console.log('pendingNavigation:', JSON.stringify(pendingNavigation));
    
    if (pendingNavigation) {
      // 添加延迟确保导航器完全挂载
      const timer = setTimeout(() => {
        const { screen, params } = pendingNavigation;
        console.log('Attempting to navigate to:', screen, 'with params:', JSON.stringify(params));
        
        const tabScreens = ['ParentHome', 'Knowledge', 'Services', 'Profile'];
        
        if (tabScreens.includes(screen)) {
          console.log('Navigating to tab screen via ParentTab');
          navigation.navigate('ParentTab', { screen, params });
        } else {
          console.log('Navigating directly to stack screen:', screen);
          navigation.navigate(screen, params);
        }
        clearPendingNavigation();
        console.log('Navigation completed, pendingNavigation cleared');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, navigation, clearPendingNavigation]);

  return (
    <ParentStack.Navigator
      initialRouteName="UserDashboard"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ParentStack.Screen name="UserDashboard" component={UserDashboardScreen} />
      <ParentStack.Screen name="ParentTab" component={ParentTabNavigator} />
      <ParentStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <ParentStack.Screen name="Membership" component={MembershipScreen} />
      <ParentStack.Screen name="Settings" component={SettingsScreen} />
      <ParentStack.Screen name="Dialogue" component={DialogueScreen} />
      <ParentStack.Screen name="ExpertConsult" component={ExpertConsultScreen} />
      <ParentStack.Screen name="ExpertBookings" component={ExpertBookingsScreen} />
      <ParentStack.Screen name="GrowthRecord" component={GrowthRecordScreen} />
      <ParentStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <ParentStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <ParentStack.Screen name="AboutUs" component={AboutUsScreen} />
      <ParentStack.Screen name="RelaxSpace" component={RelaxSpaceScreen} />
      <ParentStack.Screen name="ParentCheckIn" component={ParentCheckInScreen} />
      <ParentStack.Screen name="Favorites" component={FavoritesScreen} />
    </ParentStack.Navigator>
  );
}

function MainNavigator() {
  const { isChildMode } = useAppStore();

  if (isChildMode) {
    return <ChildrenStackNavigator />;
  }
  return <ParentStackNavigator />;
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={screenOptions}>
        <RootStack.Screen name="Guide" component={GuideScreen} />
        <RootStack.Screen name="Home" component={WelcomeHomeScreen} />
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen name="Membership" component={MembershipScreen} />
        <RootStack.Screen
          name="ChildLock"
          component={ChildLockScreen}
          options={{ presentation: 'modal' }}
        />
        <RootStack.Screen
          name="ComfortMode"
          component={ComfortModeScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <RootStack.Screen
          name="ChildProfile"
          component={ChildProfileScreen}
          options={{ presentation: 'card' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
