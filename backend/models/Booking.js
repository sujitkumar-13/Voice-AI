const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  numberOfGuests: { type: Number, required: true },
  bookingDate: { type: String, required: true }, // ISO Date String YYYY-MM-DD
  bookingTime: { type: String, required: true },
  cuisinePreference: { type: String, required: true },
  specialRequests: { type: String },
  seatingPreference: { type: String },
  status: { type: String, default: 'Confirmed' }, // Confirmed, Cancelled
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);