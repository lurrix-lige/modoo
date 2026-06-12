import { apiService, ExpertsResponse, Expert, ExpertTimeSlots, Booking, CreateBookingRequest } from '../ApiService';

export const expertApi = {
  getExperts: (): Promise<ExpertsResponse> => apiService.getExperts(),
  getExpert: (expertId: string): Promise<Expert> => apiService.getExpert(expertId),
  getExpertTimeSlots: (expertId: string, date: string): Promise<ExpertTimeSlots> =>
    apiService.getExpertTimeSlots(expertId, date),
  createBooking: (data: CreateBookingRequest): Promise<Booking> => apiService.createBooking(data),
  getMyBookings: (): Promise<Booking[]> => apiService.getMyBookings(),
  getBookings: (): Promise<{ bookings: Booking[] }> => apiService.getBookings(),
  cancelBooking: (bookingId: string): Promise<{ success: boolean }> =>
    apiService.cancelBooking(bookingId),
  updateBooking: (bookingId: string, status: string): Promise<Booking> =>
    apiService.updateBooking(bookingId, status),
};
