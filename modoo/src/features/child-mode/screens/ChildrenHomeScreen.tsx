/**
 * 儿童首页屏幕组件
 *
 * 该页面是儿童模式下的主界面，包含以下核心功能：
 * - 1. - 显示欢迎问候和儿童昵称
 * - 守护精灵展示区域（带呼吸动画效果）
 * - 故事分类筛选（全部、勇敢、梦想、推荐）
 * - 故事列表横向滚动展示
 * - 加载骨架屏、错误状态、空状态处理
 * - 家长模式入口提示
 *
 * @component
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  BookOpen,
  Star,
  Clock,
  Heart,
  Play,
  User,
  ChevronDown,
  Layout,
  Shield,
  RefreshCw,
  Library,
} from 'lucide-react-native';

/**
 * 儿童图标映射
 * 将图标名称字符串映射到对应的 Lucide 图标组件
 */
const childrenIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'person-outline': User,
  'chevron-down': ChevronDown,
  'grid-outline': Layout,
  'shield-outline': Shield,
  'moon-outline': Star,
  'star-outline': Star,
  refresh: RefreshCw,
};

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  storyCoverColors,
  skeleton,
  minTapArea,
  iconSizes,
  commonColors,
  sharedStyles,
  responsive,
} from '../../../theme';
import { useAppStore } from '../../../store';
import {
  StoryCard,
  LoadingState,
  ErrorState,
  EmptyState,
  SettingsPopover,
  GuardianSpirit,
  ResponsiveGrid,
} from '../../../components';
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
  { id: 'all', icon: 'grid-outline' }, // 全部故事
  { id: 'brave', icon: 'shield-outline' }, // 勇敢主题
  { id: 'dream', icon: 'moon-outline' }, // 梦想主题
  { id: 'recommended', icon: 'star-outline' }, // 推荐故事
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

  // 从全局状态获取儿童信息、认证状态和订阅状态
  const { child, isAuthenticated, userState } = useAppStore();
  const { isPaid } = userState;

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
  const filteredStories =
    selectedCategory === 'all' ? stories : stories.filter((s) => s.category === selectedCategory);

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
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonHeaderLeft}>
            <View
              style={[
                styles.skeletonLine,
                { width: skeleton.subtitleWidth, backgroundColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                {
                  width: skeleton.titleWidth,
                  height: skeleton.titleHeight,
                  backgroundColor: colors.border,
                },
              ]}
            />
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
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.skeletonCategory, { backgroundColor: colors.border }]} />
          ))}
        </View>

        <View style={styles.skeletonStories}>
          <Text style={[styles.skeletonTitle, { color: colors.textSecondary }]}>
            {t('common.loadingSkeleton')}
          </Text>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
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
                accessibilityLabel={t('home.parentLock')}
                accessible={true}
              >
                <User
                  size={responsive.moderateScaleForIcon(iconSizes.lg)}
                  color={colors.textSecondary}
                />
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
              <ChevronDown
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {/* 分类筛选区域 */}
          <View style={styles.categorySection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
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
                  {(() => {
                    const IconComp = childrenIconMap[cat.icon] || Layout;
                    return (
                      <IconComp
                        size={responsive.moderateScaleForIcon(iconSizes.sm)}
                        color={
                          selectedCategory === cat.id ? commonColors.white : colors.textSecondary
                        }
                      />
                    );
                  })()}
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          selectedCategory === cat.id ? commonColors.white : colors.textPrimary,
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
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('home.storyList')}
              </Text>
              {!isLoading && (
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <RefreshCw
                    size={responsive.moderateScaleForIcon(iconSizes.md)}
                    color={colors.primary}
                  />
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
                    isSubscribed={isPaid}
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
                    isSubscribed={isPaid}
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
  categoryButton: {
    ...sharedStyles.rowStart,
    alignItems: 'center',
    borderRadius: borderRadius.round,
    gap: spacing.xs,
    marginRight: spacing.sm,
    minWidth: responsive.moderateScale(80),
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  categoryText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  childName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
  },
  downArrow: {
    marginTop: spacing.md,
  },
  emptyContainer: {
    minHeight: responsive.verticalScale(200),
  },
  errorContainer: {
    minHeight: responsive.verticalScale(200),
  },

  greeting: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  guardianBubble: {
    ...sharedStyles.columnCenter,
  },
  guardianHint: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  guardianSection: {
    ...sharedStyles.columnCenter,
    paddingVertical: spacing.xxl,
  },
  guardianSpeech: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    maxWidth: '90%',
    textAlign: 'center',
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  headerLeft: {},
  headerRight: {
    ...sharedStyles.rowCenter,
    gap: spacing.sm,
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
  refreshButton: {
    padding: spacing.xs,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  settingsButton: {
    borderRadius: responsive.moderateScale(minTapArea.adult / 2),
    height: responsive.moderateScale(minTapArea.adult),
    width: responsive.moderateScale(minTapArea.adult),
    ...sharedStyles.columnCenter,
    ...shadows.small,
  },
  skeletonBubble: {
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(skeleton.bubbleHeight),
    width: responsive.moderateScale(skeleton.bubbleWidth),
  },
  skeletonCategories: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  skeletonCategory: {
    borderRadius: borderRadius.round,
    height: skeleton.lineHeight,
    width: responsive.moderateScale(skeleton.categoryWidth),
  },
  skeletonCircle: {
    borderRadius: responsive.moderateScale(skeleton.avatarSize / 2),
    height: responsive.moderateScale(skeleton.avatarSize),
    width: responsive.moderateScale(skeleton.avatarSize),
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonCrater: {
    borderRadius: responsive.moderateScale(skeleton.craterWidth / 2),
    height: responsive.verticalScale(skeleton.craterHeight),
    width: responsive.moderateScale(skeleton.craterWidth),
  },
  skeletonGuardian: {
    ...sharedStyles.columnCenter,
    paddingVertical: spacing.xxl,
  },
  skeletonHeader: {
    ...sharedStyles.rowBetween,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  skeletonHeaderLeft: {
    gap: spacing.xs,
  },
  skeletonLine: {
    borderRadius: borderRadius.sm,
    height: skeleton.lineHeight,
  },
  skeletonMoon: {
    borderRadius: responsive.moderateScale(skeleton.moonSize / 2),
    height: responsive.moderateScale(skeleton.moonSize),
    width: responsive.moderateScale(skeleton.moonSize),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.lg,
  },
  skeletonMoonInner: {
    borderRadius: responsive.moderateScale(skeleton.moonInnerSize / 2),
    height: responsive.moderateScale(skeleton.moonInnerSize),
    width: responsive.moderateScale(skeleton.moonInnerSize),
    ...sharedStyles.columnCenter,
  },
  skeletonStories: {
    paddingHorizontal: spacing.xl,
  },
  skeletonStoryCard: {
    borderRadius: borderRadius.lg,
    height: responsive.verticalScale(200),
    marginRight: spacing.md,
    width: responsive.moderateScale(150),
  },
  skeletonTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  storySection: {
    paddingHorizontal: spacing.xl,
  },
  storySectionHeader: {
    ...sharedStyles.rowBetween,
  },
});
