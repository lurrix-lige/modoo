export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.5,
    relaxed: 1.6,
  },
};

export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
};

export const minTapArea = {
  children: 60,
  childrenOlder: 48,
  adult: 44,
};

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  hero: 80,
};

export const componentIconSizes = {
  childProfile: {
    backButton: iconSizes.lg,
    editButton: iconSizes.md,
    infoIcon: 18,
    guardianIcon: iconSizes.xl,
    guardianIconLarge: 36,
    problemChip: iconSizes.sm - 2,
    inputIcon: iconSizes.md,
    genderButton: iconSizes.lg,
    ipIcon: iconSizes.xl,
    ipIconLarge: 36,
    problemButton: iconSizes.md,
  },
};

export const skeleton = {
  lineHeight: 16,
  titleHeight: 24,
  titleWidth: 100,
  subtitleWidth: 60,
  avatarSize: 44,
  craterWidth: 30,
  craterHeight: 30,
  bubbleWidth: 200,
  bubbleHeight: 40,
  categoryWidth: 70,
  moonSize: 200,
  moonInnerSize: 140,
};

export const microInteractions = {
  scale: {
    pressed: 0.97,
    hover: 1.02,
  },
  opacity: {
    pressed: 0.9,
    hover: 0.85,
  },
  duration: {
    fast: 100,
    normal: 200,
    slow: 300,
  },
};

export const layout = {
  zIndex: {
    modal: 100,
    header: 50,
    overlay: 40,
    content: 10,
  },
  headerRightTop: 50,
  headerRightRight: 16,
};
