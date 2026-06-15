import { apiService } from '../ApiService';
import type { DialoguesResponse, Dialogue } from '../types';

const cleanId = (id: string) => id.replace(/^\/|\/$/g, '');

export const dialogueApi = {
  getDialogues: () => apiService.get<DialoguesResponse>('/dialogues'),
  getDialogue: (dialogueId: string) => apiService.get<Dialogue>(`/dialogues/${cleanId(dialogueId)}`),
  favoriteDialogue: (dialogueId: string) =>
    apiService.post<{ success: boolean; isFavorite: boolean }>(
      `/dialogues/${cleanId(dialogueId)}/favorite`,
      {},
    ),
  unfavoriteDialogue: (dialogueId: string) =>
    apiService.delete<{ success: boolean; isFavorite: boolean }>(
      `/dialogues/${cleanId(dialogueId)}/favorite`,
    ),
  useDialogue: (dialogueId: string) =>
    apiService.post<{ success: boolean; useCount: number }>(
      `/dialogues/${cleanId(dialogueId)}/use`,
      {},
    ),
  getFavoriteDialogues: () => apiService.get<DialoguesResponse>('/dialogues/favorites', true),
};
