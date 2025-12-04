export enum BookingStatus {
  CONFIRMED = 'Confirmed',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled',
}

export interface WeatherInfo {
  condition: string;
  temperature: number;
  suggestion: string;
}

export interface Booking {
  bookingId: string;
  customerName: string;
  numberOfGuests: number;
  bookingDate: string; // ISO Date string
  bookingTime: string;
  cuisinePreference: string;
  specialRequests?: string;
  seatingPreference?: string; // Indoor/Outdoor
  status: BookingStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export type CreateBookingArgs = {
  customerName: string;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  cuisinePreference: string;
  specialRequests?: string;
  seatingPreference?: string;
};

export type WeatherArgs = {
  date: string;
};