import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, sharedStyles, responsive, layout } from '../../../theme';
import { BookOpen, GraduationCap, Leaf, Star } from 'lucide-react-native';
import {
  WelcomeHero,
  ContentCard,
  FeatureCard,
  ValuePreview,
  GentleInvitation,
  ContentSkeleton,
  SettingsPopover,
  Card,
} from '../../../components';
import { RootStackParamList } from '../../../navigation/types';
import { useVisitTracker, useFadeIn, useParallax, useResponsive } from '../../../hooks';
import { apiService, ContentItem } from '../../../services';
import { useAppStore } from '../../../store';


type WelcomeHomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  {
    icon: BookOpen,
    titleKey: 'welcome.storyTitle',
    descriptionKey: 'welcome.storyDesc'
  },
  {
    icon: GraduationCap,
    titleKey: 'welcome.courseTitle',
    descriptionKey: 'welcome.courseDesc'
  },
  {
    icon: Leaf,
    titleKey: 'welcome.breathingTitle',
    descriptionKey: 'welcome.breathingDesc'
  },
  {
    icon: Star,
    titleKey: 'welcome.guardianTitle',
    descriptionKey: 'welcome.guardianDesc'
  },
];

export default function WelcomeHomeScreen() {
  const navigation = useNavigation<WelcomeHomeNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { userState } = useAppStore();
  const { visitCount } = useVisitTracker();
  const { getContentCardWidth, getContentLimit, isTablet } = useResponsive();

  const [freeContent, setFreeContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroAnimation = useFadeIn(0);
  const contentAnimation = useFadeIn(200);
  const featuresAnimation = useFadeIn(400);
  const valueAnimation = useFadeIn(600);
  const invitationAnimation = useFadeIn(800);
  const heroParallax = useParallax(scrollY);

  useEffect(() => {
    loadFreeContent();
  }, []);

  const loadFreeContent = async () => {
    try {
      const recommendations = await apiService.getContentRecommendations();
      const freeItems = [...recommendations.featuredContent, ...Object.values(recommendations.categoryContent).flat()]
        .filter(item => !item.isPremium)
        .slice(0, getContentLimit());
      setFreeContent(freeItems);
    } catch {
      setFreeContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = () => {
    navigation.navigate('Main');
  };

  const handleStart = () => {
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.headerRight}>
        <SettingsPopover />
      </View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View style={heroParallax}>
          <Animated.View style={heroAnimation}>
            <WelcomeHero />
          </Animated.View>
        </Animated.View>

        <Animated.View style={contentAnimation}>
          {loading ? (
            <ContentSkeleton />
          ) : (
            freeContent.length > 0 && (
              <View style={styles.contentSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t('welcome.discoverContent')}
                </Text>
                <View style={[
                  styles.contentGrid,
                  { gap: isTablet ? spacing.lg : spacing.md }
                ]}>
                  {freeContent.map((item, index) => (
                    <View
                      key={`${item.id}-${index}`}
                      style={{ width: getContentCardWidth() }}
                    >
                      <ContentCard
                        item={item}
                        onPress={handleContentPress}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )
          )}
        </Animated.View>

        <Animated.View style={featuresAnimation}>
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('welcome.featureSection')}
            </Text>
            <View style={[
              styles.featuresGrid,
              { gap: isTablet ? spacing.xs : spacing.md }
            ]}>
              {FEATURES.map((feature, index) => (
                <View
                  key={index}
                  style={{ width: getContentCardWidth() }}
                >
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
  headerRight: {
    position: 'absolute',
    top: responsive.moderateScale(layout.headerRightTop),
    right: responsive.moderateScale(layout.headerRightRight),
    zIndex: layout.zIndex.modal,
  },
  scrollView: {
    flex: 1,
  },
  contentSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featuresSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    ...sharedStyles.columnCenter,
  },
  footerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
});
