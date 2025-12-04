import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import * as BookingService from './bookingService';
import { CreateBookingArgs, WeatherArgs } from '../types';

const createBookingTool: FunctionDeclaration = {
  name: 'createBooking',
  description: 'Create a restaurant table reservation. Call this ONLY after confirming all details with the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: 'Name of the customer' },
      numberOfGuests: { type: Type.NUMBER, description: 'Number of people' },
      bookingDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
      bookingTime: { type: Type.STRING, description: 'Time in HH:MM 24hr format' },
      cuisinePreference: { type: Type.STRING, description: 'Type of cuisine (Italian, Indian, Chinese, etc.)' },
      specialRequests: { type: Type.STRING, description: 'Any special occasions or dietary needs' },
      seatingPreference: { type: Type.STRING, description: 'Preferred seating: Indoor or Outdoor' }
    },
    required: ['customerName', 'numberOfGuests', 'bookingDate', 'bookingTime', 'cuisinePreference']
  }
};

const checkWeatherTool: FunctionDeclaration = {
  name: 'checkWeather',
  description: 'Check the weather forecast for a specific date to suggest seating.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'The date to check weather for (YYYY-MM-DD)' }
    },
    required: ['date']
  }
};

const cancelBookingTool: FunctionDeclaration = {
  name: 'cancelBooking',
  description: 'Cancel an existing reservation using the booking ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      bookingId: { type: Type.STRING, description: 'The unique ID of the booking to cancel (e.g., #BK-12345)' }
    },
    required: ['bookingId']
  }
};

