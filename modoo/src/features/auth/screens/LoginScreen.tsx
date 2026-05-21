/**
 * LoginScreen - 用户登录页面
 *
 * 功能说明：
 * - 提供手机验证码登录方式
 * - 支持 Apple 登录
 * - 支持微信登录（预留）
 * - 登录成功后同步儿童档案信息
 * - 根据来源页面引导用户跳转至目标页面
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Moon, PhoneCall, Key } from 'lucide-react-native';
import { WechatIcon } from '../../../components/icons/WechatIcon';
import { AppleIcon } from '../../../components/icons/AppleIcon';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationContainerRef } from '@react-navigation/native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
  responsive,
} from '../../../theme';
import { useAppStore } from '../../../store';
import { Button } from '../../../components';
import { AuthStackParamList, RootStackParamList } from '../../../navigation/types';
import { authService, apiService } from '../../../services';
import { loginNavigationStrategyFactory } from '../../../services/LoginNavigationStrategy';
import { appleService } from '../../../services/AppleService';
import { wechatAuthService } from '../../../services/WechatAuthService';
import { normalizeSleepProblems, parseGender, parseGuardianIP } from '../../../utils/childProfile';
import { logger } from '../../../utils/logger';

/**
 * 导航类型定义
 * @description 用于类型安全的导航参数传递
 */
type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

