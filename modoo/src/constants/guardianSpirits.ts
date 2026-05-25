import { GuardianIconType } from '../components/GuardianSpirit';

export type GuardianSpiritId = 'moon' | 'firefly' | 'star';

export interface GuardianSpiritConfig {
  id: GuardianSpiritId;
  nameKey: string;
  descriptionKey: string;
  icon: GuardianIconType;
  color: string;
  type: string;
  animationUrl?: string;
  personality?: string[];
  createdAt?: string;
}

export const GUARDIAN_SPIRIT_CONFIG: GuardianSpiritConfig[] = [
  {
    id: 'moon',
    nameKey: 'home.moonGuardian',
    descriptionKey: 'home.moonGuardianDesc',
    icon: 'moon',
    color: '#7EAEC4',
    type: 'MOON',
    animationUrl: '',
    personality: ['gentle', 'caring', 'wise'],
    createdAt: '',
  },
  {
    id: 'firefly',
    nameKey: 'home.fireflyGuardian',
    descriptionKey: 'home.fireflyGuardianDesc',
    icon: 'zap',
    color: '#E8C547',
    type: 'FIREFLY',
    animationUrl: '',
    personality: ['bright', 'brave', 'cheerful'],
    createdAt: '',
  },
  {
    id: 'star',
    nameKey: 'home.starGuardian',
    descriptionKey: 'home.starGuardianDesc',
    icon: 'star',
    color: '#B4A7D6',
    type: 'STAR',
    animationUrl: '',
    personality: ['bright', 'magical', 'hopeful'],
    createdAt: '',
  },
];

export const getGuardianSpiritById = (
  id: GuardianSpiritId | string,
): GuardianSpiritConfig | undefined => {
  return GUARDIAN_SPIRIT_CONFIG.find((spirit) => spirit.id === id);
};

export const getDefaultGuardianSpirit = (): GuardianSpiritConfig => {
  return GUARDIAN_SPIRIT_CONFIG[0];
};

export interface GuideStepConfig {
  icon: GuardianIconType;
  color: string;
  animationType: 'breathe' | 'pulse' | 'float' | 'scale' | 'none';
}

export const GUIDE_STEPS: GuideStepConfig[] = [
  {
    icon: 'moon',
    color: '#7EAEC4',
    animationType: 'breathe',
  },
  {
    icon: 'star',
    color: '#E8C547',
    animationType: 'pulse',
  },
  {
    icon: 'shield-checkmark',
    color: '#6BBF7A',
    animationType: 'float',
  },
];
