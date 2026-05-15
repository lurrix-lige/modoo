/**
 * TimePickerModal - 时间选择器弹窗组件
 *
 * 功能说明：
 * - 提供直观的时间选择界面，支持点击和滚动选择
 * - 包含小时和分钟滚轮选择器
 * - 支持24小时制时间选择
 * - 提供确认和取消按钮
 *
 * 交互设计：
 * - 采用iPhone时钟应用风格的时间选择器
 * - 选中项固定在中间位置，保持在同一水平线上
 * - 通过点击或拖拽滚动选择
 * - 视觉反馈清晰，选中项高亮显示
 *
 * 滚动优化：
 * - 精确的滚动位置计算算法
 * - 边界检测机制防止超出范围
 * - 调试日志记录关键数据
 * - 确保停留位置误差控制在一个时间单位以内 */

import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../theme';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void;
  initialTime?: string;
  title?: string;
}

/**
 * 时间选择器常量配置 */
const PICKER_CONFIG = {
  ITEM_HEIGHT: 56,           // 每个选项的高度
  VISIBLE_ITEMS: 5,          // 可见选项数量（需为奇数）
  CENTER_INDEX: 2,           // 中间项的索引（0-based）
  DECELERATION_RATE: 0.985,  // 滚动减速系数，值越小减速越快
  SNAP_THRESHOLD: 0.3,       // 吸附阈值，超过此比例自动吸附到下一项
} as const;

// 调试开关
const DEBUG_MODE = true;

