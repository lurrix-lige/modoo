import { apiService, DialoguesResponse, Dialogue } from '../ApiService';

export const dialogueApi = {
  getDialogues: (): Promise<DialoguesResponse> => apiService.getDialogues(),
  getDialogue: (dialogueId: string): Promise<Dialogue> => apiService.getDialogue(dialogueId),
  favoriteDialogue: (dialogueId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.favoriteDialogue(dialogueId),
  unfavoriteDialogue: (dialogueId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.unfavoriteDialogue(dialogueId),
  useDialogue: (dialogueId: string): Promise<{ success: boolean; useCount: number }> =>
    apiService.useDialogue(dialogueId),
  getFavoriteDialogues: (): Promise<DialoguesResponse> => apiService.getFavoriteDialogues(),
};
