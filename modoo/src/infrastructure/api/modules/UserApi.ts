import { apiService } from '../ApiService';
import type {
  UserProfile,
  ChildProfile,
  CreateChildRequest,
  NotificationSettings,
  PrivacySettings,
  ExportDataResponse,
  DeleteAccountResponse,
} from '../types';

export const userApi = {
  getUserProfile: () => apiService.get<UserProfile>('/users/profile'),
  updateUserProfile: (data: Partial<Pick<UserProfile, 'nickname' | 'avatar'>>) =>
    apiService.put<UserProfile>('/users/profile', data),
  getChildProfile: async (): Promise<ChildProfile | null> => {
    try {
      return await apiService.get<ChildProfile>('/users/child', true);
    } catch {
      return null;
    }
  },
  createChildProfile: (data: CreateChildRequest) => apiService.post<ChildProfile>('/users/child', data),
  updateChildProfile: (data: Partial<CreateChildRequest>) =>
    apiService.put<ChildProfile>('/users/child', data),
  getNotificationSettings: () => apiService.get<NotificationSettings>('/settings/notifications'),
  updateNotificationSettings: (data: NotificationSettings) =>
    apiService.put<NotificationSettings>('/settings/notifications', data),
  registerPushToken: (data: { token: string; platform: string }) =>
    apiService.post<{ success: boolean }>('/users/push-token', data),
  getPrivacySettings: () => apiService.get<PrivacySettings>('/settings/privacy'),
  updatePrivacySettings: (data: PrivacySettings) =>
    apiService.put<PrivacySettings>('/settings/privacy', data),
  exportUserData: () => apiService.post<ExportDataResponse>('/settings/export', {}),
  deleteAccount: () => apiService.post<DeleteAccountResponse>('/settings/delete', {}),
};
