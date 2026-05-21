import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
} from '../theme';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  initialDate?: string;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DatePickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date().toISOString().split('T')[0],
  title,
  maxDate = new Date().toISOString().split('T')[0],
}: DatePickerModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());

  const yearScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && initialDate) {
      const date = new Date(initialDate);
      setSelectedDate(date);
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date.getMonth());
    }
  }, [visible, initialDate]);

  // 获取当月天数
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 获取星期几（0-6是星期日）
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // 生成年份列表（当前年份前后各5年）
  const generateYears = () => {
    const currentYearValue = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYearValue - 15; i <= currentYearValue; i++) {
      years.push(i);
    }
    return years;
  };

  // 月份列表
  const months = [
    { index: 0, label: '1月' },
    { index: 1, label: '2月' },
    { index: 2, label: '3月' },
    { index: 3, label: '4月' },
    { index: 4, label: '5月' },
    { index: 5, label: '6月' },
    { index: 6, label: '7月' },
    { index: 7, label: '8月' },
    { index: 8, label: '9月' },
    { index: 9, label: '10月' },
    { index: 10, label: '11月' },
    { index: 11, label: '12月' },
  ];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    const maxDateObj = new Date(maxDate);
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    if (
      nextYear < maxDateObj.getFullYear() ||
      (nextYear === maxDateObj.getFullYear() && nextMonth <= maxDateObj.getMonth())
    ) {
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
    }
  };

  // 选择日期
  const selectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    const maxDateObj = new Date(maxDate);

    if (newDate <= maxDateObj) {
      setSelectedDate(newDate);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    onConfirm(dateStr);
    onClose();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const maxDateObj = new Date(maxDate);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              {/* 头部 */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {title || t('common.selectDate')}
                </Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 日期显示 */}
              <View style={styles.dateDisplay}>
                <Text style={[styles.dateValue, { color: colors.textPrimary }]}>
                  {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                  {selectedDate.getDate()}日{' '}
                </Text>
              </View>

              {/* 年份选择 */}
              <View style={styles.yearSelector}>
                <ScrollView
                  ref={yearScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={72}
                  decelerationRate="fast"
                >
                  <View style={styles.yearScrollContainer}>
                    {generateYears().map((year) => {
                      const isSelected = year === selectedDate.getFullYear();
                      return (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.yearItem,
                            isSelected && { backgroundColor: colors.primary },
                          ]}
                          onPress={() => {
                            setCurrentYear(year);
                            setSelectedDate(
                              new Date(year, selectedDate.getMonth(), selectedDate.getDate()),
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.yearText,
                              { color: isSelected ? commonColors.white : colors.textSecondary },
                              isSelected && styles.yearTextActive,
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* 月份导航 */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={goToPrevMonth}
                  disabled={currentYear < new Date(maxDate).getFullYear() - 15}
                >
                  <ChevronLeft size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                  {currentYear}年{months[currentMonth].label}
                </Text>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={goToNextMonth}
                  disabled={
                    currentYear > maxDateObj.getFullYear() ||
                    (currentYear === maxDateObj.getFullYear() &&
                      currentMonth >= maxDateObj.getMonth())
                  }
                >
                  <ChevronRight size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 星期标题 */}
              <View style={styles.weekdayHeader}>
                {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                  <Text key={day} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* 日期网格 */}
              <View style={styles.daysGrid}>
                {/* 空白填充 */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {/* 日期 */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(currentYear, currentMonth, day);
                  const isSelected =
                    selectedDate.getFullYear() === currentYear &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getDate() === day;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isPast = date > maxDateObj;

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayCell, isPast && { opacity: 0.3 }]}
                      onPress={() => !isPast && selectDate(day)}
                      disabled={isPast}
                    >
                      <View
                        style={[
                          styles.dayContent,
                          isSelected && { backgroundColor: colors.primary },
                          isToday && !isSelected && { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && { color: commonColors.white },
                            isToday && !isSelected && { color: colors.primary },
                            !isSelected && !isToday && { color: colors.textPrimary },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
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
  cancelButton: {
    borderRadius: borderRadius.md,
    flex: 1,
    paddingVertical: spacing.md,
    ...sharedStyles.columnCenter,
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  closeButton: {
    padding: spacing.sm,
  },
  confirmButton: {
    borderRadius: borderRadius.md,
    flex: 1,
    paddingVertical: spacing.md,
    ...sharedStyles.columnCenter,
  },
  confirmText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  dateDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  dateValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '14.28%',
  },
  dayContent: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    width: '100%',
    ...shadows.large,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  monthNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  navButton: {
    padding: spacing.sm,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  weekdayText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  yearItem: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.md,
    height: 40,
    justifyContent: 'center',
    width: 72,
  },
  yearScrollContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  yearSelector: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  yearText: {
    fontSize: typography.fontSize.md,
  },
  yearTextActive: {
    fontWeight: typography.fontWeight.bold,
  },
});
