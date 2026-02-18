import React from 'react';
import { Booking, BookingStatus } from '../types';
import { Calendar, Clock, Users, Utensils, Trash2 } from 'lucide-react';
import * as BookingService from '../services/bookingService';

interface Props {
  booking: Booking;
  onRefresh: () => void;
}

const BookingCard: React.FC<Props> = ({ booking, onRefresh }) => {
  const isCancelled = booking.status === BookingStatus.CANCELLED;

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await BookingService.cancelBooking(booking.bookingId);
      onRefresh();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-[#2a2725] rounded-xl p-5 mb-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-serif text-lg text-stone-800 dark:text-stone-200">{booking.customerName}</h4>
          <div className="flex items-center text-stone-500 dark:text-stone-500 text-xs mt-1 gap-2">
            <span className="flex items-center gap-1"><Users size={12} /> {booking.numberOfGuests} Guests</span>
            <span>•</span>
            <span>{booking.bookingId}</span> {/* Replaced email with bookingId as per original context */}
          </div>
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isCancelled
            ? 'bg-red-950/20 text-red-700 border-red-900/20'
            : 'bg-emerald-950/20 text-emerald-500 border-emerald-900/20'
          }`}>
          {booking.status}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-amber-600 dark:text-amber-500" />
          {formatDate(booking.bookingDate)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-amber-600 dark:text-amber-500" />
          {booking.bookingTime}
        </div>
      </div>

      {booking.cuisinePreference && (
        <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
          <Utensils className="w-4 h-4 text-amber-700 dark:text-amber-500" />
          <span className="capitalize">{booking.cuisinePreference}</span>
        </div>
      )}

      {booking.seatingPreference && (
        <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400 mt-2">
          <div className="w-4 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-stone-700 dark:bg-stone-500"></div></div>
          <span className="text-stone-500 dark:text-stone-500 capitalize">{booking.seatingPreference} Seating</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled && (
        <button
          onClick={handleCancel}
          className="mt-5 w-full flex items-center gap-2 text-xs font-medium text-red-900/60 hover:text-red-500 transition-colors pt-3 border-t border-dashed border-stone-800"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Cancel Booking
        </button>
      )}
    </div>
  );
};

export default BookingCard;