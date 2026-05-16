import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Moon, Sun, User, Mars, Venus, Cloud, Clock, Cake, Bed, Plus, X, CheckCircle, Camera, ChevronRight, Check, Zap } from 'lucide-react-native';
import GuardianSpirit from '../../../components/GuardianSpirit';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, componentIconSizes } from '../../../theme';
import { useAppStore } from '../../../store';
import { Button, DatePickerModal } from '../../../components';
import { RootStackParamList, ChildProfileParams } from '../../../navigation/types';
import { useNavigationCallback } from '../../../contexts';
import { apiService, authService } from '../../../services';
import { normalizeSleepProblems, parseGender, parseGuardianSpiritId } from '../../../utils/childProfile';
import { logger } from '../../../utils/logger';
import { GUARDIAN_SPIRIT_CONFIG } from '../../../constants/guardianSpirits';

const guardianSpirits = GUARDIAN_SPIRIT_CONFIG;

type ChildProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChildProfile'>;
type ChildProfileScreenRouteProp = RouteProp<{ ChildProfile: ChildProfileParams }, 'ChildProfile'>;

const SLEEP_PROBLEMS = [
  { id: 'dark', labelKey: 'childProfile.sleepProblems.dark', icon: 'moon' },
  { id: 'alone', labelKey: 'childProfile.sleepProblems.alone', icon: 'person' },
  { id: 'nightmare', labelKey: 'childProfile.sleepProblems.nightmare', icon: 'cloud' },
  { id: 'wake', labelKey: 'childProfile.sleepProblems.wake', icon: 'alarm' },
  { id: 'late', labelKey: 'childProfile.sleepProblems.late', icon: 'time' },
];

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
};

const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : dateString;
};

const normalizeDateForApi = (dateString: string) => {
  const match = dateString.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : dateString;
};

const childProfileIconMap = {
  'arrow-back': ArrowLeft,
  'moon': Moon,
  'sunny': Sun,
  'person': User,
  'cloud': Cloud,
  'time': Bed,
  'add': Plus,
  'close': X,
  'checkmark-circle': CheckCircle,
  'camera': Camera,
  'chevron-forward': ChevronRight,
  'checkmark': Check,
  'zap': Zap,
  'alarm': Clock,
};

