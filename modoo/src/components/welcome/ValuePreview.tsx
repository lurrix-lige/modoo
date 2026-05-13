import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, Leaf, GraduationCap, User } from 'lucide-react-native';

const valueIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'book': BookOpen,
  'leaf': Leaf,
  'school': GraduationCap,
  'person': User,
};
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography } from '../../theme';
import { Card } from '../Card';
import { useResponsive } from '../../hooks';

interface ValueItem {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

const VALUE_ITEMS: ValueItem[] = [
  {
    icon: 'book',
    titleKey: 'welcome.value.content',
    descriptionKey: 'welcome.value.contentDesc',
  },
  {
    icon: 'leaf',
    titleKey: 'welcome.value.breathing',
    descriptionKey: 'welcome.value.breathingDesc',
  },
  {
    icon: 'school',
    titleKey: 'welcome.value.courses',
    descriptionKey: 'welcome.value.coursesDesc',
  },
  {
    icon: 'person',
    titleKey: 'welcome.value.support',
    descriptionKey: 'welcome.value.supportDesc',
  },
];

export function ValuePreview() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getContentCardWidth, isTablet } = useResponsive();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {t('welcome.valueTitle')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('welcome.valueSubtitle')}
      </Text>

      <View style={[styles.itemsContainer, { gap: isTablet ? spacing.lg : spacing.md }]}>
        {VALUE_ITEMS.map((item, index) => (
          <View key={index} style={{ width: getContentCardWidth() }}>
            <Card style={styles.item} variant="glass" elevated>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                {(() => { const IconComp = valueIconMap[item.icon] || BookOpen; return <IconComp size={28} color={colors.primary} />; })()}
              </View>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                {t(item.titleKey)}
              </Text>
              <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                {t(item.descriptionKey)}
              </Text>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  itemDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
});
