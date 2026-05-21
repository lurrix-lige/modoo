import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  FileText,
  Heart,
  BookOpen,
  MessageSquare,
  Eye,
  Clock,
} from 'lucide-react-native';
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
} from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, Article, Story, Dialogue } from '../../../services';
import { logger } from '../../../utils/logger';

type FavoritesScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

export interface FavoriteItem {
  id: string;
  type: 'article' | 'story' | 'dialogue';
  title?: string;
  titleKey?: string;
  summary?: string;
  coverUrl?: string;
  views?: number;
  readTime?: number;
  category?: string;
  scenario?: string;
  scenarioKey?: string;
  response?: string;
  responseKey?: string;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const [articlesResult, storiesResult, dialoguesResult] = await Promise.all([
        apiService.getFavoriteArticles(),
        apiService.getFavoriteStories(),
        apiService.getFavoriteDialogues(),
      ]);

      const articleFavorites: FavoriteItem[] = articlesResult.articles.map((article: Article) => ({
        id: `article_${article.id}`,
        type: 'article',
        title: article.title,
        summary: article.summary,
        coverUrl: article.coverUrl,
        views: article.views,
        readTime: article.readTime,
        category: article.category,
      }));

      const storyFavorites: FavoriteItem[] = storiesResult.stories.map((story: Story) => ({
        id: `story_${story.id}`,
        type: 'story',
        title: story.titleKey ? t(story.titleKey) : story.title,
        coverUrl: story.coverUrl,
      }));

      const dialogueFavorites: FavoriteItem[] = dialoguesResult.dialogues.map(
        (dialogue: Dialogue) => ({
          id: `dialogue_${dialogue.id}`,
          type: 'dialogue',
          title: dialogue.titleKey ? t(dialogue.titleKey) : dialogue.title,
          scenario: dialogue.scenarioKey ? t(dialogue.scenarioKey) : dialogue.scenario,
          response: dialogue.responseKey ? t(dialogue.responseKey) : dialogue.response,
        }),
      );

      setFavorites([...articleFavorites, ...storyFavorites, ...dialogueFavorites]);
    } catch (error) {
      logger.error('Failed to load favorites', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemPress = (item: FavoriteItem) => {
    const rawId = item.id.replace(/^(article_|story_|dialogue_)/, '');
    switch (item.type) {
      case 'article':
        navigation.navigate('ArticleDetail', { articleId: rawId });
        break;
      case 'story':
        navigation.navigate('StoryPlayer', { storyId: rawId });
        break;
      case 'dialogue':
        navigation.navigate('Dialogue', { scenario: item.scenario });
        break;
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderArticleItem = (item: FavoriteItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.articleCard, { backgroundColor: colors.surface }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={[styles.articleCover, { backgroundColor: colors.secondary }]}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.articleCoverImage}
            resizeMode="cover"
          />
        ) : (
          <FileText size={32} color={commonColors.white} />
        )}
      </View>
      <View style={styles.articleInfo}>
        <View style={styles.tagsRow}>
          <View style={styles.articleTags}>
            <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {t(`knowledge.categories.${item.category}`) || item.category || t('common.article')}
              </Text>
            </View>
          </View>
          <View style={styles.articleMeta}>
            <View style={styles.metaItem}>
              <Eye size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.views}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.readTime}
                {t('knowledge.minutes')}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.itemSummary, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStoryItem = (item: FavoriteItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.storyCard, { backgroundColor: colors.surface }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.storyCoverContainer}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.storyCoverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.storyCoverPlaceholder, { backgroundColor: colors.secondary }]}>
            <BookOpen size={32} color={commonColors.white} />
          </View>
        )}
        <View style={styles.storyIcon}>
          <Heart size={16} color={colors.error} fill={colors.error} />
        </View>
      </View>
      <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderDialogueItem = (item: FavoriteItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.dialogueCard, { backgroundColor: colors.surface }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.dialogueHeader}>
        <View style={[styles.scenarioTag, { backgroundColor: colors.warning + '30' }]}>
          <Text style={[styles.scenarioTagText, { color: colors.warning }]}>{item.scenario}</Text>
        </View>
        <Heart size={16} color={colors.error} fill={colors.error} />
      </View>
      <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.itemSummary, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.response}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = (item: FavoriteItem) => {
    switch (item.type) {
      case 'article':
        return renderArticleItem(item);
      case 'story':
        return renderStoryItem(item);
      case 'dialogue':
        return renderDialogueItem(item);
      default:
        return null;
    }
  };

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('knowledge.favorites')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={48} color={colors.textPlaceholder} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('favorites.empty')}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textPlaceholder }]}>
              {t('favorites.emptyHint')}
            </Text>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('favorites.title')}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {favorites.length} {t('common.items')}
              </Text>
            </View>
            {favorites.map(renderItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  favoritesList: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
  },

  // Article card styles
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
    height: 100,
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
    width: 80,
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
    fontSize: typography.fontSize.xs,
  },
  articleMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
  },
  itemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  itemSummary: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },

  // Story card styles
  storyCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  storyCoverContainer: {
    borderRadius: borderRadius.md,
    height: 120,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  storyCoverImage: {
    height: '100%',
    width: '100%',
  },
  storyCoverPlaceholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  storyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.round,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 28,
  },

  // Dialogue card styles
  dialogueCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  dialogueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scenarioTag: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  scenarioTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
