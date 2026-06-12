import { apiService, UserProfile, ChildProfile, CreateChildRequest, NotificationSettings, PrivacySettings, ExportDataResponse, DeleteAccountResponse } from '../ApiService';

export const userApi = {
  getUserProfile: (): Promise<UserProfile> => apiService.getUserProfile(),
  updateUserProfile: (data: Partial<Pick<UserProfile, 'nickname' | 'avatar'>>): Promise<UserProfile> =>
    apiService.updateUserProfile(data),
  getChildProfile: (): Promise<ChildProfile | null> => apiService.getChildProfile(),
  createChildProfile: (data: CreateChildRequest): Promise<ChildProfile> =>
    apiService.createChildProfile(data),
  updateChildProfile: (data: Partial<CreateChildRequest>): Promise<ChildProfile> =>
    apiService.updateChildProfile(data),
  getNotificationSettings: (): Promise<NotificationSettings> => apiService.getNotificationSettings(),
  updateNotificationSettings: (data: NotificationSettings): Promise<NotificationSettings> =>
    apiService.updateNotificationSettings(data),
  registerPushToken: (data: { token: string; platform: string }): Promise<{ success: boolean }> =>
    apiService.registerPushToken(data),
  getPrivacySettings: (): Promise<PrivacySettings> => apiService.getPrivacySettings(),
  updatePrivacySettings: (data: PrivacySettings): Promise<PrivacySettings> =>
    apiService.updatePrivacySettings(data),
  exportUserData: (): Promise<ExportDataResponse> => apiService.exportUserData(),
  deleteAccount: (): Promise<DeleteAccountResponse> => apiService.deleteAccount(),
};
