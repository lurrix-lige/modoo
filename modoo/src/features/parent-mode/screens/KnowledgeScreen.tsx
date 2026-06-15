import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Search, FileText, Eye, Clock, MessageSquare, Heart } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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
  iconSizes,
} from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { Article } from '../../../services';
import { articleApi } from '../../../infrastructure/api';
import { ErrorToast } from '../../../components';
import { logger } from '../../../utils/logger';

type KnowledgeScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

interface KnowledgeError {
  visible: boolean;
  message: string;
}

const CATEGORIES = [
  { id: 'all', labelKey: 'knowledge.all' },
  { id: 'psychology', labelKey: 'knowledge.psychology' },
  { id: 'communication', labelKey: 'knowledge.communication' },
  { id: 'pitfalls', labelKey: 'knowledge.pitfalls' },
];

export default function KnowledgeScreen() {
  const navigation = useNavigation<KnowledgeScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<KnowledgeError>({ visible: false, message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await articleApi.getArticles();
      setArticles(response.articles);
    } catch (err) {
      logger.error('Failed to load knowledge articles', { error: err });
      setError({ visible: true, message: t('common.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        const matchesSearch =
          article.title.includes(searchKeyword) || article.summary.includes(searchKeyword);
        return matchesCategory && matchesSearch;
      }),
    [articles, selectedCategory, searchKeyword],
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonSectionTitle}>
        <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.skeletonArticles}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeletonArticleCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonArticleCover, { backgroundColor: colors.border }]} />
            <View style={styles.skeletonArticleInfo}>
              <View style={styles.skeletonTags}>
                <View style={[styles.skeletonTag, { backgroundColor: colors.border }]} />
              </View>
              <View style={[styles.skeletonTextLong, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
              <View style={styles.skeletonMeta}>
                <View style={[styles.skeletonMetaItem, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonMetaItem, { backgroundColor: colors.border }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.skeletonQuickAccess}>
        <View style={[styles.skeletonQuickButton, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonQuickIcon, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonQuickText, { backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.skeletonQuickButton, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonQuickIcon, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonQuickText, { backgroundColor: colors.border }]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('knowledge.title')}
            </Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: colors.surface }]}>
              <Search
                size={responsive.moderateScaleForIcon(iconSizes.md)}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.searchText, { color: colors.textPrimary }]}
                placeholder={t('knowledge.searchPlaceholder')}
                placeholderTextColor={colors.textPlaceholder}
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                underlineColorAndroid="transparent"
              />
            </View>
          </View>

          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        selectedCategory === cat.id ? colors.secondary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          selectedCategory === cat.id ? commonColors.white : colors.textPrimary,
                      },
                    ]}
                  >
                    {t(cat.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {isLoading ? (
              renderLoadingSkeleton()
            ) : (
              <>
                {filteredArticles.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={[styles.articleCard, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
                  >
                    <View style={[styles.articleCover, { backgroundColor: colors.secondary }]}>
                      {article.coverUrl ? (
                        <Image
                          source={{ uri: article.coverUrl }}
                          style={styles.articleCoverImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <FileText
                          size={responsive.moderateScaleForIcon(iconSizes.xxl)}
                          color={commonColors.white}
                        />
                      )}
                    </View>
                    <View style={styles.articleInfo}>
                      <View style={styles.tagsRow}>
                        <View style={styles.articleTags}>
                          <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: colors.primary }]}>
                              {t(`knowledge.categories.${article.category}`) || article.category}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.articleMeta}>
                          <View style={styles.metaItem}>
                            <Eye
                              size={responsive.moderateScaleForIcon(iconSizes.sm)}
                              color={colors.textSecondary}
                            />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {article.views}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Clock
                              size={responsive.moderateScaleForIcon(iconSizes.sm)}
                              color={colors.textSecondary}
                            />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {article.readTime}
                              {t('knowledge.minutes')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text
                        style={[styles.articleTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {article.titleKey
                          ? t(article.titleKey) !== article.titleKey
                            ? t(article.titleKey)
                            : article.title
                          : article.title}
                      </Text>
                      <Text
                        style={[styles.articleSummary, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {article.summaryKey
                          ? t(article.summaryKey) !== article.summaryKey
                            ? t(article.summaryKey)
                            : article.summary
                          : article.summary}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <View style={styles.quickAccess}>
                  <TouchableOpacity
                    style={[styles.quickButton, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('Dialogue')}
                  >
                    <MessageSquare
                      size={responsive.moderateScaleForIcon(iconSizes.lg)}
                      color={colors.warning}
                    />
                    <Text style={[styles.quickText, { color: colors.textPrimary }]}>
                      {t('knowledge.dialogue')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickButton, { backgroundColor: colors.surface }]}
                    onPress={() => navigation.navigate('Favorites')}
                  >
                    <Heart
                      size={responsive.moderateScaleForIcon(iconSizes.lg)}
                      color={colors.error}
                    />
                    <Text style={[styles.quickText, { color: colors.textPrimary }]}>
                      {t('knowledge.favorites')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      <ErrorToast
        visible={error.visible}
        message={error.message}
        severity="error"
        duration={5000}
        onDismiss={() => setError({ visible: false, message: '' })}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  searchContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  searchInput: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    height: responsive.verticalScale(48),
    paddingHorizontal: spacing.md,
  },
  searchText: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    height: '100%',
    marginLeft: spacing.sm,
  },
  categoryContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  categoryButton: {
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  articleCard: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  articleCover: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(100),
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
    width: responsive.moderateScale(80),
  },
  articleCoverImage: {
    height: '100%',
    width: '100%',
  },
  articleInfo: {
    flex: 1,
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  articleTags: {
    flexDirection: 'row',
  },
  tag: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  articleTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  articleSummary: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    lineHeight: responsive.verticalScale(20),
  },
  articleMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: responsive.moderateScale(4),
  },
  metaText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  quickAccess: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  quickButton: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
    ...shadows.small,
  },
  quickText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
  },

  // Skeleton styles
  skeletonContent: {
    flex: 1,
  },
  skeletonSectionTitle: {
    marginBottom: spacing.md,
  },
  skeletonTextShort: {
    borderRadius: responsive.moderateScale(9),
    height: responsive.verticalScale(18),
    width: responsive.moderateScale(80),
  },
  skeletonTextLong: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    marginBottom: spacing.sm,
    width: '100%',
  },
  skeletonArticles: {
    gap: spacing.md,
  },
  skeletonArticleCard: {
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    padding: spacing.md,
  },
  skeletonArticleCover: {
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(100),
    marginRight: spacing.md,
    width: responsive.moderateScale(80),
  },
  skeletonArticleInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonTags: {
    marginBottom: spacing.xs,
  },
  skeletonTag: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    width: responsive.moderateScale(60),
  },
  skeletonMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skeletonMetaItem: {
    borderRadius: responsive.moderateScale(6),
    height: responsive.verticalScale(12),
    width: responsive.moderateScale(40),
  },
  skeletonQuickAccess: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  skeletonQuickButton: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  skeletonQuickIcon: {
    borderRadius: responsive.moderateScale(12),
    height: responsive.moderateScale(24),
    width: responsive.moderateScale(24),
  },
  skeletonQuickText: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    width: responsive.moderateScale(60),
  },
});
