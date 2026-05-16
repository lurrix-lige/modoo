import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Search, FileText, Eye, Clock, MessageSquare, Heart } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, Article } from '../../../services';
import { logger } from '../../../utils/logger';

type KnowledgeScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getArticles();
      setArticles(response.articles);
    } catch (error) {
      logger.error('Failed to load knowledge articles', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.includes(searchKeyword) ||
      article.summary.includes(searchKeyword);
    return matchesCategory && matchesSearch;
  });

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonSectionTitle}>
        <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.skeletonArticles}>
        {[1, 2, 3].map(i => (
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('knowledge.title')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: colors.surface }]}>
          <Search size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
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
          {CATEGORIES.map(cat => (
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
            {filteredArticles.map(article => (
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
                    <FileText size={responsive.moderateScaleForIcon(iconSizes.xxl)} color={commonColors.white} />
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
                        <Eye size={responsive.moderateScaleForIcon(iconSizes.sm)} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {article.views}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={responsive.moderateScaleForIcon(iconSizes.sm)} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {article.readTime}{t('knowledge.minutes')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.articleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {article.titleKey ? (t(article.titleKey) !== article.titleKey ? t(article.titleKey) : article.title) : article.title}
                  </Text>
                  <Text style={[styles.articleSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                    {article.summaryKey ? (t(article.summaryKey) !== article.summaryKey ? t(article.summaryKey) : article.summary) : article.summary}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.quickAccess}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('Dialogue')}
              >
                <MessageSquare size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.warning} />
                <Text style={[styles.quickText, { color: colors.textPrimary }]}>{t('knowledge.dialogue')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('Favorites')}
              >
                <Heart size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.error} />
                <Text style={[styles.quickText, { color: colors.textPrimary }]}>{t('knowledge.favorites')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.md,
  },
  searchText: {
    flex: 1,
    height: '100%',
    marginLeft: spacing.sm,
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  categoryContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
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
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  articleCover: {
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(100),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  articleCoverImage: {
    width: '100%',
    height: '100%',
  },
  articleInfo: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  articleTags: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.moderateScale(4),
  },
  metaText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  quickAccess: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
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
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(18),
    borderRadius: responsive.moderateScale(9),
  },
  skeletonTextLong: {
    width: '100%',
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
    marginBottom: spacing.sm,
  },
  skeletonArticles: {
    gap: spacing.md,
  },
  skeletonArticleCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  skeletonArticleCover: {
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(100),
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  skeletonArticleInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonTags: {
    marginBottom: spacing.xs,
  },
  skeletonTag: {
    width: responsive.moderateScale(60),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
  },
  skeletonMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skeletonMetaItem: {
    width: responsive.moderateScale(40),
    height: responsive.verticalScale(12),
    borderRadius: responsive.moderateScale(6),
  },
  skeletonQuickAccess: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  skeletonQuickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  skeletonQuickIcon: {
    width: responsive.moderateScale(24),
    height: responsive.moderateScale(24),
    borderRadius: responsive.moderateScale(12),
  },
  skeletonQuickText: {
    width: responsive.moderateScale(60),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
  },
});