export default function LoginScreen() {
  // ==================== 状态与依赖声明 ====================
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route = useRoute<LoginScreenRouteProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { setAuthenticated, setChild } = useAppStore();

  /**
   * 路由参数说明
   * @param fromScreen - 登录来源页面，用于登录后返回原页面
   * @param selectedPlanId - 选中的订阅计划ID，用于跳转至支付页面
   */
  const fromScreen = route.params?.fromScreen;
  const selectedPlanId = route.params?.selectedPlanId;

  // 输入框引用
  // 手机号输入框引用
  const phoneInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  // 输入状态
  // 手机号输入状态
  const [phone, setPhone] = useState(''); // 手机号输入状态
  const [code, setCode] = useState(''); // 验证码输入状态
  const [countdown, setCountdown] = useState(0); // 倒计时秒数
  const [loading, setLoading] = useState(false); // 手机登录加载状态
  const [appleLoading, setAppleLoading] = useState(false); // Apple登录加载状态
  const [wechatLoading, setWechatLoading] = useState(false); // 微信登录加载状态

  /**
   * 页面加载完成后自动聚焦到手机号输入框
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      // phoneInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 手机号格式验证规则
   * @description 中国大陆手机号格式：1开头，第二位为3-9，后9位为数字
   * @param phone - 待验证的手机号
   * @returns boolean - 是否符合格式
   */
  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  /**
   * 处理手机号输入变化
   * @description 当手机号输入完成且格式正确时，自动跳转到验证码输入框
   */
  const handlePhoneChange = (text: string) => {
    setPhone(text);

    // 当输入完1位且格式正确时，自动跳转到验证码输入框
    if (isValidPhoneNumber(text)) {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 50);
    }
  };

  // ==================== 业务逻辑函数 ====================

  /**
   * 同步儿童档案
   * @description 登录成功后，从API获取儿童档案并存储到本地
   * @returns Promise<void>
   *
   * 处理流程
   * 1. 检查本地是否已存在儿童档案，存在则跳过
   * 2. 从API获取儿童档案信息
   * 3. 转换数据格式（性别、生日、监护精灵等）
   * 4. 存储到本地AuthService和全局状态
   */
  const syncChildProfile = async (): Promise<void> => {
    const existingChildProfile = await authService.getChild();
    if (existingChildProfile) return;

    const apiChildProfile = await apiService.getChildProfile();
    if (!apiChildProfile) return;

    const childData = {
      id: apiChildProfile.id,
      nickname: apiChildProfile.nickname,
      birthday: apiChildProfile.birthday,
      gender: parseGender(apiChildProfile.gender),
      guardianIP: parseGuardianIP(apiChildProfile.guardianSpiritId),
      sleepProblems: normalizeSleepProblems(apiChildProfile.sleepProblems),
      createdAt: apiChildProfile.createdAt || new Date().toISOString(),
    };

    await authService.setChild(childData);
    setChild(childData);
  };

  /**
   * Apple 登录处理
   * @description 处理 Apple ID 登录流程
   *
   * 处理流程
   * 1. 检查Apple登录是否可用
   * 2. 调用 appleService.login 获取用户授权信息
   * 3. 使用授权码调用后端API完成登录
   * 4. 设置认证状态并同步儿童档案
   * 5. 根据来源页面导航至目标页面
   *
   * 错误处理
   * - 用户取消登录时不提示错误
   * - 其他错误统一提示"Apple登录失败"
   */
  const handleAppleLogin = async () => {
    if (!appleService.isAvailable()) {
      Alert.alert(t('common.hint'), t('auth.appleNotAvailable'));
      return;
    }

    setAppleLoading(true);
    try {
      const userInfo = await appleService.login();
      if (!userInfo.authorizationCode) {
        throw new Error('No authorization code received');
      }

      const user = await authService.appleLogin(
        userInfo.authorizationCode,
        userInfo.identityToken || '',
      );

      setAuthenticated(true, user);
      await syncChildProfile();

      const parentNavigation =
        navigation.getParent() as NavigationContainerRef<RootStackParamList> | null;
      parentNavigation &&
        loginNavigationStrategyFactory.navigate(parentNavigation, {
          fromScreen,
          selectedPlanId,
          childProfile: await authService.getChild(),
        });
    } catch (error) {
      const errorMessage = (error as any).message;
      if (errorMessage !== 'User cancelled Apple Sign In') {
        logger.error('Apple login failed', { error });
        Alert.alert(t('common.error'), t('auth.appleLoginFailed'));
      }
    } finally {
      setAppleLoading(false);
    }
  };

  /**
   * 微信登录处理
   * @description 使用微信授权登录
   */
  const handleWeChatLogin = async () => {
    if (!wechatAuthService.isInstalled()) {
      Alert.alert(t('common.hint'), t('auth.wechatNotInstalled'));
      return;
    }

    setWechatLoading(true);
    try {
      const { code } = await wechatAuthService.login();
      const user = await authService.wechatLogin(code);

      setAuthenticated(true, user);

      await syncChildProfile();

      const parentNavigation =
        navigation.getParent() as NavigationContainerRef<RootStackParamList> | null;
      parentNavigation &&
        loginNavigationStrategyFactory.navigate(parentNavigation, {
          fromScreen,
          selectedPlanId,
          childProfile: await authService.getChild(),
        });
    } catch (err: unknown) {
      const e = err as { code?: string | number; message?: string };
      if (e.code === 'USER_CANCELLED' || e.code === -2) {
        return;
      }
      if (e.code === 'NOT_INSTALLED') {
        Alert.alert(t('common.hint'), t('auth.wechatNotInstalled'));
        return;
      }
      logger.error('WeChat login failed', { error: err });
      Alert.alert(t('common.error'), e.message || t('auth.wechatLoginFailed'));
    } finally {
      setWechatLoading(false);
    }
  };

  /**
   * 获取验证码
   * @description 发送手机验证码到用户手机号
   *
   * 前置校验
   * - 手机号长度必须为11位
   *
   * 发送后逻辑
   * - 启动60秒倒计时
   * - 倒计时期间禁用发送按钮
   *
   * @see handleLogin 使用验证码进行登录
   */
  const handleGetCode = async () => {
    if (phone.length !== 11) {
      Alert.alert(t('common.hint'), t('auth.invalidPhone'));
      return;
    }

    try {
      await authService.sendVerificationCode(phone);

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert(t('common.hint'), t('auth.codeSent'));
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.codeSendFailed'));
    }
  };

  /**
   * 手机号登录
   * @description 使用手机号和验证码进行登录
   *
   * 前置校验
   * - 手机号长度必须为11位
   * - 验证码长度必须为6位
   *
   * 登录后逻辑
   * 1. 调用 authService.login 完成认证
   * 2. 设置全局认证状态
   * 3. 同步儿童档案信息
   * 4. 根据登录来源和儿童档案状态导航至目标页面
   */
  const handleLogin = async () => {
    if (phone.length !== 11 || code.length !== 6) {
      Alert.alert(t('common.hint'), t('auth.invalidPhoneAndCode'));
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(phone, code);
      setAuthenticated(true, user);

      await syncChildProfile();

      const parentNavigation =
        navigation.getParent() as NavigationContainerRef<RootStackParamList> | null;
      parentNavigation &&
        loginNavigationStrategyFactory.navigate(parentNavigation, {
          fromScreen,
          selectedPlanId,
          childProfile: await authService.getChild(),
        });
    } catch (error) {
      logger.error('Phone login failed', { error, phone });
      Alert.alert(t('common.error'), t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ==================== 页面渲染 ====================
  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        {/* ------------------- 键盘输入区域 ------------------- */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* ------------------- 页面头部 ------------------- */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Moon size={60} color={commonColors.white} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('auth.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('auth.subtitle')}
            </Text>
          </View>

          {/* ------------------- 登录表单 ------------------- */}
          <View style={styles.form}>
            {/* 手机号输入框 */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <PhoneCall size={20} color={colors.textSecondary} />
              <TextInput
                ref={phoneInputRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={colors.textPlaceholder}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={11}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* 验证码输入框 + 发送按钮 */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Key size={20} color={colors.textSecondary} />
              <TextInput
                ref={codeInputRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder={t('auth.codePlaceholder')}
                placeholderTextColor={colors.textPlaceholder}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={[
                  styles.codeButton,
                  { backgroundColor: countdown > 0 ? colors.disabled : colors.primary },
                ]}
                onPress={handleGetCode}
                disabled={countdown > 0}
              >
                <Text style={[styles.codeText, { color: commonColors.white }]}>
                  {countdown > 0
                    ? t('auth.countdownSeconds', { count: countdown })
                    : t('auth.sendCode')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 登录按钮 */}
            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            {/* ------------------- 分隔线 ------------------- */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                {t('auth.or')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          </View>

          {/* ------------------- 第三方登录按钮 ------------------- */}
          <View style={styles.socialButtons}>
            {/* Apple 登录按钮 */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surface }]}
              onPress={handleAppleLogin}
              disabled={appleLoading}
            >
              {appleLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <AppleIcon size={24} />
              )}
              <Text style={[styles.socialText, { color: colors.textPrimary }]}>
                {t('auth.appleLogin')}
              </Text>
            </TouchableOpacity>
            {/* 微信登录按钮 */}
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surface }]}
              onPress={handleWeChatLogin}
              disabled={wechatLoading}
            >
              {wechatLoading ? (
                <ActivityIndicator color={colors.success} />
              ) : (
                <WechatIcon size={24} />
              )}
              <Text style={[styles.socialText, { color: colors.textPrimary }]}>
                {t('auth.wechatLogin')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ------------------- 用户协议 ------------------- */}
          <View style={styles.agreement}>
            <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
              &nbsp; {t('auth.agreement')} &nbsp;
            </Text>
            <TouchableOpacity accessible={true} accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.primaryDark }]}>
                {t('auth.userAgreement')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
              &nbsp; {t('auth.and')} &nbsp;
            </Text>
            <TouchableOpacity accessible={true} accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.primaryDark }]}>
                {t('auth.privacyPolicy')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.agreementText, { color: colors.textSecondary }]}>&nbsp;.</Text>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaContainer>
  );
}