export default function TimePickerModal({
  visible,
  onClose,
  onConfirm,
  initialTime = '21:30',
  title,
}: TimePickerModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  /**
   * 解析初始时间
   * 格式要求：HH:mm（如 "21:30"）
   */
  const parseInitialTime = useCallback((timeStr: string) => {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return {
      hours: isNaN(h) ? 21 : Math.max(0, Math.min(23, h)),
      minutes: isNaN(m) ? 30 : Math.max(0, Math.min(59, Math.round(m / 5) * 5)),
    };
  }, []);

  /**
   * 状态管理：
   * - selectedHours: 当前选中的小时值（0-23）
   * - selectedMinutes: 当前选中的分钟值（0-55，5的倍数）
   */
  const [selectedHours, setSelectedHours] = useState(() => parseInitialTime(initialTime).hours);
  const [selectedMinutes, setSelectedMinutes] = useState(() => parseInitialTime(initialTime).minutes);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // 标志位：用于区分用户触发的滚动和程序触发的滚动
  const isProgrammaticScroll = useRef({ hour: false, minute: false });

  /**
   * 生成小时选项数组（0-23）
   */
  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  /**
   * 生成分钟选项数组（0, 5, 10, ..., 55）
   */
  const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

  /**
   * 计算滚动偏移量
   * 让指定索引的项显示在中间位置
   * 
   * contentContainer有paddingTop = CENTER_INDEX * ITEM_HEIGHT
   * 当scrollOffset=0时，第一项显示在可见区域的顶部
   * 要让第index项显示在中间位置，需要滚动index * ITEM_HEIGHT
   */
  const getScrollOffset = (index: number): number => {
    return index * PICKER_CONFIG.ITEM_HEIGHT;
  };

  /**
   * 当弹窗显示时，用初始值重置选中状态并滚动到正确位置
   * 使用useLayoutEffect确保在布局完成后立即执行
   */
  useLayoutEffect(() => {
    if (visible) {
      const { hours: h, minutes: m } = parseInitialTime(initialTime);

      // 立即更新状态
      setSelectedHours(h);
      setSelectedMinutes(m);

      // 使用requestAnimationFrame确保DOM已完全渲染
      requestAnimationFrame(() => {
        const hourOffset = getScrollOffset(h);
        const minuteOffset = getScrollOffset(m / 5);

        console.log(`[TimePicker] Initial time: ${initialTime}`);
        console.log(`[TimePicker] Hours: ${h}, scroll offset: ${hourOffset}`);
        console.log(`[TimePicker] Minutes: ${m}, scroll offset: ${minuteOffset}`);

        if (hourScrollRef.current) {
          hourScrollRef.current.scrollTo({
            y: hourOffset,
            animated: false
          });
        }
        if (minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({
            y: minuteOffset,
            animated: false
          });
        }
      });
    }
  }, [visible, initialTime, parseInitialTime]);

  /**
   * 根据滚动偏移量计算目标索引
   * 使用吸附算法确保滚动停在正确位置
   * 
   * @param offset 当前滚动偏移量
   * @param maxIndex 最大索引值（小时：23，分钟：11）
   * @param pickerType 选择器类型，用于日志记录
   * @returns 计算后的目标索引
   */
  const calculateTargetIndex = (offset: number, maxIndex: number, pickerType: string): number => {
    // 计算原始索引（可能是小数）
    const rawIndex = offset / PICKER_CONFIG.ITEM_HEIGHT;

    // 计算整数部分和小数部分
    const integerPart = Math.floor(rawIndex);
    const fractionalPart = rawIndex - integerPart;

    // 根据吸附阈值决定向上还是向下取整
    let targetIndex: number;
    if (fractionalPart >= PICKER_CONFIG.SNAP_THRESHOLD && integerPart < maxIndex) {
      targetIndex = integerPart + 1;
    } else if (fractionalPart < (1 - PICKER_CONFIG.SNAP_THRESHOLD) && integerPart > 0) {
      targetIndex = integerPart;
    } else {
      // 接近边界时，使用四舍五入
      targetIndex = Math.round(rawIndex);
    }

    // 边界检测：确保不超出范围
    const clampedIndex = Math.max(0, Math.min(maxIndex, targetIndex));

    /*** 调试日志
    if (DEBUG_MODE) {
      console.log(`[TimePicker:${pickerType}] 原始偏移量: ${offset.toFixed(2)}`);
      console.log(`[TimePicker:${pickerType}] 原始索引: ${rawIndex.toFixed(4)}`);
      console.log(`[TimePicker:${pickerType}] 整数部分: ${integerPart}, 小数部分: ${fractionalPart.toFixed(4)}`);
      console.log(`[TimePicker:${pickerType}] 计算目标索引: ${targetIndex}, 边界修正后: ${clampedIndex}`);
    }
    */
    return clampedIndex;
  };

  /**
   * 滚动结束处理 - 小时选择器
   */
  const handleHourScrollEnd = (event: any) => {
    // 检查是否是程序触发的滚动，如果是则跳过
    if (isProgrammaticScroll.current.hour) {
      isProgrammaticScroll.current.hour = false;
      return;
    }

    const { contentOffset, velocity } = event.nativeEvent;

    // 安全检查：确保 contentOffset 存在
    if (!contentOffset) {
      console.warn('[TimePicker:Hour] contentOffset is undefined');
      return;
    }

    const y = contentOffset.y;
    const scrollVelocity = velocity?.y ?? 0;

    // 计算目标索引
    const clampedIndex = calculateTargetIndex(y, 23, 'Hour');

    // 记录选中值
    setSelectedHours(clampedIndex);

    // 计算目标滚动位置
    const targetOffset = getScrollOffset(clampedIndex);

    // 调试日志
    if (DEBUG_MODE) {
      console.log(`[TimePicker:Hour] 滚动速度: ${scrollVelocity.toFixed(4)}`);
      console.log(`[TimePicker:Hour] 目标偏移量: ${targetOffset}, 实际偏移量: ${y.toFixed(2)}`);
      console.log(`[TimePicker:Hour] 最终选中值: ${clampedIndex}`);
    }

    // 确保滚动到精确位置
    isProgrammaticScroll.current.hour = true;
    hourScrollRef.current?.scrollTo({
      y: targetOffset,
      animated: true
    });
  };

  /**
   * 滚动结束处理 - 分钟选择器
   */
  const handleMinuteScrollEnd = (event: any) => {
    // 检查是否是程序触发的滚动，如果是则跳过
    if (isProgrammaticScroll.current.minute) {
      isProgrammaticScroll.current.minute = false;
      return;
    }

    const { contentOffset } = event.nativeEvent;

    // 安全检查：确保 contentOffset 存在
    if (!contentOffset) {
      console.warn('[TimePicker:Minute] contentOffset is undefined');
      return;
    }

    const y = contentOffset.y;

    // 计算目标索引
    const clampedIndex = calculateTargetIndex(y, 11, 'Minute');

    // 记录选中值
    setSelectedMinutes(clampedIndex * 5);

    // 计算目标滚动位置
    const targetOffset = getScrollOffset(clampedIndex);

    // 调试日志
    //if (DEBUG_MODE) {
    //console.log(`[TimePicker:Minute] 滚动速度: ${scrollVelocity.toFixed(4)}`);
    //console.log(`[TimePicker:Minute] 目标偏移量: ${targetOffset}, 实际偏移量: ${y.toFixed(2)}`);
    //console.log(`[TimePicker:Minute] 最终选中值: ${clampedIndex * 5}`);
    // }

    // 确保滚动到精确位置
    isProgrammaticScroll.current.minute = true;
    minuteScrollRef.current?.scrollTo({
      y: targetOffset,
      animated: true
    });
  };

  /**
   * 确认选择
   */
  const handleConfirm = () => {
    const time = `${selectedHours.toString().padStart(2, '0')}:${selectedMinutes.toString().padStart(2, '0')}`;
    onConfirm(time);
    onClose();
  };

  /**
   * 点击选项时直接设置为选中值
   */
  const handleHourPress = (hour: number) => {
    setSelectedHours(hour);
    hourScrollRef.current?.scrollTo({
      y: getScrollOffset(hour),
      animated: true
    });
  };

  const handleMinutePress = (minute: number) => {
    setSelectedMinutes(minute);
    minuteScrollRef.current?.scrollTo({
      y: getScrollOffset(minute / 5),
      animated: true
    });
  };

  /**
   * 计算容器高度
   */
  const pickerContainerHeight = PICKER_CONFIG.ITEM_HEIGHT * PICKER_CONFIG.VISIBLE_ITEMS;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              {/* 头部：标题和关闭按钮 */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {title || t('common.selectTime')}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 选择器区域 */}
              <View style={styles.pickerWrapper}>
                {/* 选中指示器 */}
                <View
                  style={[
                    styles.selectorIndicator,
                    { backgroundColor: colors.primary, opacity: 0.15 }
                  ]}
                  pointerEvents="none"
                />

                <View style={styles.pickerContainer}>
                  {/* 小时选择器 */}
                  <View style={styles.pickerColumn}>
                    <ScrollView
                      ref={hourScrollRef as any}
                      style={[styles.pickerScroll, { height: pickerContainerHeight }]}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={PICKER_CONFIG.ITEM_HEIGHT}
                      snapToAlignment="start"
                      decelerationRate={PICKER_CONFIG.DECELERATION_RATE}
                      bounces={false}
                      onMomentumScrollEnd={handleHourScrollEnd}
                      onScrollEndDrag={handleHourScrollEnd}
                    >
                      {hoursList.map((hour) => (
                        <TouchableOpacity
                          key={`hour-${hour}`}
                          style={styles.pickerItem}
                          onPress={() => handleHourPress(hour)}
                        >
                          <Text
                            style={[
                              styles.pickerText,
                              hour === selectedHours ? {
                                color: colors.primary,
                                fontWeight: typography.fontWeight.bold,
                                fontSize: typography.fontSize.xl
                              } : {
                                color: colors.textSecondary,
                                fontSize: typography.fontSize.lg,
                                opacity: 0.5
                              },
                            ]}
                          >
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>{t('common.hour')}</Text>
                  </View>

                  {/* 时间分隔符 - 与选中项垂直居中对齐 */}
                  <View style={styles.separatorContainer}>
                    <Text style={[styles.separatorText, { color: colors.textPrimary, fontWeight: typography.fontWeight.bold }]}>:</Text>
                  </View>

                  {/* 分钟选择器 */}
                  <View style={styles.pickerColumn}>
                    <ScrollView
                      ref={minuteScrollRef as any}
                      style={[styles.pickerScroll, { height: pickerContainerHeight }]}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={PICKER_CONFIG.ITEM_HEIGHT}
                      snapToAlignment="start"
                      decelerationRate={PICKER_CONFIG.DECELERATION_RATE}
                      bounces={false}
                      onMomentumScrollEnd={handleMinuteScrollEnd}
                      onScrollEndDrag={handleMinuteScrollEnd}
                    >
                      {minutesList.map((minute) => (
                        <TouchableOpacity
                          key={`minute-${minute}`}
                          style={styles.pickerItem}
                          onPress={() => handleMinutePress(minute)}
                        >
                          <Text
                            style={[
                              styles.pickerText,
                              minute === selectedMinutes ? {
                                color: colors.primary,
                                fontWeight: typography.fontWeight.bold,
                                fontSize: typography.fontSize.xl
                              } : {
                                color: colors.textSecondary,
                                fontSize: typography.fontSize.lg,
                                opacity: 0.5
                              },
                            ]}
                          >
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>{t('common.minute')}</Text>
                  </View>
                </View>
              </View>

              {/* 底部按钮 */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background }]}
                  onPress={onClose}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.confirmText, { color: commonColors.white }]}>
                    {t('common.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  closeButton: {
    padding: spacing.sm,
  },
  pickerWrapper: {
    position: 'relative',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  selectorIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -PICKER_CONFIG.ITEM_HEIGHT / 2,
    width: '70%',
    height: PICKER_CONFIG.ITEM_HEIGHT,
    borderRadius: borderRadius.md,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  pickerColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  pickerScroll: {
    width: 80,
  },
  pickerContent: {
    paddingTop: PICKER_CONFIG.ITEM_HEIGHT * PICKER_CONFIG.CENTER_INDEX,
    paddingBottom: PICKER_CONFIG.ITEM_HEIGHT * PICKER_CONFIG.CENTER_INDEX,
  },
  pickerItem: {
    height: PICKER_CONFIG.ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    textAlign: 'center',
  },
  pickerLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  // 分隔符容器 - 确保冒号与中间选中项垂直对齐
  separatorContainer: {
    width: 24,
    height: PICKER_CONFIG.ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    // 选中项在距离顶部 CENTER_INDEX * ITEM_HEIGHT 的位置
    // 使用 marginTop 确保冒号与选中项在同一水平线
    marginTop: PICKER_CONFIG.CENTER_INDEX * PICKER_CONFIG.ITEM_HEIGHT,
  },
  separatorText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...sharedStyles.columnCenter,
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...sharedStyles.columnCenter,
  },
  confirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});