export default function ChildProfileScreen() {
  const navigation = useNavigation<ChildProfileScreenNavigationProp>();
  const route = useRoute<ChildProfileScreenRouteProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setChild, setAuthenticated } = useAppStore();
  const { triggerCallback } = useNavigationCallback();

  const params = route.params || { mode: 'create' as const };

  const [viewMode, setViewMode] = useState<'view' | 'edit'>(params.mode === 'view' ? 'view' : 'edit');
  const [nickname, setNickname] = useState(params.initialData?.nickname || '');
  const [birthday, setBirthday] = useState(formatDateForInput(params.initialData?.birthday || ''));
  const [gender, setGender] = useState<'male' | 'female' | null>(params.initialData?.gender || null);
  const [selectedSpirit, setSelectedSpirit] = useState<'moon' | 'firefly' | 'star'>(
    params.initialData?.guardianSpiritId || params.initialData?.guardianIP || 'moon'
  );
  const [selectedProblems, setSelectedProblems] = useState<string[]>(params.initialData?.sleepProblems || []);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleProblem = (id: string) => {
    setSelectedProblems(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    logger.debug('handleSave called');
    logger.debug('Form values', { nickname, birthday, gender, selectedSpirit, selectedProblems });

    if (!nickname.trim()) {
      logger.debug('Validation failed: nickname is empty');
      Alert.alert(t('childProfile.hint'), t('childProfile.nicknameError'));
      return;
    }

    if (!birthday.trim()) {
      logger.debug('Validation failed: birthday is empty');
      Alert.alert(t('childProfile.hint'), t('childProfile.birthdayError'));
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
      logger.debug('Validation failed: birthday format invalid');
      Alert.alert(t('childProfile.hint'), t('childProfile.birthdayFormatError'));
      return;
    }

    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      logger.debug('Validation failed: birthday date is invalid');
      Alert.alert(t('childProfile.hint'), t('childProfile.birthdayFormatError'));
      return;
    }

    if (birthdayDate > new Date()) {
      logger.debug('Validation failed: birthday is in the future');
      Alert.alert(t('childProfile.hint'), t('childProfile.birthdayFutureError'));
      return;
    }

    if (!gender) {
      logger.debug('Validation failed: gender is not selected');
      Alert.alert(t('childProfile.hint'), t('childProfile.genderError'));
      return;
    }

    logger.debug('Validation passed, setting loading to true');
    setLoading(true);

    try {
      logger.debug('Starting API call');
      let child;
      const isCreateMode = params.mode === 'create';
      const apiBirthday = normalizeDateForApi(birthday);

      if (isCreateMode) {
        logger.debug('Calling createChildProfile');
        child = await apiService.createChildProfile({
          nickname,
          birthday: apiBirthday,
          gender,
          guardianSpiritId: selectedSpirit,
          sleepProblems: selectedProblems.join(','),
        });
      } else {
        logger.debug('Calling updateChildProfile');
        child = await apiService.updateChildProfile({
          nickname,
          birthday: apiBirthday,
          gender,
          guardianSpiritId: selectedSpirit,
          sleepProblems: selectedProblems.join(','),
        });
      }

      logger.debug('API call successful', { child });

      const childData = {
        id: child.id,
        nickname: child.nickname,
        birthday: child.birthday,
        gender: parseGender(child.gender),
        guardianSpiritId: parseGuardianSpiritId(child.guardianSpiritId),
        sleepProblems: normalizeSleepProblems(child.sleepProblems),
        createdAt: child.createdAt || new Date().toISOString(),
      };

      // 
      logger.debug('Updating local state');
      await authService.setChild(childData);
      setChild(childData);
      setViewMode('view');

      // ?      logger.debug('Showing success alert immediately');
      Alert.alert(
        t('childProfile.success'),
        isCreateMode ? t('childProfile.createSuccess') : t('childProfile.updateSuccess'),
        [{
          text: t('common.ok'),
          onPress: () => {
            if (params.callbackId) {
              triggerCallback(params.callbackId);
            }
            navigation.navigate('Main');
          }
        }]
      );

      //  profile UI
      logger.debug('Fetching user profile in background');
      try {
        const userProfile = await apiService.getUserProfile();
        setAuthenticated(true, {
          id: userProfile.id,
          phone: userProfile.phone,
          nickname: userProfile.nickname,
          avatar: userProfile.avatar,
          createdAt: new Date().toISOString(),
        });
      } catch (profileError) {
        //  profile 
        logger.error('Failed to fetch user profile in background', { profileError });
      }

    } catch (error) {
      logger.error('Failed to save child profile', { error });
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      logger.debug('Showing error alert', { errorMessage });
      Alert.alert(
        t('childProfile.error'),
        `${params.mode === 'edit' ? t('childProfile.updateError') : t('childProfile.createError')}\n\n${errorMessage}`
      );
    } finally {
      logger.debug('Setting loading to false');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    logger.debug('handleEdit called');
    setViewMode('edit');
  };

  const renderViewMode = () => {
    const guardianSpirit = guardianSpirits.find(sp => sp.id === selectedSpirit);
    const selectedProblemItems = SLEEP_PROBLEMS.filter(p => selectedProblems.includes(p.id));

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{nickname?.charAt(0) || t('childProfile.defaultAvatar')}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{nickname || t('common.noData')}</Text>
            <Text style={[styles.profileBadge, { color: colors.textSecondary }]}>
              {gender === 'male' ? t('childProfile.male') : t('childProfile.female')}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryLight }]}>
              <Cake size={componentIconSizes.childProfile.infoIcon} color={colors.textPrimary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('childProfile.birthday')}</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{formatDate(birthday)}</Text>
            </View>
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: colors.successLight }]}>
              {gender === 'male' ? (
                <Mars size={componentIconSizes.childProfile.infoIcon} color={colors.textPrimary} />
              ) : (
                <Venus size={componentIconSizes.childProfile.infoIcon} color={colors.textPrimary} />
              )}
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('childProfile.gender')}</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {gender === 'male' ? t('childProfile.male') : t('childProfile.female')}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.guardianCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('childProfile.guardianTitle')}</Text>
          {guardianSpirit && (
            <View style={styles.guardianContent}>
              <GuardianSpirit
                icon={guardianSpirit.icon}
                size={responsive.isLargeScreen ? 64 : 56}
                color={guardianSpirit.color}
                animationType="none"
                animated={false}
              />
              <View style={styles.guardianInfo}>
                <Text style={[styles.guardianName, { color: colors.textPrimary }]}>{t(guardianSpirit.nameKey)}</Text>
                <Text style={[styles.guardianDesc, { color: colors.textSecondary }]}>
                  {t('home.guardianSpeech', { guardianName: t(guardianSpirit.nameKey) })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {selectedProblemItems.length > 0 && (
          <View style={[styles.problemsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('childProfile.sleepProblemsTitle')}</Text>
            <View style={styles.problemsContainer}>
              {selectedProblemItems.map(problem => {
                const IconComp = childProfileIconMap[problem.icon as keyof typeof childProfileIconMap] || Clock;
                return (
                  <View
                    key={problem.id}
                    style={[
                      styles.problemChip,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <IconComp size={componentIconSizes.childProfile.problemChip} color={commonColors.white} />
                    <Text style={[styles.problemText, { color: commonColors.white }]}>
                      {t(problem.labelKey)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {selectedProblemItems.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('common.noData')}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderEditMode = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('childProfile.nickname')}</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t('childProfile.nicknamePlaceholder')}
              placeholderTextColor={colors.textPlaceholder}
              value={nickname}
              onChangeText={setNickname}
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('childProfile.birthday')}</Text>
          <TouchableOpacity
            style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Cake size={componentIconSizes.childProfile.inputIcon} color={colors.textSecondary} />
            <Text
              style={[
                styles.input,
                { color: birthday ? colors.textPrimary : colors.textPlaceholder },
              ]}
            >
              {birthday ? formatDate(birthday) : t('childProfile.birthdayPlaceholder')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('childProfile.gender')}</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: gender === 'male' ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.8}
            >
              <Mars size={componentIconSizes.childProfile.genderButton} color={gender === 'male' ? commonColors.white : colors.textSecondary} />
              <Text style={[styles.genderText, { color: gender === 'male' ? commonColors.white : colors.textPrimary }]}>
                {t('childProfile.male')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                {
                  backgroundColor: gender === 'female' ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.8}
            >
              <Venus size={componentIconSizes.childProfile.genderButton} color={gender === 'female' ? commonColors.white : colors.textSecondary} />
              <Text style={[styles.genderText, { color: gender === 'female' ? commonColors.white : colors.textPrimary }]}>
                {t('childProfile.female')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('childProfile.guardianTitle')}</Text>
          <View style={styles.ipRow}>
            {guardianSpirits.map(spirit => (
              <TouchableOpacity
                key={spirit.id}
                style={[
                  styles.ipButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selectedSpirit === spirit.id ? spirit.color : colors.border,
                    borderWidth: selectedSpirit === spirit.id ? 3 : 2,
                  },
                ]}
                onPress={() => setSelectedSpirit(spirit.id)}
                activeOpacity={0.8}
              >
                <GuardianSpirit
                  icon={spirit.icon}
                  size={responsive.isLargeScreen ? 64 : 56}
                  color={spirit.color}
                  animationType="none"
                  animated={false}
                  name={t(spirit.nameKey)}
                  nameColor={selectedSpirit === spirit.id ? commonColors.white : colors.textPrimary}
                  nameSize={responsive.scaledFontSize(typography.fontSize.md)}
                  nameMaxWidth={responsive.moderateScale(80)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('childProfile.sleepProblemsTitle')}</Text>
          <View style={styles.problemsGrid}>
            {SLEEP_PROBLEMS.map(problem => {
              const IconComp = childProfileIconMap[problem.icon as keyof typeof childProfileIconMap] || Clock;
              const isSelected = selectedProblems.includes(problem.id);
              return (
                <TouchableOpacity
                  key={problem.id}
                  style={[
                    styles.problemButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleProblem(problem.id)}
                  activeOpacity={0.8}
                >
                  <IconComp size={componentIconSizes.childProfile.problemButton} color={isSelected ? commonColors.white : colors.textSecondary} />
                  <Text
                    style={[
                      styles.problemText,
                      {
                        color: isSelected ? commonColors.white : colors.textPrimary,
                      },
                    ]}
                  >
                    {t(problem.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <ArrowLeft size={componentIconSizes.childProfile.backButton} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('childProfile.title')}</Text>
        {viewMode === 'view' && (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.8}>
            <Plus size={componentIconSizes.childProfile.editButton} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'view' ? renderViewMode() : renderEditMode()}

      {viewMode === 'edit' && (
        <View style={styles.footer}>
          <Button title={t('childProfile.complete')} onPress={handleSave} loading={loading} />
        </View>
      )}

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={setBirthday}
        initialDate={birthday || undefined}
        title={t('childProfile.selectBirthday')}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    ...sharedStyles.rowBetween,
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        paddingTop: spacing.xxxl,
      },
    }),
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  title: {
    fontSize: responsive.isLargeScreen ? typography.fontSize.xxl : typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    ...sharedStyles.rowCenter,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  editButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: responsive.isSmallScreen ? spacing.lg : spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.isSmallScreen ? spacing.md : spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: responsive.isLargeScreen ? 72 : 64,
    height: responsive.isLargeScreen ? 72 : 64,
    borderRadius: responsive.isLargeScreen ? 36 : 32,
    ...sharedStyles.columnCenter,
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: responsive.isLargeScreen ? typography.fontSize.xxl : typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: commonColors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: responsive.isLargeScreen ? typography.fontSize.xl : typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  profileBadge: {
    fontSize: typography.fontSize.sm,
  },

  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.small,
    marginBottom: spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    ...sharedStyles.columnCenter,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  infoDivider: {
    height: 1,
    marginLeft: 60,
  },

  guardianCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.small,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  guardianContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  guardianInfo: {
    alignItems: 'center',
    textAlign: 'center',
  },
  guardianName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  guardianDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal,
    textAlign: 'center',
  },

  problemsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.small,
    marginBottom: spacing.xl,
  },
  problemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  problemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    gap: spacing.xs,
  },
  problemText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  emptyCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.small,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
  },

  inputContainer: {
    ...sharedStyles.rowStart,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 56,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderButton: {
    flex: 1,
    ...sharedStyles.rowCenter,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  genderText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  ipRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ipButton: {
    flex: 1,
    ...sharedStyles.columnCenter,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    minHeight: responsive.moderateScale(100),
  },
  ipIconContainer: {
    width: responsive.isLargeScreen ? 64 : 56,
    height: responsive.isLargeScreen ? 64 : 56,
    marginBottom: spacing.sm,
  },
  ipName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    maxWidth: responsive.moderateScale(80),
    flexShrink: 1,
  },
  problemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  problemButton: {
    ...sharedStyles.rowStart,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        paddingBottom: spacing.xxxl,
      },
    }),
  },
});

