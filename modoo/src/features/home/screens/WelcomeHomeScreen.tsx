import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaContainer } from '../../../components';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, sharedStyles, responsive, layout } from '../../../theme';
import { BookOpen, GraduationCap, Leaf, Star } from 'lucide-react-native';
import {
  WelcomeHero,
  ContentCard,
  FeatureCard,
  ValuePreview,
  GentleInvitation,
  ContentSkeleton,
  SettingsPopover,
  ErrorState,
} from '../../../components';
import { RootStackParamList } from '../../../navigation/types';
import { useVisitTracker, useFadeIn, useParallax, useResponsive } from '../../../hooks';
import { apiService, ContentItem } from '../../../services';
import { useAppStore } from '../../../store';
import { logger } from '../../../utils/logger';
import { STORAGE_KEYS } from '../../../config/env';

type WelcomeHomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  {
    icon: BookOpen,
    titleKey: 'welcome.storyTitle',
    descriptionKey: 'welcome.storyDesc',
  },
  {
    icon: GraduationCap,
    titleKey: 'welcome.courseTitle',
    descriptionKey: 'welcome.courseDesc',
  },
  {
    icon: Leaf,
    titleKey: 'welcome.breathingTitle',
    descriptionKey: 'welcome.breathingDesc',
  },
  {
    icon: Star,
    titleKey: 'welcome.guardianTitle',
    descriptionKey: 'welcome.guardianDesc',
  },
];

export default function WelcomeHomeScreen() {
  const navigation = useNavigation<WelcomeHomeNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { userState } = useAppStore();
  const { visitCount } = useVisitTracker();
  const { getContentCardWidth, getContentLimit, isTablet } = useResponsive();

  const [freeContent, setFreeContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroAnimation = useFadeIn(0);
  const contentAnimation = useFadeIn(200);
  const featuresAnimation = useFadeIn(400);
  const valueAnimation = useFadeIn(600);
  const invitationAnimation = useFadeIn(800);
  const heroParallax = useParallax(scrollY);

  const loadFreeContent = useCallback(async () => {
    const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
    let retries = 0;
    const maxRetries = 2;

    const fetchAndCacheContent = async (): Promise<void> => {
      try {
        const recommendations = await apiService.getContentRecommendations();
        if (!recommendations?.featuredContent || !recommendations?.categoryContent) {
          logger.warn('Content recommendations returned invalid data', { recommendations });
          throw new Error('Invalid response data');
        }

        let freeItems = [
          ...recommendations.featuredContent,
          ...Object.values(recommendations.categoryContent).flat(),
        ]
          .filter((item) => !item.isPremium);

        // 根据访问次数调整内容展示数量
        const contentLimit = visitCount > 3 ? getContentLimit() + 2 : getContentLimit();
        freeItems = freeItems.slice(0, contentLimit);

        setFreeContent(freeItems);
        setError(null);

        // 缓存数据
        await AsyncStorage.setItem(
          STORAGE_KEYS.CONTENT_CACHE,
          JSON.stringify({
            items: freeItems,
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        retries++;
        if (retries <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
          return fetchAndCacheContent();
        }
        logger.error('Failed to load free content after retries', { error: err });
        setError(t('error.contentLoadFailed'));
      } finally {
        setLoading(false);
      }
    };

    try {
      // 先检查缓存
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT_CACHE);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_TTL) {
          setFreeContent(cacheData.items);
          setLoading(false);
          // 后台刷新
          fetchAndCacheContent();
          return;
        }
      }

      await fetchAndCacheContent();
    } catch (err) {
      logger.error('Cache operation failed', { error: err });
      await fetchAndCacheContent();
    }
  }, [visitCount, getContentLimit, t]);

  useEffect(() => {
    loadFreeContent();
  }, [loadFreeContent]);

  const handleContentPress = useCallback(() => {
    navigation.navigate('Main');
  }, [navigation]);

  const handleStart = useCallback(() => {
    navigation.navigate('Auth');
  }, [navigation]);

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.headerRight}>
        <SettingsPopover />
      </View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <Animated.View style={heroParallax}>
          <Animated.View style={heroAnimation}>
            <WelcomeHero />
          </Animated.View>
        </Animated.View>

        <Animated.View style={contentAnimation}>
          {loading ? (
            <ContentSkeleton />
          ) : error ? (
            <View style={styles.errorSection}>
              <ErrorState
                description={error}
                actionLabel={t('common.retry')}
                onAction={loadFreeContent}
              />
            </View>
          ) : freeContent.length > 0 ? (
            <View style={styles.contentSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('welcome.discoverContent')}
              </Text>
              <View style={[styles.contentGrid, { gap: isTablet ? spacing.lg : spacing.md }]}>
                {freeContent.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={{ width: getContentCardWidth() }}>
                    <ContentCard item={item} onPress={handleContentPress} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View style={featuresAnimation}>
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('welcome.featureSection')}
            </Text>
            <View style={[styles.featuresGrid, { gap: isTablet ? spacing.xs : spacing.md }]}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={{ width: getContentCardWidth() }}>
                  <FeatureCard
                    icon={feature.icon}
                    titleKey={feature.titleKey}
                    descriptionKey={feature.descriptionKey}
                  />
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={valueAnimation}>
          <ValuePreview />
        </Animated.View>

        <Animated.View style={invitationAnimation}>
          <GentleInvitation onStart={handleStart} />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textPlaceholder }]}>
            {t('welcome.footer')}
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  contentSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  errorSection: {
    paddingVertical: spacing.xxl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featuresSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    ...sharedStyles.columnCenter,
  },
  footerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: responsive.moderateScale(layout.headerRightRight),
    top: responsive.moderateScale(layout.headerRightTop),
    zIndex: layout.zIndex.modal,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
});
