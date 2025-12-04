import React, { useEffect, useState, useRef } from 'react';
import { liveService } from './services/geminiLive';
import * as BookingService from './services/bookingService';
import BookingCard from './components/BookingCard';
import Visualizer from './components/Visualizer';
import { Booking, BookingStatus, ChatMessage } from './types';
import { UtensilsCrossed, Mic, MicOff, RefreshCw, Calendar, ChefHat, X, PhoneOff, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    liveService.onMessageUpdate = (text, isUser, isFinal) => {
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

  // Filter based on status string (matches DB schema)
  const upcomingBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
  const pastBookings = bookings.filter(b => b.status !== BookingStatus.CONFIRMED);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0c0a09] text-stone-200">
      {/* Header */}
      <header className="h-20 border-b border-[#2a2725] bg-[#0c0a09] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-[#0c0a09] shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <UtensilsCrossed size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-serif text-amber-500 tracking-wide font-medium">The Golden Table</h1>
            <p className="text-[11px] text-stone-500 uppercase tracking-widest">Voice-Enabled Booking Assistant</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-stone-500 text-xs border border-stone-800 px-3 py-1.5 rounded-full">
          <ChefHat size={14} />
          <span>Fine Dining Experience</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Interaction */}
        <section className="flex-1 flex flex-col relative bg-[#0c0a09]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          {/* Chat Transcript Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
            {messages.length === 0 && !isConnected && !errorMsg && (
                <div className="flex flex-col items-center justify-center h-full text-stone-600 text-sm gap-2">
                    <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-2">
                        <Mic size={20} className="text-stone-700" />
                    </div>
                    <p>Tap the microphone to start your booking.</p>
                </div>
            )}
            
            {errorMsg && (
                <div className="flex items-center justify-center py-4 px-6 bg-red-900/20 border border-red-900/50 rounded-lg mx-8 mt-4 text-red-400 gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm">{errorMsg}</span>
                </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg ${
                    msg.role === 'assistant' 
                    ? 'bg-amber-500 text-stone-950' 
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {msg.role === 'assistant' ? <UtensilsCrossed size={16} /> : <div className="text-[10px] font-bold">YOU</div>}
                </div>
                <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-5 text-sm leading-7 shadow-sm ${
                  msg.role === 'assistant' 
                    ? 'bg-[#1c1917] border border-[#2a2725] text-stone-300' 
                    : 'bg-[#2a2725] text-stone-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Controls */}
          <div className="h-72 border-t border-[#2a2725] bg-[#0c0a09] flex flex-col items-center justify-center p-8 relative z-20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent"></div>
            
            <div className="mb-8 h-6 flex items-end">
                <Visualizer isActive={isConnected && !isMuted} volume={volume} />
            </div>

            <div className="flex items-center gap-6">
                <button
                onClick={handleMicToggle}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 group relative ${
                    isConnected 
                    ? (isMuted ? 'bg-stone-800 text-stone-500' : 'bg-amber-950/30 text-amber-500')
                    : 'bg-stone-900 text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                }`}
                >
                <div className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                    isConnected 
                    ? (isMuted ? 'border-stone-700 scale-100' : 'border-amber-500/50 scale-110')
                    : 'border-stone-800 scale-100'
                }`}></div>
                
                {isConnected && !isMuted && (
                    <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse"></div>
                )}
                
                {isConnected ? (
                    isMuted ? <MicOff size={28} /> : <Mic size={28} />
                ) : (
                    <Mic size={28} />
                )}
                </button>

                {isConnected && (
                    <button 
                        onClick={handleDisconnect}
                        className="w-12 h-12 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-500 hover:bg-red-900/40 transition-all absolute right-8 lg:static lg:ml-0"
                        title="End Session"
                    >
                        <PhoneOff size={20} />
                    </button>
                )}
            </div>
            
            <p className="mt-6 text-xs font-medium tracking-wide transition-colors">
              {!isConnected && !errorMsg && <span className="text-stone-500">Tap to start booking</span>}
              {errorMsg && <span className="text-red-500">System Offline</span>}
              {isConnected && !isMuted && <span className="text-amber-500 animate-pulse">Listening... Tap to mute</span>}
              {isConnected && isMuted && <span className="text-stone-500">Mic Off. Processing...</span>}
            </p>
          </div>
        </section>

        {/* Right Panel: Bookings */}
        <section className="w-full lg:w-[420px] bg-[#0f0d0c] flex flex-col border-l border-[#2a2725] overflow-hidden shadow-2xl z-30">
          <div className="p-6 border-b border-[#2a2725] flex justify-between items-center">
            <h2 className="text-xl font-serif text-amber-500/90 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              Bookings
            </h2>
            <button 
                onClick={fetchBookings} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-800 text-stone-500 hover:text-amber-500 transition-colors"
                title="Refresh Bookings"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0f0d0c]">
            <div className="mb-10">
              <h3 className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-6">
                Upcoming ({upcomingBookings.length})
              </h3>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#2a2725] rounded-xl bg-stone-900/20">
                    <p className="text-stone-600 text-xs">No upcoming reservations.</p>
                </div>
              ) : (
                upcomingBookings.map(b => (
                  <BookingCard key={b.bookingId} booking={b} onRefresh={fetchBookings} />
                ))
              )}
            </div>

            {pastBookings.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-stone-600 uppercase tracking-[0.2em] mb-6">
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
      
      <footer className="py-3 text-center text-[10px] text-stone-600 bg-[#0c0a09] border-t border-[#2a2725]">
        <p>Powered by AI • Built for Vaiu Software Developer Internship</p>
      </footer>
    </div>
  );
};

export default App;