// ==================== 样式定义 ====================
const styles = StyleSheet.create({
  agreement: {
    ...sharedStyles.rowCenter,
    flexWrap: 'wrap',
  },
  agreementText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  codeButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  codeText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    ...sharedStyles.rowCenter,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginHorizontal: spacing.md,
  },
  form: {
    marginBottom: spacing.xl,
  },
  header: {
    ...sharedStyles.columnCenter,
    marginBottom: spacing.xxxl,
    marginTop: spacing.xxxl,
  },
  input: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    height: '100%',
    marginLeft: spacing.sm,
  },
  inputContainer: {
    ...sharedStyles.rowStart,
    borderRadius: borderRadius.md,
    borderWidth: 0,
    height: responsive.verticalScale(56),
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  keyboardView: {
    padding: spacing.xl,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
  },
  linkText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  loginButton: {
    marginTop: spacing.md,
  },
  logoContainer: {
    borderRadius: responsive.moderateScale(60),
    height: responsive.moderateScale(120),
    width: responsive.moderateScale(120),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.lg,
  },
  socialButton: {
    flex: 1,
    ...sharedStyles.rowCenter,
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(56),
    marginHorizontal: spacing.xs,
    ...shadows.small,
  },
  socialButtons: {
    ...sharedStyles.rowBetween,
    marginBottom: spacing.md,
    marginHorizontal: 0,
  },
  socialText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxxl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
});
