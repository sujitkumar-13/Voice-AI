require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Booking = require('./models/Booking');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (Using ENV)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected to Atlas'))
.catch(err => console.error('MongoDB Connection Error:', err));

// GET all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a booking
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingId = `#BK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newBooking = new Booking({
      bookingId,
      ...req.body,
      status: 'Confirmed',
      createdAt: new Date()
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE (Cancel) a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findOne({ bookingId: bookingId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
