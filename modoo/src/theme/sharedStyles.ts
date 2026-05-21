import { StyleSheet } from 'react-native';
import { spacing } from './spacing';

export const sharedStyles = StyleSheet.create({
  // 页面容器
  container: {
    flex: 1,
  },
  scrollContentPadded: {
    flexGrow: 1,
    padding: spacing.xl,
  },

  // 布局 - 行
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rowStart: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rowEnd: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // 布局 - 列
  columnCenter: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  // 弹性
  flex1: {
    flex: 1,
  },
  flexGrow1: {
    flexGrow: 1,
  },

  // 绝对定位
  absoluteFill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  // 内边距
  paddingLg: {
    padding: spacing.lg,
  },
  paddingXl: {
    padding: spacing.xl,
  },
  paddingHorizontalLg: {
    paddingHorizontal: spacing.lg,
  },
  paddingHorizontalXl: {
    paddingHorizontal: spacing.xl,
  },
  paddingVerticalMd: {
    paddingVertical: spacing.md,
  },
  paddingVerticalLg: {
    paddingVertical: spacing.lg,
  },

  // 外边距
  marginBottomMd: {
    marginBottom: spacing.md,
  },
  marginBottomLg: {
    marginBottom: spacing.lg,
  },
  marginBottomXl: {
    marginBottom: spacing.xl,
  },
  marginTopMd: {
    marginTop: spacing.md,
  },
  marginTopLg: {
    marginTop: spacing.lg,
  },
  marginTopXl: {
    marginTop: spacing.xl,
  },
});
