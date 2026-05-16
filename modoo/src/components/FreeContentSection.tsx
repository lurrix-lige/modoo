import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Gift, Book, GraduationCap, Leaf, Star } from 'lucide-react-native';
import { useTheme, spacing, borderRadius, commonColors, typography, responsive } from '../theme';
import { ContentItem } from '../services';

interface FreeContentSectionProps {
  content: ContentItem[];
  onContentPress: (contentId: string, type: string) => void;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'story':
      return Book;
    case 'course':
      return GraduationCap;
    case 'breathing':
      return Leaf;
    default:
      return Star;
  }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function FreeContentSection({ content, onContentPress }: FreeContentSectionProps) {
  const { colors } = useTheme();

  const thumbnailColors = [colors.primary, colors.secondary, colors.accent, colors.warning];
  const sortedContent = [...content].sort((a, b) => a.priority - b.priority);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
          <Gift size={16} color={commonColors.white} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>免费体验</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.contentList}>
          {sortedContent.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.contentCard, { backgroundColor: colors.surface }]}
              onPress={() => onContentPress(item.id, item.type)}
            >
              <View
                style={[
                  styles.thumbnail,
                  { backgroundColor: thumbnailColors[index % thumbnailColors.length] },
                ]}
              >
                {(() => { const IconComp = getIconForType(item.type); return <IconComp size={32} color={commonColors.white} />; })()}
              </View>
              <View style={styles.contentInfo}>
                <Text style={[styles.contentTitle, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.contentDesc, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
                {item.duration && (
                  <Text style={[styles.duration, { color: colors.textSecondary }]}>
                    {formatDuration(item.duration)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: '600',
  },
  contentList: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  contentCard: {
    width: 140,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    padding: spacing.sm,
  },
  contentTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: '500',
    marginBottom: 4,
  },
  contentDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginBottom: 4,
  },
  duration: {
    fontSize: responsive.scaledFontSize(11),  // 11px 非常小，使用固定值
  },
});