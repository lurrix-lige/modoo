import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BookOpen, Leaf, GraduationCap, FileText, Star } from 'lucide-react-native';

const contentIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'book': BookOpen,
  'leaf': Leaf,
  'school': GraduationCap,
  'document-text': FileText,
  'star': Star,
};
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography } from '../../theme';
import { Card } from '../Card';
import { ContentItem } from '../../services';

const { width } = Dimensions.get('window');

interface ContentCardProps {
  item: ContentItem;
  onPress: () => void;
}

export function ContentCard({ item, onPress }: ContentCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getIconName = (type: string) => {
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
        return 'document-text';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.ceil(seconds / 60);
    return `${mins}${t('common.minutes')}`;
  };

  const getTitle = () => {
    if (item.titleKey) {
      return t(item.titleKey);
    }
    return item.title;
  };

  const getDescription = () => {
    if (item.descriptionKey) {
      return t(item.descriptionKey);
    }
    return item.description;
  };

  return (
    <Card style={styles.card} onPress={onPress} variant="glass" elevated>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            {(() => { const IconComp = contentIconMap[getIconName(item.type)] || BookOpen; return <IconComp size={32} color={colors.primary} />; })()}
          </View>
          <View style={styles.headerBadges}>
            {item.duration && (
              <Text style={[styles.duration, { color: colors.textSecondary }]}>
                {formatDuration(item.duration)}
              </Text>
            )}
            {item.isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.primary + '20' }]}>
                <Star size={14} color={colors.primary} />
                <Text style={[styles.premiumText, { color: colors.primary }]}>
                  {t('common.premium')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {getTitle()}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {getDescription()}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    minHeight: 180,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    lineHeight: 22,
    flexShrink: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    flexShrink: 1,
    flexGrow: 0,
  },
  duration: {
    fontSize: typography.fontSize.sm,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  premiumText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
