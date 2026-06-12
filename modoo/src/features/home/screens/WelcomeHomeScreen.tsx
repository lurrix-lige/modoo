import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaContainer } from '../../../components';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, sharedStyles, responsive, layout } from '../../../theme';
import { BookOpen, GraduationCap, Leaf, Star } from 'lucide-react-native';
import { navigate } from '../../../navigation/navigationRef';
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

// 内容分类数据
const CONTENT_CATEGORIES = [
  {
    id: 'story',
    icon: BookOpen,
    titleKey: 'welcome.category.story',
    descriptionKey: 'welcome.category.storyDesc',
    type: 'story' as const,
  },
  {
    id: 'course',
    icon: GraduationCap,
    titleKey: 'welcome.category.course',
    descriptionKey: 'welcome.category.courseDesc',
    type: 'course' as const,
  },
  {
    id: 'breathing',
    icon: Leaf,
    titleKey: 'welcome.category.breathing',
    descriptionKey: 'welcome.category.breathingDesc',
    type: 'breathing' as const,
  },
  {
    id: 'article',
    icon: Star,
    titleKey: 'welcome.category.article',
    descriptionKey: 'welcome.category.articleDesc',
    type: 'article' as const,
  },
];

export default function WelcomeHomeScreen() {
  const navigation = useNavigation<WelcomeHomeNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { userState, setPendingNavigation } = useAppStore();
  const { visitCount } = useVisitTracker();
  const { getContentCardWidth, getContentLimit, isTablet } = useResponsive();

  const [freeContent, setFreeContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStoryContent, setHasStoryContent] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroAnimation = useFadeIn(0);
  const contentAnimation = useFadeIn(200);
  const categoryAnimation = useFadeIn(300);
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
        
        // 验证数据，允许部分缺失
        const featuredContent = recommendations?.featuredContent || [];
        const categoryContent = recommendations?.categoryContent || {};
        
        // 如果数据完全为空，使用缓存数据或空数组
        if (featuredContent.length === 0 && Object.keys(categoryContent).length === 0) {
          return;
        }

        let freeItems = [
          ...featuredContent,
          ...Object.values(categoryContent).flat(),
        ]
          .filter((item) => !item.isPremium);

        // 根据访问次数调整内容展示数量
        const contentLimit = visitCount > 3 ? getContentLimit() + 2 : getContentLimit();
        freeItems = freeItems.slice(0, contentLimit);

        setFreeContent(freeItems);
        setError(null);
        
        // 验证是否包含故事内容
        const containsStories = freeItems.some(item => item.type === 'story');
        setHasStoryContent(containsStories);

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
        // 如果有缓存数据，不显示错误
        const cached = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT_CACHE);
        if (!cached) {
          setError(t('error.contentLoadFailed'));
        }
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
          // 验证是否包含故事内容
          setHasStoryContent(cacheData.items.some((item: ContentItem) => item.type === 'story'));
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

  const handleContentPress = useCallback((item: ContentItem) => {
    // 根据内容类型进行不同的导航
    console.log('=== handleContentPress triggered ===');
    console.log('Content item:', JSON.stringify(item));
    
    if (item.type === 'story') {
      // 故事类型：导航到故事播放页面
      console.log('Navigating to StoryPlayer with storyId:', item.id);
      navigate('Main', { screen: 'StoryPlayer', params: { storyId: item.id } });
    } else if (item.type === 'course') {
      // 课程类型：导航到课程详情页面
      console.log('Navigating to CourseDetail with courseId:', item.id);
      navigate('Main', { screen: 'CourseDetail', params: { courseId: item.id } });
    } else if (item.type === 'article') {
      // 文章类型：导航到文章详情页面
      console.log('Navigating to ArticleDetail with articleId:', item.id);
      navigate('Main', { screen: 'ArticleDetail', params: { articleId: item.id } });
    } else {
      // 默认导航到主页面
      console.log('Unknown content type, navigating to Main');
      navigate('Main');
    }
  }, []);

  const handleStart = useCallback(() => {
    navigation.navigate('Auth');
  }, [navigation]);

  // 分类卡片点击处理
  const handleCategoryPress = useCallback((categoryId: string, categoryType: string) => {
    // 根据分类类型导航到对应的页面
    console.log('=== handleCategoryPress triggered ===');
    console.log('Category:', categoryId, 'Type:', categoryType);
    
    switch (categoryType) {
      case 'story':
        // 导航到故事页面
        console.log('Setting pending navigation to ChildrenHome');
        setPendingNavigation({ screen: 'ChildrenHome' });
        navigation.navigate('Main');
        break;
      case 'course':
        // 导航到课程页面（使用全局导航）
        console.log('Navigating to Course via navigate');
        navigate('Main', { screen: 'Course' });
        break;
      case 'breathing':
        // 导航到呼吸练习页面（使用全局导航）
        console.log('Navigating to Breathing via navigate');
        navigate('Main', { screen: 'Breathing' });
        break;
      case 'article':
        // 导航到知识文章页面（家长端）
        console.log('Navigating to Knowledge via navigate');
        navigate('Main', { screen: 'Knowledge' });
        break;
      default:
        navigate('Main');
    }
  }, []);

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
                    <ContentCard item={item} onPress={() => handleContentPress(item)} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Animated.View>

        {/* 精彩内容 - 分类卡片区域 */}
        <Animated.View style={categoryAnimation}>
          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('welcome.featuredContent')}
            </Text>
            <View style={[styles.categoryGrid, { gap: isTablet ? spacing.lg : spacing.md }]}>
              {CONTENT_CATEGORIES.map((category) => (
                <View key={category.id} style={{ width: getContentCardWidth() }}>
                  <FeatureCard
                    icon={category.icon}
                    titleKey={category.titleKey}
                    descriptionKey={category.descriptionKey}
                    onPress={() => handleCategoryPress(category.id, category.type)}
                  />
                </View>
              ))}
            </View>
          </View>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categorySection: {
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
