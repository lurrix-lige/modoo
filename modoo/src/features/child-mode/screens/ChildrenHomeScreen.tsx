/**
 * 儿童首页屏幕组件
 * 
 * 该页面是儿童模式下的主界面，包含以下核心功能� * - 显示欢迎问候和儿童昵称
 * - 守护精灵展示区域（带呼吸动画效果� * - 故事分类筛选（全部、勇敢、梦想、推荐）
 * - 故事列表横向滚动展示
 * - 加载骨架屏、错误状态、空状态处� * - 家长模式入口提示
 * 
 * @component
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { BookOpen, Star, Clock, Heart, Play, User, ChevronDown, Layout, Shield, RefreshCw, Library } from 'lucide-react-native';

/**
 * 儿童图标映射� * 将图标名称字符串映射到对应的 Lucide 图标组件
 */
const childrenIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'person-outline': User,
  'chevron-down': ChevronDown,
  'grid-outline': Layout,
  'shield-outline': Shield,
  'moon-outline': Star,
  'star-outline': Star,
  'refresh': RefreshCw,
};

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, storyCoverColors, skeleton, minTapArea, iconSizes, commonColors, sharedStyles, responsive } from '../../../theme';
import { useAppStore } from '../../../store';
import { StoryCard, LoadingState, ErrorState, EmptyState, SettingsPopover, GuardianSpirit, ResponsiveGrid } from '../../../components';
import { ChildrenStackParamList } from '../../../navigation/types';
import { apiService, Story } from '../../../services';
import { logger } from '../../../utils/logger';
import { GUARDIAN_SPIRIT_CONFIG, getGuardianSpiritById } from '../../../constants/guardianSpirits';

type ChildrenHomeNavigationProp = NativeStackNavigationProp<ChildrenStackParamList, 'ChildrenTab'>;

/**
 * 故事分类列表
 * 用于筛选不同类型的故事内容
 */
const categories = [
  { id: 'all', icon: 'grid-outline' },           // 全部故事
  { id: 'brave', icon: 'shield-outline' },       // 勇敢主题
  { id: 'dream', icon: 'moon-outline' },         // 梦想主题
  { id: 'recommended', icon: 'star-outline' },   // 推荐故事
];



/**
 * 儿童首页主组件
 * 包含欢迎问候、守护精灵、故事分类筛选、故事列表横向滚动展示、加载骨架屏、错误状态、空状态处理、家长模式入口提示
 * 
 * @returns {React.ReactElement} ChildrenHomeScreen 组件
 */
