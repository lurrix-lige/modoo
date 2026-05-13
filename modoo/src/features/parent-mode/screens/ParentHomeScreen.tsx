import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { SafeAreaContainer } from '../../../components';
import {
  FileText,      
  Headphones,   
  MessageSquare,
  BarChart3,    
  Heart,        
  Wind,         
  Baby,        
} from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
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
} from "../../../theme";
import { useAppStore } from "../../../store";
import { DataCard, Button, SettingsPopover, ResponsiveGrid } from "../../../components";
import { ParentStackParamList } from "../../../navigation/types";
import { apiService, authService, type SleepStatsResponse } from "../../../services";
import { DateLabelUtils } from "../../../utils/date";
import { logger } from "../../../utils/logger";

type ParentHomeNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

export default function ParentHomeScreen() {
  
  const navigation = useNavigation<ParentHomeNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { child, enterComfortMode, switchToChildMode } = useAppStore();
 
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  
  const [chartTab, setChartTab] = useState<"week" | "month">("week");
  
  const [articles, setArticles] = useState<any[]>([]);
  
  const [sleepStats, setSleepStats] = useState<SleepStatsResponse | null>(null);
  
  const chartCache = useRef<{ week?: SleepStatsResponse; month?: SleepStatsResponse }>({});
  
  const lastFetchTime = useRef<{ week?: number; month?: number }>({});
  
  const isFetching = useRef(false);
  const CACHE_DURATION = 5 * 60 * 1000;

  
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  
  const checkAuthAndLoadData = async () => {
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      navigation.getParent()?.navigate('Auth', { fromScreen: 'ParentHome' });
      return;
    }

    setIsLoading(true);
    loadInitialData(); 
  };

  const loadInitialData = async () => {
    try {
      
      const [articlesResponse, sleepStatsResponse] = await Promise.all([
        apiService.getArticles(),           
        apiService.getSleepStats(chartTab), 
      ]);

      setArticles(articlesResponse.articles);
      setSleepStats(sleepStatsResponse);
      chartCache.current[chartTab] = sleepStatsResponse;
      lastFetchTime.current[chartTab] = Date.now();

    } catch (error: any) {
      logger.error("Failed to load data", { error });
      if (error?.code === 'UNAUTHORIZED' || error?.statusCode === 401) {
        navigation.getParent()?.navigate('Auth', { fromScreen: 'ParentHome' });
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = useCallback(async () => {
    
    if (isFetching.current) return;

    const now = Date.now();
    const cachedData = chartCache.current[chartTab];
    const lastFetch = lastFetchTime.current[chartTab];

    
    if (cachedData && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      
      setSleepStats(cachedData);
      return;
    }

    
    isFetching.current = true;
    setIsChartLoading(true);
    
    try {
      
      const sleepStatsResponse = await apiService.getSleepStats(chartTab);
      
      
      chartCache.current[chartTab] = sleepStatsResponse;
      lastFetchTime.current[chartTab] = Date.now();
      
      
      setSleepStats(sleepStatsResponse);
      
    } catch (error: any) {
      
      logger.error("Failed to load chart data", { error });
      
      
      
      if (cachedData) {
        setSleepStats(cachedData);
      }
    } finally {
      
      setIsChartLoading(false);
      isFetching.current = false;
    }
  }, [chartTab]);

  
  useEffect(() => {
    
    if (!isLoading && sleepStats) {
      loadChartData();
    }
  }, [chartTab, isLoading, sleepStats, loadChartData]);

  
  const handleChartTabChange = (newTab: "week" | "month") => {
    
    
    if (newTab === chartTab || isChartLoading) return;
    
    
    setChartTab(newTab);
  };

  
  const handleQuickComfort = () => {
    enterComfortMode(); 
    
    navigation.getParent()?.navigate("ComfortMode");
  };

  
  const handleSwitchToChildMode = () => {
    switchToChildMode(); 
  };

  
  const getNightWakesLevel = (nightWakes: number) => {
    if (nightWakes <= 1) return "normal";   
    if (nightWakes <= 3) return "moderate"; 
    return "high";                          
  };

  
  const chartData = chartTab === "week"
    ? sleepStats?.weeklyData   
    : sleepStats?.monthlyData; 

  
  return (
    <SafeAreaContainer
      style={[sharedStyles.container, { backgroundColor: colors.background }]}
    >
      {}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {}
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {t("parentHome.sleepReport")}
              </Text>
              <Text style={[styles.weekLabel, { color: colors.textPrimary }]}>
                {t("parentHome.thisWeek")}
              </Text>
            </View>
            {}
            <View style={styles.headerRight}>
              {}
              <TouchableOpacity
                style={styles.headerRight}
                onPress={handleSwitchToChildMode}
                activeOpacity={0.7}
              >
                <Baby size={responsive.moderateScale(iconSizes.xl)} color={colors.textPrimary} />
              </TouchableOpacity>
              {}
              <SettingsPopover />
            </View>
          </View>
        </View>

        {}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl }}>
          {isLoading ? (
            <>
              <View style={[styles.skeletonCard, { backgroundColor: colors.surface, width: '47%', marginRight: '6%', marginBottom: spacing.md }]} />
              <View style={[styles.skeletonCard, { backgroundColor: colors.surface, width: '47%', marginBottom: spacing.md }]} />
              <View style={[styles.skeletonCard, { backgroundColor: colors.surface, width: '47%', marginRight: '6%', marginBottom: spacing.md }]} />
              <View style={[styles.skeletonCard, { backgroundColor: colors.surface, width: '47%', marginBottom: spacing.md }]} />
            </>
          ) : (
            <>
              <TouchableOpacity style={{ width: '47%', marginRight: '6%', marginBottom: spacing.md }}>
                <DataCard
                  title={t("parentHome.avgDuration")}
                  value={sleepStats?.averageSleepDuration.toString() || "8.0"}
                  unit={t("parentHome.hours")}
                  trend={sleepStats?.averageSleepDurationTrend || "stable"}
                  trendValue={t("parentHome.vsLastWeek", { change: "+0.3" })}
                  icon="time"
                  iconColor={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: '47%', marginBottom: spacing.md }}>
                <DataCard
                  title={t("parentHome.bedtime")}
                  value={sleepStats?.averageBedtime || "21:30"}
                  trend="stable"
                  trendValue={t("parentHome.stability", { stability: sleepStats?.bedtimeStability || 85 })}
                  icon="moon"
                  iconColor={colors.secondary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: '47%', marginRight: '6%', marginBottom: spacing.md }}>
                <DataCard
                  title={t("parentHome.nightWakes")}
                  value={(sleepStats?.nightWakes || 1).toString()}
                  unit={t("parentHome.times")}
                  icon="notifications"
                  trend="down"
                  trendValue={t("parentHome.vsLastWeek", { change: "-2" })}
                  iconColor={getNightWakesLevel(sleepStats?.nightWakes || 1) === "normal" ? colors.success : colors.warning}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: '47%', marginBottom: spacing.md }} onPress={() => navigation.navigate("ParentCheckIn")}>
                <DataCard
                  title={t("parentHome.checkInDays")}
                  value={(sleepStats?.checkInStreak || 0).toString()}
                  unit={t("parentHome.days")}
                  trend="up"
                  trendValue={t("parentHome.longestStreak", { streak: (sleepStats?.longestStreak || 0) })}
                  icon="flame"
                  iconColor={colors.warning}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              {t("parentHome.bedtimeTrend")}
            </Text>
            <View style={styles.chartTabs}>
              <TouchableOpacity
                style={[styles.chartTab, { backgroundColor: chartTab === "week" ? colors.primary : colors.background }]}
                onPress={() => handleChartTabChange("week")}
                disabled={isChartLoading}
              >
                <Text style={chartTab === "week" ? styles.chartTabText : [styles.chartTabTextInactive, { color: colors.textSecondary }]}>
                  {t("parentHome.7Days")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chartTab, { backgroundColor: chartTab === "month" ? colors.primary : colors.background }]}
                onPress={() => handleChartTabChange("month")}
                disabled={isChartLoading}
              >
                <Text style={chartTab === "month" ? styles.chartTabText : [styles.chartTabTextInactive, { color: colors.textSecondary }]}>
                  {t("parentHome.30Days")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isChartLoading && !sleepStats ? (
            <View style={[styles.chart, styles.chartLoading]}>
              {[0,1,2,3,4,5,6].map(i => (
                <View key={i} style={styles.chartBar}>
                  <View style={[styles.barContainer, { backgroundColor: colors.border }]} />
                  <View style={[styles.skeletonLabel, { backgroundColor: colors.border }]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.chart}>
              {(chartData || []).map((day, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
                    <View style={[styles.bar, { backgroundColor: colors.primary, height: `${(day.duration / 12) * 100}%` }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                    {DateLabelUtils.getDayLabel(day.day, t)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t("parentHome.recommendations")}
          </Text>
          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.xl }}>
              <View style={[styles.skeletonArticleCard, { backgroundColor: colors.surface }]} />
              <View style={[styles.skeletonArticleCard, { backgroundColor: colors.surface }]} />
              <View style={[styles.skeletonArticleCard, { backgroundColor: colors.surface }]} />
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.xl }}>
              {articles.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={[styles.articleCard, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate("ArticleDetail", { articleId: article.id })}
                >
                  <View style={[styles.articleCover, { backgroundColor: colors.secondary }]}>
                    {article.coverUrl ? (
                      <Image source={{ uri: article.coverUrl }} style={styles.articleCoverImage} resizeMode="cover" />
                    ) : (
                      <FileText size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
                    )}
                  </View>
                  <Text style={[styles.articleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={[styles.articleMeta, { color: colors.textSecondary }]}>
                    {t("parentHome.minutesRead", { minutes: article.readTime || 5 })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {}
        <ResponsiveGrid columns={2} gap={spacing.md}>
          {}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate("ExpertConsult")}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: colors.secondary }]}
            >
              <Headphones size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
            </View>
            <Text
              style={[styles.actionText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {t("parentHome.expertConsult")}
            </Text>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate("Dialogue")}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: colors.warning }]}
            >
              <MessageSquare size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
            </View>
            <Text
              style={[styles.actionText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {t("parentHome.dialogues")}
            </Text>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate("GrowthRecord")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
              <BarChart3 size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
            </View>
            <Text
              style={[styles.actionText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {t("parentHome.growthFile")}
            </Text>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={handleQuickComfort}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: colors.error }]}
            >
              <Heart size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
            </View>
            <Text
              style={[styles.actionText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {t("parentHome.quickComfort")}
            </Text>
          </TouchableOpacity>

          {}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate("RelaxSpace")}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: colors.info }]}
            >
              <Wind size={responsive.moderateScale(iconSizes.lg)} color={commonColors.white} />
            </View>
            <Text
              style={[styles.actionText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {t("parentHome.relaxSpace")}
            </Text>
          </TouchableOpacity>
        </ResponsiveGrid>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  
  
  
  header: {
    ...sharedStyles.rowBetween, 
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    
    ...Platform.select({
      ios: {
        paddingTop: spacing.xl,
      },
    }),
  },
  
  
  headerRow: {
    ...sharedStyles.rowBetween,
  },
  
  
  headerRight: {
    flex: 1,
    ...sharedStyles.rowCenter,
    gap: spacing.sm,
  },
  
  
  childModeButton: {
    ...sharedStyles.rowEnd,
    padding: spacing.xs,
  },
  
  
  greeting: { 
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  
  
  weekLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
  },
  
  
  shareButton: {
    width: responsive.moderateScale(44),
    height: responsive.moderateScale(44),
    borderRadius: responsive.moderateScale(22), 
    ...sharedStyles.columnCenter,
    ...shadows.small,
  },
  
  
  statsGrid: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  
  
  
  skeletonCard: { 
    height: responsive.verticalScale(100), 
    borderRadius: borderRadius.lg,
  },
  
  
  skeletonArticleCard: {
    height: responsive.verticalScale(180),
    borderRadius: borderRadius.lg,
  },

  
  
  
  chartCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.medium, 
  },
  
  
  chartHeader: {
    ...sharedStyles.rowBetween,
    marginBottom: spacing.lg,
  },
  
  
  chartTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  
  
  chartTabs: {
    flexDirection: "row",
    borderRadius: borderRadius.round, 
    overflow: "hidden", 
  },
  
  
  chartTab: { 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.xs,
  },
  
  
  chartTabText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    color: commonColors.white,
    fontWeight: typography.fontWeight.medium,
  },
  
  
  chartTabTextInactive: { 
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  
  
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: responsive.verticalScale(135),
    alignItems: "flex-end", 
  },
  
  
  chartLoading: {
    alignItems: "center",
  },
  
  
  chartBar: { 
    flex: 1, 
    ...sharedStyles.columnCenter,
    minWidth: responsive.moderateScale(10),
  },
  
  
  barContainer: {
    width: responsive.moderateScale(20),
    height: responsive.verticalScale(108),
    borderRadius: responsive.moderateScale(10),
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  
  
  bar: { 
    width: "100%", 
    borderRadius: responsive.moderateScale(10),
  },
  
  
  barLabel: { 
    fontSize: responsive.scaledFontSize(typography.fontSize.xs), 
    marginTop: spacing.xs,
  },
  
  
  skeletonLabel: {
    width: responsive.moderateScale(20),
    height: responsive.verticalScale(14),
    borderRadius: responsive.moderateScale(7),
    marginTop: spacing.xs,
  },

  
  
  
  section: { 
    paddingHorizontal: spacing.xl, 
    marginBottom: spacing.xl,
  },
  
  
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  
  
  articleCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden", 
    ...shadows.small,
    marginRight: spacing.md,
    width: responsive.moderateScale(280),
  },
  
  articleCover: { 
    height: responsive.verticalScale(120), 
    ...sharedStyles.columnCenter,
    overflow: "hidden",
  },
  
  
  articleCoverImage: { 
    width: "100%", 
    height: "100%",
  },
  
  
  articleTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  
  
  articleMeta: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  
  
  
  actionButton: {
    flex: 1,
    ...sharedStyles.rowStart,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  
  
  actionIcon: {
    width: responsive.moderateScale(44),
    height: responsive.moderateScale(44),
    borderRadius: responsive.moderateScale(22), 
    ...sharedStyles.columnCenter,
    marginRight: spacing.md,
  },
  
  
  actionText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
    flex: 1, 
  },
  
  
  cardWrapper: {
    width: '100%',
  },
});