export class GeminiLiveService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  public isConnected = false;
  private isMuted = false;

  private currentModelText = "";
  // New: Accumulate user text to prevent overwriting words in UI
  private currentUserText = "";

  public onConnectionStateChange: (connected: boolean) => void = () => { };
  public onVolumeLevel: (level: number) => void = () => { };
  public onNewBooking: () => void = () => { };
  public onMessageUpdate: (text: string, isUser: boolean, isFinal: boolean) => void = () => { };
  public onError: (error: string) => void = () => { };

  async connect() {
    if (this.isConnected) return;

    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey) throw new Error("API Key not found in environment variables");

      const ai = new GoogleGenAI({ apiKey });

      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
      if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: [createBookingTool, checkWeatherTool, cancelBookingTool] }],
          systemInstruction: `You are Bella, a sophisticated and polite booking assistant for "The Golden Table", a high-end fine dining restaurant.
          
          YOUR GOAL: Secure a table reservation by gathering information ONE PIECE at a time.

          CRITICAL CONVERSATION RULES:
          1.  **NEVER** ask for multiple details in a single sentence. Ask for ONE thing, then wait for the user to answer.
          2.  **NEVER** assume information. If the user hasn't said their name, you do not know it. Ask for it.
          3.  **MANDATORY START**: You must greet the user first.
          4.  **STRICT TOPIC BOUNDARY**: You are exclusively a restaurant booking assistant. DO NOT answer questions about general knowledge, math, history, coding, or anything unrelated to The Golden Table.
          5.  **REFUSAL PROTOCOL**: If asked an off-topic question, reply EXACTLY: "I apologize, but I am specialized only in assisting with reservations for The Golden Table. How may I help you with your booking?"
          6.  **LANGUAGE SUPPORT**: You are fluent in English and Hindi.
              - If the user speaks English, respond in English.
              - If the user speaks Hindi, respond in Hindi.
              - If the user mixes them (Hinglish), you may do the same naturally.
              - Do not switch to other languages.

          BOOKING STEPS (Strictly follow this order):
          1.  **Greeting**: "Welcome to The Golden Table. I'm Bella. May I have your name to start the booking?"
          2.  **Name**: Wait for the name. If not given, ask again politely.
          3.  **Guests**: "Thank you, [Name]. How many guests will be dining?"
          4.  **Date**: "Wonderful. For which date would you like to book?"
          5.  **Weather Check (Internal)**: Once you have the date, call the \`checkWeather\` tool immediately. Do not ask the user.
          6.  **Seating Suggestion**: Based on the weather tool result, suggest Indoor or Outdoor seating. "It looks sunny, would you prefer outdoor seating?"
          7.  **Time**: "What time would you prefer?"
          8.  **Cuisine**: "We offer Italian, Chinese, and Indian menus. Which do you prefer?"
          9.  **Special Requests**: "Any special requests or dietary restrictions?"
          10. **Confirmation**: "Let me confirm: Table for [Guests] on [Date] at [Time], [Cuisine] cuisine, [Seating]. Is that correct?"
          11. **Finalize**: If they say yes, call \`createBooking\`.

          Current Date: ${new Date().toDateString()}.
          `,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: this.handleOpen.bind(this, stream),
          onmessage: this.handleMessage.bind(this),
          onclose: () => {
            this.isConnected = false;
            this.onConnectionStateChange(false);
          },
          onerror: (e) => {
            console.error("Gemini Live Error:", e);
            this.onError("Connection error. Please try again.");
            this.disconnect();
          }
        }
      });
    } catch (e: any) {
      console.error("Connection Initialization Failed:", e);
      this.onError(e.message || "Failed to start audio session");
      this.disconnect();
    }
  }

  mute() {
    this.isMuted = true;
  }

  unmute() {
    this.isMuted = false;
  }

  private handleOpen(stream: MediaStream) {
    this.isConnected = true;
    this.isMuted = false;
    this.currentModelText = "";
    this.currentUserText = "";
    this.onConnectionStateChange(true);

    if (!this.inputAudioContext) return;

    this.sessionPromise?.then((session) => {
      try {
        session.sendRealtimeInput({
          content: {
            role: "user",
            parts: [{ text: "Hello Bella, I am ready to book." }]
          }
        });
      } catch (e) {
        console.error("Failed to send initial trigger:", e);
      }
    }).catch(e => {
      console.error("Session failed during open:", e);
    });

    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const analyzer = this.inputAudioContext.createAnalyser();
    analyzer.fftSize = 256;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const updateVolume = () => {
      if (!this.isConnected) return;

      let average = 0;
      if (!this.isMuted) {
        analyzer.getByteFrequencyData(dataArray);
        average = dataArray.reduce((a, b) => a + b) / bufferLength;
      }

      this.onVolumeLevel(average);
      requestAnimationFrame(updateVolume);
    };
    updateVolume();

    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      if (!this.isConnected || this.isMuted) return;

      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);

      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(e => {
      });
    };

    source.connect(analyzer);
    analyzer.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (message.toolCall?.functionCalls) {
      for (const fc of message.toolCall.functionCalls) {
        let result: any = { error: "Unknown function" };

        try {
          if (fc.name === 'createBooking') {
            const rawArgs = fc.args as any;
            const args: CreateBookingArgs = {
              ...rawArgs,
              numberOfGuests: Number(rawArgs.numberOfGuests),
            };

            const booking = await BookingService.createBooking(args);
            result = { status: 'success', bookingId: booking.bookingId, message: 'Booking created successfully.' };
            this.onNewBooking();
          }
          else if (fc.name === 'checkWeather') {
            const args = fc.args as WeatherArgs;
            const condition = await BookingService.getWeatherForecast(args.date);
            result = { condition };
          }
          else if (fc.name === 'cancelBooking') {
            const args = fc.args as any;
            const success = await BookingService.cancelBooking(args.bookingId);
            result = { success, message: success ? 'Booking cancelled.' : 'Booking ID not found.' };
            this.onNewBooking();
          }
        } catch (error: any) {
          console.error("Tool execution error:", error);
          result = { error: error.message || "Failed to execute tool" };
        }

        this.sessionPromise?.then(session => {
          session.sendToolResponse({
            functionResponses: {
              id: fc.id,
              name: fc.name,
              response: { result }
            }
          });
        });
      }
    }

    const parts = message.serverContent?.modelTurn?.parts;
    const base64Audio = parts?.[0]?.inlineData?.data;

    if (base64Audio && this.outputAudioContext) {
      try {
        const audioBuffer = await decodeAudioData(
          base64ToUint8Array(base64Audio),
          this.outputAudioContext,
          24000,
          1
        );

        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputAudioContext.destination);

        const now = this.outputAudioContext.currentTime;
        const startTime = Math.max(now, this.nextStartTime);

        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;

        this.sources.add(source);
        source.onended = () => this.sources.delete(source);
      } catch (e) {
        console.error("Audio Decode Error:", e);
      }
    }

    // User Transcription with Accumulation
    const userTranscript = message.serverContent?.inputTranscription?.text;
    if (userTranscript) {
      this.currentUserText += userTranscript;
      this.onMessageUpdate(this.currentUserText, true, false);
    }

    const modelChunk = message.serverContent?.outputTranscription?.text;
    if (modelChunk) {
      this.currentModelText += modelChunk;
      this.onMessageUpdate(this.currentModelText, false, false);
    }

    if (message.serverContent?.turnComplete) {
      this.currentModelText = "";
      this.currentUserText = ""; // Reset user accumulator for next turn
      this.onMessageUpdate("", false, true);
    }
  }

  disconnect() {
    if (!this.isConnected && !this.sessionPromise) return;

    this.sessionPromise = null;
    this.isConnected = false;
    this.isMuted = false;
    this.currentModelText = "";
    this.currentUserText = "";

    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.inputAudioContext = null;
    this.outputAudioContext = null;

    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.nextStartTime = 0;

    this.onConnectionStateChange(false);
  }
}

export const liveService = new GeminiLiveService();