export default function ChildrenHomeScreen() {
  // 导航对象，用于页面跳转
  const navigation = useNavigation<ChildrenHomeNavigationProp>();
  
  // 国际化翻译钩子
  const { t } = useTranslation();
  
  // 主题颜色和深色模式状态
  const { colors, isDark } = useTheme();
  
  // 从全局状态获取儿童信息和认证状态
  const { child, isAuthenticated } = useAppStore();
  
  // 当前选中的分类
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 页面加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 数据加载错误状态
  const [hasError, setHasError] = useState(false);
  
  // 故事列表数据
  const [stories, setStories] = useState<Story[]>([]);

  /**
   * 获取分类显示标签
   * @param {string} categoryId - 分类ID
   * @returns {string} 本地化的分类名称
   */
  const getCategoryLabel = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return t('home.allCategory');
      case 'brave':
        return t('home.braveCategory');
      case 'dream':
        return t('home.dreamCategory');
      case 'recommended':
        return t('home.recommendedCategory');
      default:
        return categoryId;
    }
  };

  /**
   * 初始化加载数据
   * 当组件挂载时加载初始数据
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 加载故事数据
   * @param {boolean} isRefresh - 是否为刷新操作
   */
  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setHasError(false);
    try {
  const response = await apiService.getStories();
      setStories(response.stories);
    } catch (error) {
      logger.error('Failed to load data', { error });
      setHasError(true);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  /**
   * 处理下拉刷新
   */
  const handleRefresh = () => loadData(true);

  /**
   * 根据选中分类筛选故事列表
   */
  const filteredStories = selectedCategory === 'all'
    ? stories
    : stories.filter(s => s.category === selectedCategory);

  /**
   * 获取当前选中的守护精灵配置
   */
  const currentSpirit = child ? getGuardianSpiritById(child.guardianSpiritId || 'moon') : undefined;

  /**
   * 根据守护精灵ID获取守护精灵名称
   */
  const guardianName = t(currentSpirit?.nameKey || 'home.moonGuardian');

  /**
   * 获取守护精灵图标类型
   */
  const guardianIcon = currentSpirit?.icon || 'moon';

  /**
   * 渲染加载骨架屏
   * 在数据加载期间显示占位动画
   */
  const renderLoadingSkeleton = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonHeaderLeft}>
            <View style={[styles.skeletonLine, { width: skeleton.subtitleWidth, backgroundColor: colors.border }]} />
            <View style={[styles.skeletonLine, { width: skeleton.titleWidth, height: skeleton.titleHeight, backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.skeletonGuardian}>
          <View
            style={[
              styles.skeletonMoon,
              {
                backgroundColor: colors.border,
              },
            ]}
          >
            <View style={[styles.skeletonMoonInner, { backgroundColor: colors.border }]}>
              <View style={[styles.skeletonCrater, { backgroundColor: colors.border }]} />
            </View>
          </View>
          <View style={[styles.skeletonBubble, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.skeletonCategories}>
          {[1, 2, 3, 4].map(i => (
            <View
              key={i}
              style={[styles.skeletonCategory, { backgroundColor: colors.border }]}
            />
          ))}
        </View>

        <View style={styles.skeletonStories}>
          <Text style={[styles.skeletonTitle, { color: colors.textSecondary }]}>{t('common.loadingSkeleton')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.skeletonStoryCard, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonStoryCard, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonStoryCard, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonStoryCard, { backgroundColor: colors.surface }]} />
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );

  /**
   * 渲染主页面内容
   */
  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      {/* 加载状态：显示骨架屏 */}
      {isLoading && !isRefreshing ? (
        renderLoadingSkeleton()
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* 顶部头部区域 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t('home.goodEvening')}
              </Text>
              <Text style={[styles.childName, { color: colors.textPrimary }]}>
                {child?.nickname || t('home.babyNickname')}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <SettingsPopover />
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.getParent()?.getParent()?.navigate('ChildLock')}
              >
                <User size={iconSizes.lg} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 守护精灵区域（长按进入舒适模式） */}
          <TouchableOpacity
            style={styles.guardianSection}
            onLongPress={() => navigation.getParent()?.navigate('ComfortMode')}
            activeOpacity={0.95}
          >
            <GuardianSpirit
              icon={guardianIcon}
              size={skeleton.moonSize}
              color={currentSpirit?.color || colors.primary}
              innerColor={colors.primaryDark}
              iconSize={iconSizes.hero}
              iconColor={commonColors.white}
              animationType="breathe"
              animationDuration={2000}
            />

            <View style={styles.guardianBubble}>
              <Text style={[styles.guardianSpeech, { color: colors.textPrimary }]}>
                {t('home.guardianSpeech', { guardianName })}
              </Text>
              <Text style={[styles.guardianHint, { color: colors.textSecondary }]}>
                {t('home.guardianHint')}
              </Text>
            </View>

            <View style={styles.downArrow}>
              <ChevronDown size={iconSizes.lg} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* 分类筛选区域 */}
          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        selectedCategory === cat.id ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  {(() => { const IconComp = childrenIconMap[cat.icon] || Layout; return <IconComp size={iconSizes.sm} color={selectedCategory === cat.id ? commonColors.white : colors.textSecondary} />; })()}
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: selectedCategory === cat.id ? commonColors.white : colors.textPrimary,
                      },
                    ]}
                  >
                    {getCategoryLabel(cat.id)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 故事列表区域 */}
          <View style={styles.storySection}>
            <View style={styles.storySectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('home.storyList')}</Text>
              {!isLoading && (
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                >
                  <RefreshCw size={iconSizes.md} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* 错误状态 / 空状态 / 故事列表区域 */}
            {hasError ? (
              <View style={styles.errorContainer}>
                <ErrorState
                  title={t('common.loadFailed')}
                  description={t('common.loadFailedDesc')}
                  actionLabel={t('common.retry')}
                  onAction={() => loadData(false)}
                />
              </View>
            ) : filteredStories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  icon={Library}
                  title={t('common.noData')}
                  description={t('home.noStories')}
                />
              </View>
            ) : responsive.isTablet ? (
              <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }} gap={spacing.md}>
                {filteredStories.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    title={story.title}
                    titleKey={story.titleKey}
                    description={story.description}
                    descriptionKey={story.descriptionKey}
                    duration={story.duration}
                    coverColor={storyCoverColors[isDark ? 'dark' : 'light'][index % 4]}
                    coverUrl={story.coverUrl}
                    onPress={() => navigation.navigate('StoryPlayer', { storyId: story.id })}
                    isPremium={story.isPremium}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </ResponsiveGrid>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredStories.map((story, index) => (
                  <StoryCard
                    key={story.id}
                    title={story.title}
                    titleKey={story.titleKey}
                    description={story.description}
                    descriptionKey={story.descriptionKey}
                    duration={story.duration}
                    coverColor={storyCoverColors[isDark ? 'dark' : 'light'][index % 4]}
                    coverUrl={story.coverUrl}
                    onPress={() => navigation.navigate('StoryPlayer', { storyId: story.id })}
                    isPremium={story.isPremium}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* 家长模式入口提示区域 */}
          <View style={styles.parentHint}>
            <Text style={[styles.parentHintText, { color: colors.textSecondary }]}>
              {t('home.parentHint')}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaContainer>
  );
}

  const styles = StyleSheet.create({
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  headerRight: {
    ...sharedStyles.rowCenter,
    gap: spacing.sm,
  },
  headerLeft: {},
  greeting: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  childName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
  },
  settingsButton: {
    width: responsive.moderateScale(minTapArea.adult),
    height: responsive.moderateScale(minTapArea.adult),
    borderRadius: responsive.moderateScale(minTapArea.adult / 2),
    ...sharedStyles.columnCenter,
    ...shadows.small,
  },
  guardianSection: {
    ...sharedStyles.columnCenter,
    paddingVertical: spacing.xxl,
  },
  
  guardianBubble: {
    ...sharedStyles.columnCenter,
  },
  guardianSpeech: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    maxWidth: '90%',
    marginBottom: spacing.xs,
  },
  guardianHint: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  downArrow: {
    marginTop: spacing.md,
  },
  categorySection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  categoryButton: {
    ...sharedStyles.rowStart,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    gap: spacing.xs,
    minWidth: responsive.moderateScale(80),
    alignItems: 'center',
  },
  categoryText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  storySection: {
    paddingHorizontal: spacing.xl,
  },
  storySectionHeader: {
    ...sharedStyles.rowBetween,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  errorContainer: {
    minHeight: responsive.verticalScale(200),
  },
  emptyContainer: {
    minHeight: responsive.verticalScale(200),
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonHeader: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  skeletonHeaderLeft: {
    gap: spacing.xs,
  },
  skeletonLine: {
    height: skeleton.lineHeight,
    borderRadius: borderRadius.sm,
  },
  skeletonCircle: {
    width: responsive.moderateScale(skeleton.avatarSize),
    height: responsive.moderateScale(skeleton.avatarSize),
    borderRadius: responsive.moderateScale(skeleton.avatarSize / 2),
  },
  skeletonGuardian: {
    ...sharedStyles.columnCenter,
    paddingVertical: spacing.xxl,
  },
  skeletonMoon: {
    width: responsive.moderateScale(skeleton.moonSize),
    height: responsive.moderateScale(skeleton.moonSize),
    borderRadius: responsive.moderateScale(skeleton.moonSize / 2),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.lg,
  },
  skeletonMoonInner: {
    width: responsive.moderateScale(skeleton.moonInnerSize),
    height: responsive.moderateScale(skeleton.moonInnerSize),
    borderRadius: responsive.moderateScale(skeleton.moonInnerSize / 2),
    ...sharedStyles.columnCenter,
  },
  skeletonCrater: {
    width: responsive.moderateScale(skeleton.craterWidth),
    height: responsive.verticalScale(skeleton.craterHeight),
    borderRadius: responsive.moderateScale(skeleton.craterWidth / 2),
  },
  skeletonBubble: {
    width: responsive.moderateScale(skeleton.bubbleWidth),
    height: responsive.verticalScale(skeleton.bubbleHeight),
    borderRadius: borderRadius.md,
  },
  skeletonCategories: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  skeletonCategory: {
    width: responsive.moderateScale(skeleton.categoryWidth),
    height: skeleton.lineHeight,
    borderRadius: borderRadius.round,
  },
  skeletonStories: {
    paddingHorizontal: spacing.xl,
  },
  skeletonTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  skeletonStoryCard: {
    width: responsive.moderateScale(150),
    height: responsive.verticalScale(200),
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
  },
  parentHint: {
    ...sharedStyles.columnCenter,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  parentHintText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
  },
});
