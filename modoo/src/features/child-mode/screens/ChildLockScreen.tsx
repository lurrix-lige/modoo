import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, commonColors, sharedStyles } from '../../../theme';
import { useAppStore } from '../../../store';
import { ChildLockModal } from '../../../components';
import { RootStackParamList } from '../../../navigation/types';

type ChildLockNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChildLock'>;

export default function ChildLockScreen() {
  const navigation = useNavigation<ChildLockNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { switchToParentMode, isChildMode } = useAppStore();
  const [showChildLock, setShowChildLock] = useState(true);

  const handleSuccess = () => {
    setShowChildLock(false);
    switchToParentMode();
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Lock size={48} color={commonColors.white} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('childLock.parentVerification')}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('childLock.verificationDesc')}
        </Text>
      </View>

      <ChildLockModal visible={showChildLock} onSuccess={handleSuccess} onCancel={handleCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  description: {
    alignContent: 'center',
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 100,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
});
