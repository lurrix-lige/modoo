import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  MessageCircle,
  ChevronRight,
  Moon,
  Heart,
  Send,
  Copy,
  Star,
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
import { apiService, Dialogue } from '../../../services';
import { LoadingState, ErrorToast } from '../../../components';
import { logger } from '../../../utils/logger';

type DialogueScenario = 'fear' | 'nightmare' | 'sleep' | 'discipline' | 'emotion' | 'all';

type DialogueScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'Dialogue'>;

const SCENARIOS: { id: DialogueScenario | 'all'; labelKey: string }[] = [
  { id: 'all', labelKey: 'dialogue.all' },
  { id: 'fear', labelKey: 'dialogue.fear' },
  { id: 'nightmare', labelKey: 'dialogue.nightmare' },
  { id: 'sleep', labelKey: 'dialogue.sleep' },
];

interface DialogueError {
  visible: boolean;
  message: string;
  code?: string;
}

interface FavoriteState {
  [key: string]: boolean;
}

export default function DialogueScreen({
  route,
}: {
  route?: { params?: { scenario?: string } } | undefined;
}) {
  const navigation = useNavigation<DialogueScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const initialScenario = route?.params?.scenario as DialogueScenario | 'all' | undefined;
  const [selectedScenario, setSelectedScenario] = useState<DialogueScenario | 'all'>(
    initialScenario || 'all',
  );
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteStates, setFavoriteStates] = useState<FavoriteState>({});
  const [error, setError] = useState<DialogueError>({
    visible: false,
    message: '',
  });

  const scenarioTagBg = isDark ? colors.warning + '30' : colors.primaryLight;
  const scenarioTagTextColor = isDark ? colors.warning : colors.primary;
  const scenarioSelectedTextColor = commonColors.white;
  const scenarioButtonBg = isDark ? colors.surface : colors.background;
  const scenarioButtonTextColor = isDark ? colors.textSecondary : colors.textPrimary;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError({ visible: false, message: '' });
    try {
      const response = await apiService.getDialogues();
      setDialogues(response.dialogues);
      const favorites: FavoriteState = {};
      response.dialogues.forEach((d) => {
        favorites[d.id] = d.isFavorite || false;
      });
      setFavoriteStates(favorites);
    } catch (error) {
      logger.error('Failed to load dialogues', { error });
      showError(t('dialogue.loadError'), 'DIALOGUE_LOAD_ERROR', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (message: string, code: string, error?: unknown) => {
    logger.error(message, { error });
    setError({
      visible: true,
      message,
      code,
    });
  };

  const handleRetry = () => {
    setError({ visible: false, message: '' });
    loadData();
  };

  const handleDismissError = () => {
    setError({ visible: false, message: '' });
  };

  const filteredDialogues =
    selectedScenario === 'all'
      ? dialogues
      : dialogues.filter(
          (d) =>
            d.scenario === selectedScenario ||
            d.scenarioKey?.includes(`.${selectedScenario}.`) ||
            d.category === selectedScenario,
        );

  const getTextForKeyOrValue = (key?: string, fallbackValue?: string): string => {
    if (key) {
      if (key.startsWith('dialogue.') && !key.includes('dialogue.items.')) {
        const parts = key.split('.');
        if (parts.length === 3 && ['title', 'response', 'scenario'].includes(parts[2])) {
          const newKey = `dialogue.items.${parts[1]}.${parts[2]}`;
          const translation = t(newKey);
          if (translation !== newKey) {
            return translation;
          }
        }
      }
      const translation = t(key);
      return translation !== key ? translation : fallbackValue || key;
    }
    return fallbackValue || '';
  };

  const getTagText = (tag: string): string => {
    const translationKey = `dialogue.tags.${tag}`;
    const translation = t(translationKey);
    return translation !== translationKey ? translation : tag;
  };

  const handleCopy = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert(t('common.success'), t('dialogue.copied'));
    } catch (error) {
      logger.error('Failed to copy', { error });
      Alert.alert(t('common.error'), t('dialogue.copyError'));
    }
  };

  const toggleFavorite = async (dialogueId: string) => {
    try {
      const currentState = favoriteStates[dialogueId] || false;
      if (currentState) {
        await apiService.unfavoriteDialogue(dialogueId);
        setFavoriteStates((prev) => ({ ...prev, [dialogueId]: false }));
      } else {
        await apiService.favoriteDialogue(dialogueId);
        setFavoriteStates((prev) => ({ ...prev, [dialogueId]: true }));
      }
    } catch (error) {
      logger.error('Failed to toggle favorite', { error });
      showError(t('dialogue.favoriteError'), 'FAVORITE_ERROR', error);
    }
  };

  const handleUse = async (dialogueId: string) => {
    try {
      await apiService.useDialogue(dialogueId);
      setDialogues((prev) =>
        prev.map((d) => (d.id === dialogueId ? { ...d, useCount: (d.useCount || 0) + 1 } : d)),
      );
    } catch (error) {
      logger.error('Failed to record usage', { error });
    }
  };

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('dialogue.title')}</Text>
      </View>

      <View style={styles.scenarioContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={[
                styles.scenarioButton,
                {
                  backgroundColor:
                    selectedScenario === scenario.id ? colors.warning : scenarioButtonBg,
                  borderColor: selectedScenario === scenario.id ? 'transparent' : colors.border,
                  borderWidth: selectedScenario === scenario.id ? 0 : 1,
                },
              ]}
              onPress={() => setSelectedScenario(scenario.id)}
            >
              <Text
                style={[
                  styles.scenarioText,
                  {
                    color:
                      selectedScenario === scenario.id
                        ? scenarioSelectedTextColor
                        : scenarioButtonTextColor,
                  },
                ]}
              >
                {t(scenario.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingState />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredDialogues.map((dialogue) => (
            <View
              key={dialogue.id}
              style={[styles.dialogueCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.dialogueHeader}>
                <View style={[styles.scenarioTag, { backgroundColor: scenarioTagBg }]}>
                  <Text style={[styles.scenarioTagText, { color: scenarioTagTextColor }]}>
                    {getTextForKeyOrValue(dialogue.scenarioKey, dialogue.scenario)}
                  </Text>
                </View>
                {dialogue.isPremium && (
                  <View style={[styles.premiumTag, { backgroundColor: colors.warning + '20' }]}>
                    <Star size={12} color={colors.warning} />
                    <Text style={[styles.premiumText, { color: colors.warning }]}>
                      {t('common.premium')}
                    </Text>
                  </View>
                )}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      handleCopy(getTextForKeyOrValue(dialogue.responseKey, dialogue.response));
                      handleUse(dialogue.id);
                    }}
                  >
                    <Copy size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleFavorite(dialogue.id)}
                  >
                    <Heart
                      size={20}
                      color={favoriteStates[dialogue.id] ? colors.error : colors.textSecondary}
                      fill={favoriteStates[dialogue.id] ? colors.error : 'none'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.dialogueTitle, { color: colors.textPrimary }]}>
                {getTextForKeyOrValue(dialogue.titleKey, dialogue.title)}
              </Text>

              <View style={[styles.responseBox, { backgroundColor: colors.background }]}>
                <View style={styles.responseHeader}>
                  <MessageCircle size={16} color={colors.secondary} />
                  <Text style={[styles.responseLabel, { color: colors.secondary }]}>
                    {t('dialogue.suggestedResponse')}
                  </Text>
                </View>
                <Text style={[styles.responseText, { color: colors.textPrimary }]}>
                  {getTextForKeyOrValue(dialogue.responseKey, dialogue.response)}
                </Text>
              </View>

              <View style={styles.tagsRow}>
                <View style={styles.tagsContainer}>
                  {dialogue.tags.map((tag, index) => (
                    <View
                      key={`${dialogue.id}-${tag}-${index}`}
                      style={[styles.tag, { backgroundColor: colors.border }]}
                    >
                      <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                        #{getTagText(tag)}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.useCount}>
                  <Text style={[styles.useCountText, { color: colors.textSecondary }]}>
                    {t('dialogue.usedCount', { count: dialogue.useCount })}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <ErrorToast
        visible={error.visible}
        message={error.message}
        code={error.code}
        severity="error"
        duration={0}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    padding: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  dialogueCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  dialogueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dialogueTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  header: {
    ...sharedStyles.rowStart,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  premiumTag: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  premiumText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  responseBox: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  responseHeader: {
    ...sharedStyles.rowStart,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  responseLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  responseText: {
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  scenarioButton: {
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scenarioContainer: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  scenarioTag: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  scenarioTagText: {
    fontSize: typography.fontSize.xs,
  },
  scenarioText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tag: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  useCount: {
    marginLeft: spacing.sm,
  },
  useCountText: {
    fontSize: typography.fontSize.xs,
  },
});
