import type { Service } from '../types';

export const serviceApi = {
  getServices: (): Service[] => [
    {
      id: 'expert',
      titleKey: 'services.expert',
      descKey: 'services.expertDesc',
      icon: 'headset',
      colorKey: 'info',
    },
    {
      id: 'course',
      titleKey: 'services.course',
      descKey: 'services.courseDesc',
      icon: 'school',
      colorKey: 'success',
    },
    {
      id: 'report',
      titleKey: 'services.report',
      descKey: 'services.reportDesc',
      icon: 'document-text',
      colorKey: 'primary',
    },
  ],
};
