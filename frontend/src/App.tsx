import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { liveService } from './services/geminiLive';
import * as BookingService from './services/bookingService';
import BookingCard from './components/BookingCard';
import Visualizer from './components/Visualizer';
import { Booking, BookingStatus, ChatMessage } from './types';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { UtensilsCrossed, Mic, MicOff, RefreshCw, Calendar, PhoneOff, AlertCircle, LogOut, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'bookings'>('chat');

  const fetchBookings = async () => {
    try {
      const data = await BookingService.getBookings();
      setBookings(data);
    } catch (e) {
      console.error("Failed to load bookings", e);
    }
  };

  useEffect(() => {
    fetchBookings();

    setMessages([]);

    liveService.onConnectionStateChange = (connected) => {
      setIsConnected(connected);
      if (connected) {
        setIsMuted(false);
        setErrorMsg(null);
      }
    };
    liveService.onVolumeLevel = (vol) => setVolume(vol);
    liveService.onNewBooking = fetchBookings;
    liveService.onError = (msg) => {
      setErrorMsg(msg);
      setIsConnected(false);
    };

    liveService.onMessageUpdate = (text, isUser) => {
      if (!text) return;

      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        const newRole = isUser ? 'user' : 'assistant';

        if (lastMsg && lastMsg.role === newRole) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMsg,
            text: text
          };
          return updated;
        }

        const newMsg: ChatMessage = {
          id: Date.now().toString(),
          role: newRole,
          text: text,
          timestamp: new Date()
        };
        return [...prev, newMsg];
      });
    };

    return () => {
      liveService.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMicToggle = async () => {
    setErrorMsg(null);
    if (!isConnected) {
      try {
        await liveService.connect();
        setIsMuted(false);
      } catch (e) {
        console.error("Connection failed UI", e);
      }
    } else {
      if (isMuted) {
        liveService.unmute();
        setIsMuted(false);
      } else {
        liveService.mute();
        setIsMuted(true);
      }
    }
  };

  const handleDisconnect = () => {
    liveService.disconnect();
    setIsConnected(false);
    setIsMuted(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleMobileNav = (view: 'chat' | 'bookings') => {
    setMobileView(view);
    setIsMobileMenuOpen(false);
  };

  // Filter based on status string (matches DB schema)
  const upcomingBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
  const pastBookings = bookings.filter(b => b.status !== BookingStatus.CONFIRMED);

  return (
    <div className="h-screen flex flex-col font-sans bg-stone-50 dark:bg-[#0c0a09] text-stone-800 dark:text-stone-200 overflow-hidden transition-colors duration-300">
      {/* Header */}
      {/* Header */}
      <header className="h-20 border-b border-stone-200 dark:border-[#2a2725] bg-white dark:bg-[#0c0a09] flex items-center justify-between px-4 md:px-8 fixed top-0 w-full left-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-[#0c0a09] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <UtensilsCrossed size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-serif text-amber-600 dark:text-amber-500 tracking-wide font-medium">The Golden Table</h1>
            <p className="text-[10px] md:text-[11px] text-stone-500 uppercase tracking-widest hidden sm:block">Voice-Enabled Booking Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <ThemeToggle />

            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs bg-stone-100 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 px-4 py-2 rounded-full">
              <div className={`w-2 h-2 rounded-full bg-green-500 ${isConnected ? 'animate-pulse' : ''}`}></div>
              <span>Welcome, {user?.name}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-stone-500 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors group"
              title="Sign Out"
            >
              <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-950/20 transition-colors">
                <LogOut size={16} />
              </div>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Hamburger (Right Side) */}
          <div className="md:hidden">
            <button onClick={toggleMobileMenu} className="p-2 text-stone-600 dark:text-stone-400">
              <div className="space-y-1.5">
                <span className={`block w-6 h-0.5 bg-current transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-current transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-stone-50 dark:bg-[#0c0a09] pt-24 px-6 md:hidden flex flex-col gap-6">
          <button
            onClick={() => handleMobileNav('chat')}
            className={`flex items-center gap-4 text-lg font-serif p-4 rounded-xl border transition-colors ${mobileView === 'chat' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500' : 'border-stone-200 dark:border-[#2a2725] text-stone-600 dark:text-stone-400'}`}
          >
            <Mic size={24} />
            <span>Voice Assistant</span>
          </button>

          <button
            onClick={() => handleMobileNav('bookings')}
            className={`flex items-center gap-4 text-lg font-serif p-4 rounded-xl border transition-colors ${mobileView === 'bookings' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-500' : 'border-stone-200 dark:border-[#2a2725] text-stone-600 dark:text-stone-400'}`}
          >
            <Calendar size={24} />
            <span>My Bookings</span>
          </button>

          <div className="border-t border-stone-200 dark:border-[#2a2725] pt-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 dark:text-stone-400">Theme</span>
              <ThemeToggle />
            </div>

            <button onClick={logout} className="flex items-center gap-4 text-red-500 dark:text-red-400">
              <LogOut size={24} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pt-20">

        {/* Left Panel: Interaction (Chat) */}
        <section className={`flex-1 flex flex-col relative bg-stone-50 dark:bg-[#0c0a09] transition-colors duration-300 ${mobileView === 'bookings' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-200/50 dark:from-stone-900/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>

          {/* Chat Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10">
            {messages.length === 0 && !isConnected && !errorMsg && (
              <div className="flex flex-col items-center justify-center h-full text-stone-500 dark:text-stone-600 text-sm gap-2">
                <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-900 flex items-center justify-center mb-2">
                  <Mic size={20} className="text-stone-600 dark:text-stone-700" />
                </div>
                <p>Tap the microphone to start your booking.</p>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center justify-center py-4 px-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg mx-8 mt-4 text-red-600 dark:text-red-400 gap-2">
                <AlertCircle size={18} />
                <span className="text-sm">{errorMsg}</span>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 md:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'assistant'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}>
                  {msg.role === 'assistant' ? <UtensilsCrossed size={16} /> : <div className="text-[10px] font-bold">YOU</div>}
                </div>
                <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 md:p-5 text-sm leading-6 md:leading-7 shadow-sm ${msg.role === 'assistant'
                  ? 'bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-[#2a2725] text-stone-700 dark:text-stone-300'
                  : 'bg-stone-200 dark:bg-[#2a2725] text-stone-800 dark:text-stone-200'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Controls */}
          <div className="h-60 md:h-72 border-t border-stone-200 dark:border-[#2a2725] bg-white dark:bg-[#0c0a09] flex flex-col items-center justify-center p-4 md:p-8 relative z-20 transition-colors duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent"></div>

            <div className="mb-6 md:mb-8 h-6 flex items-end">
              <Visualizer isActive={isConnected && !isMuted} volume={volume} />
            </div>

            <div className="flex items-center gap-4 md:gap-6 justify-center">
              <button
                onClick={handleMicToggle}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 group relative ${isConnected
                  ? (isMuted ? 'bg-stone-200 dark:bg-stone-800 text-stone-500' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500')
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
              >
                <div className={`absolute inset-0 rounded-full border transition-all duration-500 ${isConnected
                  ? (isMuted ? 'border-stone-300 dark:border-stone-700 scale-100' : 'border-amber-400 dark:border-amber-500/50 scale-110')
                  : 'border-stone-200 dark:border-stone-800 scale-100'
                  }`}></div>

                {isConnected && !isMuted && (
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse"></div>
                )}

                {isConnected ? (
                  isMuted ? <MicOff size={24} className="md:w-7 md:h-7" /> : <Mic size={24} className="md:w-7 md:h-7" />
                ) : (
                  <Mic size={24} className="md:w-7 md:h-7" />
                )}
              </button>

              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all"
                  title="End Session"
                >
                  <PhoneOff size={18} className="md:w-5 md:h-5" />
                </button>
              )}
            </div>

            <p className="mt-4 md:mt-6 text-xs font-medium tracking-wide transition-colors">
              {!isConnected && !errorMsg && <span className="text-stone-500">Tap to start booking</span>}
              {errorMsg && <span className="text-red-500">System Offline</span>}
              {isConnected && !isMuted && <span className="text-amber-600 dark:text-amber-500 animate-pulse">Listening... Tap to mute</span>}
              {isConnected && isMuted && <span className="text-stone-500">Mic Off. Processing...</span>}
            </p>
          </div>
        </section>

        {/* Right Panel: Bookings */}
        <section className={`w-full lg:w-[420px] bg-stone-100 dark:bg-[#0f0d0c] flex-col border-l border-stone-200 dark:border-[#2a2725] overflow-hidden shadow-2xl z-30 transition-colors duration-300 ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 md:p-6 border-b border-stone-200 dark:border-[#2a2725] flex justify-between items-center bg-stone-100 dark:bg-[#0f0d0c]">
            <h2 className="text-lg md:text-xl font-serif text-amber-700 dark:text-amber-500/90 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              Your Bookings
            </h2>
            <button
              onClick={fetchBookings}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
              title="Refresh Bookings"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-stone-50 dark:bg-[#0f0d0c]">
            <div className="mb-10">
              <h3 className="text-[10px] font-bold text-stone-500 dark:text-stone-600 uppercase tracking-[0.2em] mb-6">
                Upcoming ({upcomingBookings.length})
              </h3>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-300 dark:border-[#2a2725] rounded-xl bg-stone-200/50 dark:bg-stone-900/20">
                  <p className="text-stone-500 dark:text-stone-600 text-xs">No upcoming reservations.</p>
                </div>
              ) : (
                upcomingBookings.map(b => (
                  <BookingCard key={b.bookingId} booking={b} onRefresh={fetchBookings} />
                ))
              )}
            </div>

            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-stone-500 dark:text-stone-600 uppercase tracking-[0.2em] mb-6">
                  Past & Cancelled ({pastBookings.length})
                </h3>
                <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity duration-300">
                  {pastBookings.map(b => (
                    <BookingCard key={b.bookingId} booking={b} onRefresh={fetchBookings} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      <footer className="py-3 text-center text-[10px] text-stone-500 dark:text-stone-600 bg-white dark:bg-[#0c0a09] border-t border-stone-200 dark:border-[#2a2725] transition-colors duration-300">
        <p>Powered by AI</p>
      </footer>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] flex items-center justify-center">
        <Loader2 className="text-amber-500 animate-spin" size={40} />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </Router>
  );
};

export default App;