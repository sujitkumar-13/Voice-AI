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
    <div className={`p-5 rounded-lg border mb-4 transition-all ${
      isCancelled 
        ? 'bg-stone-900/40 border-stone-800 opacity-60' 
        : 'bg-[#1a1716] border-[#2a2725] hover:border-amber-900/30'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-serif text-[#e5e5e5] tracking-wide">{booking.customerName}</h3>
          <p className="text-[10px] text-stone-500 font-mono mt-1">{booking.bookingId}</p>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
          isCancelled 
            ? 'bg-red-950/20 text-red-700 border-red-900/20' 
            : 'bg-emerald-950/20 text-emerald-500 border-emerald-900/20'
        }`}>
          {booking.status}
        </span>
      </div>

      <div className="space-y-2.5 text-sm text-stone-400 mt-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-amber-700" />
          <span>{formatDate(booking.bookingDate)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>{booking.bookingTime}</span>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-amber-700" />
          <span>{booking.numberOfGuests} Guests</span>
        </div>
        <div className="flex items-center gap-3">
          <Utensils className="w-4 h-4 text-amber-700" />
          <span className="capitalize">{booking.cuisinePreference}</span>
        </div>
        {booking.seatingPreference && (
            <div className="flex items-center gap-3">
                <div className="w-4 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div></div>
                <span className="text-stone-500 capitalize">{booking.seatingPreference} Seating</span>
            </div>
        )}
      </div>

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