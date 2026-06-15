import { apiService } from '../ApiService';
import type { ExpertsResponse, Expert, ExpertTimeSlots, Booking, CreateBookingRequest } from '../types';

const cleanId = (id: string) => id.replace(/^\/|\/$/g, '');

export const expertApi = {
  getExperts: () => apiService.get<ExpertsResponse>('/experts'),
  getExpert: (expertId: string) => apiService.get<Expert>(`/experts/${expertId}`),
  getExpertTimeSlots: (expertId: string, date: string) =>
    apiService.get<ExpertTimeSlots>(`/experts/${expertId}/time-slots?date=${date}`),
  createBooking: (data: CreateBookingRequest) => apiService.post<Booking>('/experts/bookings', data),
  getMyBookings: () => apiService.get<Booking[]>('/experts/bookings/my'),
  getBookings: async () => {
    const bookings = await apiService.get<Booking[]>('/experts/bookings/my');
    return { bookings };
  },
  cancelBooking: (bookingId: string) =>
    apiService.post<{ success: boolean }>(`/experts/bookings/${cleanId(bookingId)}/cancel`, {}),
  updateBooking: (bookingId: string, status: string) =>
    apiService.put<Booking>(`/experts/bookings/${bookingId}`, { status }),
};
