import { Booking, CreateBookingArgs, BookingStatus } from '../types';

const API_URL = 'https://voiceai-api.vercel.app/api';
const STORAGE_KEY = 'golden_table_bookings';

const RESTAURANT_CITY = 'India';

const getLocalBookings = (): Booking[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalBookings = (bookings: Booking[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable (getBookings), using local storage fallback.");
    return getLocalBookings();
  }
};

export const createBooking = async (args: CreateBookingArgs): Promise<Booking> => {
  const fallbackBooking: Booking = {
    bookingId: `#BK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    ...args,
    status: BookingStatus.CONFIRMED,
    createdAt: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) throw new Error('Failed to create booking');
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable (createBooking), saving to local storage fallback.");
    const bookings = getLocalBookings();
    bookings.unshift(fallbackBooking);
    saveLocalBookings(bookings);
    return fallbackBooking;
  }
};

export const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const encodedId = encodeURIComponent(bookingId);
    const response = await fetch(`${API_URL}/bookings/${encodedId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel booking');
    return true;
  } catch (error) {
    console.warn("Backend unavailable (cancelBooking), updating local storage fallback.");
    const bookings = getLocalBookings();
    const index = bookings.findIndex(b => b.bookingId === bookingId);
    
    if (index !== -1) {
      bookings[index].status = BookingStatus.CANCELLED;
      saveLocalBookings(bookings);
      return true;
    }
    return false;
  }
};

const getSimulatedWeather = (dateStr: string): string => {
  const dateHash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (dateHash % 100) / 100;
  if (random > 0.7) return "rainy";
  else if (random > 0.4) return "cloudy";
  else return "sunny";
};

export const getWeatherForecast = async (dateStr: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    console.warn("OpenWeather API Key missing. Using simulated weather.");
    return getSimulatedWeather(dateStr);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${RESTAURANT_CITY}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API failed");
    
    const data = await response.json();
    const targetDate = new Date(dateStr).toISOString().split('T')[0];
    const forecast = data.list.find((item: any) => item.dt_txt.startsWith(targetDate));

    if (forecast) {
      const condition = forecast.weather[0].main.toLowerCase();
      if (condition.includes('rain') || condition.includes('drizzle')) return 'rainy';
      if (condition.includes('clear')) return 'sunny';
      if (condition.includes('cloud')) return 'cloudy';
      return condition;
    } else {
      console.log("Date too far in future for free API, using simulation");
      return getSimulatedWeather(dateStr);
    }
  } catch (e) {
    console.error("Error fetching weather:", e);
    return getSimulatedWeather(dateStr);
  }
};