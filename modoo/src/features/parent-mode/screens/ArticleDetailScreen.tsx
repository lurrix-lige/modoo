import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  Heart,
  Share2,
  BookOpen,
  Eye,
  Clock,
  Star,
  ChevronRight,
  FileText,
  Check,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
} from '../../../theme';
import { Button, ErrorToast, LoadingState } from '../../../components';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, Article as ArticleType } from '../../../services';
import { logger } from '../../../utils/logger';
import { useShare } from '../../../services/ShareService';

type ArticleDetailRouteProp = RouteProp<ParentStackParamList, 'ArticleDetail'>;
type ArticleDetailNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'ArticleDetail'>;

interface ArticleError {
  visible: boolean;
  message: string;
  code?: string;
}

export default function ArticleDetailScreen() {
  const navigation = useNavigation<ArticleDetailNavigationProp>();
  const route = useRoute<ArticleDetailRouteProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [articleError, setArticleError] = useState<ArticleError>({
    visible: false,
    message: '',
  });
  const [isFavorited, setIsFavorited] = useState(false);
  const [article, setArticle] = useState<ArticleType | null>(null);
  const { shareNative, isLoading: isSharing } = useShare();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    loadArticle();
  }, []);

  const loadArticle = async () => {
    setIsLoading(true);
    setArticleError({ visible: false, message: '' });
    try {
      const articleId = route.params?.articleId;
      if (articleId) {
        const fetchedArticle = await apiService.getArticle(articleId);
        setArticle(fetchedArticle);
        setIsFavorited(fetchedArticle.isFavorited || false);
      }
    } catch (error) {
      showArticleError(t('articleDetail.loadError'), 'ARTICLE_LOAD_ERROR', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showArticleError = (message: string, code: string, error?: unknown) => {
    logger.error(message, { error });
    setArticleError({
      visible: true,
      message,
      code,
    });
  };

  const handleRetry = () => {
    setArticleError({ visible: false, message: '' });
    loadArticle();
  };

  const handleDismissError = () => {
    setArticleError({ visible: false, message: '' });
  };

  const toggleFavorite = async () => {
    if (!article) return;

    try {
      if (isFavorited) {
        await apiService.unfavoriteArticle(article.id);
        setIsFavorited(false);
      } else {
        await apiService.favoriteArticle(article.id);
        setIsFavorited(true);
      }
    } catch (error) {
      logger.error('Failed to toggle favorite', { error });
      showArticleError(t('articleDetail.favoriteError'), 'FAVORITE_ERROR', error);
    }
  };

  const handleShare = async () => {
    if (!article || isSharing) return;

    try {
      const shareOptions = {
        title: article.title,
        description: article.summary || '',
        url: article.coverUrl,
      };

      const result = await shareNative(shareOptions);

      if (result.success) {
        await apiService.shareArticle(article.id);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      logger.error('Failed to share', { error });
    }
  };

  const renderLoadingSkeleton = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.skeletonCover, { backgroundColor: colors.secondary }]} />
      <View style={styles.skeletonArticleHeader}>
        <View style={[styles.skeletonTag, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonMeta, { backgroundColor: colors.border }]} />
      </View>
      <View style={styles.skeletonArticleContent}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.skeletonParagraph, { backgroundColor: colors.border }]} />
        ))}
      </View>
    </ScrollView>
  );

  const getArticleTitle = () => {
    if (!article) return '';
    if (article.titleKey) {
      const translated = t(article.titleKey);
      if (translated !== article.titleKey) {
        return translated;
      }
    }
    return article.title;
  };

  const getArticleSummary = () => {
    if (!article) return '';
    if (article.summaryKey) {
      const translated = t(article.summaryKey);
      if (translated !== article.summaryKey) {
        return translated;
      }
    }
    return article.summary;
  };

  const getArticleContent = () => {
    if (!article) return '';
    if (article.contentKey) {
      const translated = t(article.contentKey);
      if (translated !== article.contentKey) {
        return translated;
      }
    }
    return article.content || article.summary || '';
  };

  const getCategoryName = (category: string) => {
    const key = `knowledge.categories.${category}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
    return category;
  };

  const renderArticleContent = () => {
    if (!article) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, { backgroundColor: colors.secondary }]}>
          {article.coverUrl ? (
            <Image source={{ uri: article.coverUrl }} style={styles.coverImage} />
          ) : (
            <FileText size={48} color={commonColors.white} />
          )}
        </View>

        <View style={styles.articleHeader}>
          <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>
              {getCategoryName(article.category)}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{getArticleTitle()}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Eye size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {article.views}
              </Text>
            </View>
            <Text style={[styles.metaDot, { color: colors.textSecondary }]}>·</Text>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t('articleDetail.readTime', { minutes: article.readTime })}
              </Text>
            </View>
            <Text style={[styles.metaDot, { color: colors.textSecondary }]}>·</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {article.publishedAt}
            </Text>
          </View>
        </View>

        <View style={styles.articleContent}>
          {getArticleContent()
            ?.split('\n')
            .map((paragraph, index) => (
              <Text key={index} style={[styles.paragraph, { color: colors.textPrimary }]}>
                {paragraph}
              </Text>
            ))}
        </View>

        {article.tags && article.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {article.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.info + '20' }]}>
                <Text style={[styles.tagText, { color: colors.info }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        <LoadingState text={t('common.loading')} />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite}>
          {isFavorited ? (
            <Heart size={24} color={colors.error} fill={colors.error} />
          ) : (
            <Heart size={24} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {renderArticleContent()}

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isSharing}>
          {shareSuccess ? (
            <Check size={24} color={colors.success} />
          ) : (
            <Share2 size={24} color={colors.textPrimary} />
          )}
          <Text
            style={[
              styles.shareText,
              { color: shareSuccess ? colors.success : colors.textSecondary },
            ]}
          >
            {shareSuccess ? t('articleDetail.shared') : t('articleDetail.share')}
          </Text>
        </TouchableOpacity>
        <Button
          title={isFavorited ? t('articleDetail.favorited') : t('articleDetail.favorite')}
          variant={isFavorited ? 'primary' : 'secondary'}
          onPress={toggleFavorite}
        />
      </View>

      <ErrorToast
        visible={articleError.visible}
        message={articleError.message}
        code={articleError.code}
        severity="error"
        duration={0}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  articleContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  articleHeader: {
    padding: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  cover: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaDot: {
    marginHorizontal: spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.md,
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  placeholder: {
    width: 40,
  },
  shareButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  shareText: {
    fontSize: typography.fontSize.sm,
  },
  skeletonArticleContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  skeletonArticleHeader: {
    padding: spacing.xl,
  },
  skeletonCover: {
    height: 200,
  },
  skeletonMeta: {
    borderRadius: 8,
    height: 16,
    width: 120,
  },
  skeletonParagraph: {
    borderRadius: 9,
    height: 18,
    marginBottom: spacing.md,
  },
  skeletonParagraphLast: {
    width: '60%',
  },
  skeletonTag: {
    borderRadius: borderRadius.sm,
    height: 24,
    marginBottom: spacing.md,
    width: 80,
  },
  skeletonTitle: {
    borderRadius: borderRadius.sm,
    height: 40,
    marginBottom: spacing.md,
    width: '90%',
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 32,
    marginBottom: spacing.md,
  },
});
