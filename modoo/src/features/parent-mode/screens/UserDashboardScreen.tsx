import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { BookOpen, Leaf, GraduationCap, FileText, Star } from 'lucide-react-native';

const dashboardIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'book': BookOpen,
  'leaf': Leaf,
  'school': GraduationCap,
  'document-text': FileText,
  'star': Star,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { Button, Card } from '../../../components';
import { ParentStackParamList } from '../../../navigation/types';
import { useAppStore } from '../../../store';
import { authService, apiService, ContentItem } from '../../../services';
import { logger } from '../../../utils/logger';

type UserDashboardNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

function ContentCard({ item, onPress }: { item: ContentItem; onPress: () => void }) {
  const { colors } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'story':
        return 'book';
      case 'breathing':
        return 'leaf';
      case 'course':
        return 'school';
      case 'article':
        return 'document-text';
      default:
        return 'star';
    }
  };

  return (
    <Card style={styles.contentCard} onPress={onPress} variant="glass" elevated>
      <View style={[styles.contentIcon, { backgroundColor: colors.primary + '20' }]}>
        {(() => { const IconComp = dashboardIconMap[getIcon(item.type)] || Star; return <IconComp size={responsive.moderateScaleForIcon(iconSizes.xl)} color={colors.primary} />; })()}
      </View>
      <Text style={[styles.contentTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.contentDesc, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.description}
      </Text>
      {item.isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: colors.primary + '20' }]}>
          <Star size={responsive.moderateScaleForIcon(iconSizes.sm)} color={colors.primary} />
          <Text style={[styles.premiumText, { color: colors.primary }]}>VIP</Text>
        </View>
      )}
    </Card>
  );
}

function MembershipPromoCard({ onUpgrade }: { onUpgrade: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.promoCard, { backgroundColor: colors.primary }]}>
      <View style={styles.promoContent}>
        <View style={[styles.promoIcon, { backgroundColor: colors.primaryLight }]}>
          <Star size={responsive.moderateScaleForIcon(iconSizes.hero)} color={commonColors.white} />
        </View>
        <Text style={styles.promoTitle}>{t('dashboard.unlockContent')}</Text>
        <Text style={[styles.promoDesc, { color: commonColors.white }]}>{t('dashboard.unlockDesc')}</Text>
      </View>
      <Button title={t('dashboard.upgradeNow')} onPress={onUpgrade} style={styles.promoButton} />
    </View>
  );
}

export default function UserDashboardScreen() {
  const navigation = useNavigation<UserDashboardNavigationProp>();
  const { colors } = useTheme();
  const { userState, isChildMode, switchToParentMode } = useAppStore();
  const { t } = useTranslation();
  const [content, setContent] = useState<{ featured: ContentItem[]; categories: { [key: string]: ContentItem[] } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
    checkPaidStatus();
  }, [userState.isPaid]);

  const loadContent = async () => {
    try {
      const recommendations = await apiService.getContentRecommendations();
      setContent({
        featured: recommendations.featuredContent,
        categories: recommendations.categoryContent,
      });
    } catch (error) {
      logger.error('Failed to load content', { error });
    } finally {
      setLoading(false);
    }
  };

  const checkPaidStatus = async () => {
    if (userState.isAuthenticated) {
      try {
        const isPaid = await authService.checkPaidStatus();
        const { setPaidStatus } = useAppStore.getState();
        setPaidStatus(isPaid);
      } catch (error) {
        logger.error('Failed to check paid status', { error });
      }
    }
  };

  const handleContentPress = (item: ContentItem) => {
    logger.debug('Content pressed', { item });
  };

  const handleUpgradePress = () => {
    navigation.navigate('Membership', {});
  };

  const handleSwitchToParentMode = () => {
    switchToParentMode();
    navigation.navigate('ParentTab');
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'story':
        return t('dashboard.featuredStories');
      case 'breathing':
        return t('dashboard.breathingExercises');
      case 'course':
        return t('dashboard.professionalCourses');
      case 'article':
        return t('dashboard.knowledgeArticles');
      default:
        return category;
    }
  };

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
                {userState.isPaid ? t('dashboard.welcomeVip') : t('dashboard.welcomeBack')}
              </Text>
              {userState.user && (
                <Text style={[styles.userName, { color: colors.textSecondary }]}>
                  {userState.user.nickname}
                </Text>
              )}
            </View>
            {isChildMode && (
              <Button
                title={t('dashboard.parentMode')}
                onPress={handleSwitchToParentMode}
                variant="secondary"
                style={styles.switchButton}
              />
            )}
          </View>
        </View>

        {!userState.isPaid && <MembershipPromoCard onUpgrade={handleUpgradePress} />}

        {content && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {userState.isPaid ? t('dashboard.recommendedForYou') : t('dashboard.excitingContent')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {content.featured.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onPress={() => handleContentPress(item)}
                  />
                ))}
              </ScrollView>
            </View>

            {Object.entries(content.categories).map(([category, items]) => (
              items.length > 0 && (
                <View key={category} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {getCategoryTitle(category)}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {items.map((item) => (
                      <ContentCard
                        key={item.id}
                        item={item}
                        onPress={() => handleContentPress(item)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )
            ))}
          </>
        )}
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title={t('common.getStarted')}
          onPress={() => navigation.navigate('ParentTab')}
          style={styles.startButton}
        />
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerRow: {
    ...sharedStyles.rowBetween,
  },
  switchButton: {
    paddingHorizontal: spacing.md,
    height: responsive.verticalScale(36),
  },
  welcomeText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  promoCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.medium,
  },
  promoContent: {
    ...sharedStyles.columnCenter,
    marginBottom: spacing.lg,
  },
  promoIcon: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.md,
  },
  promoTitle: {
    color: commonColors.white,
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  promoDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    textAlign: 'center',
  },
  promoButton: {
    backgroundColor: commonColors.white,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  contentCard: {
    width: responsive.moderateScale(160),
    padding: spacing.md,
    marginRight: spacing.md,
  },
  contentIcon: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.sm,
  },
  contentTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  contentDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginBottom: spacing.xs,
  },
  premiumBadge: {
    ...sharedStyles.rowStart,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  premiumText: {
    color: commonColors.white,
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.semibold,
  },
  horizontalScroll: {
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.xl,
  },
  startButton: {
    width: '100%',
  },
});