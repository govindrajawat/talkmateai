'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect
} from 'react';

type AudioReceivedCallback = (
  base64Audio: string,
  timingData?: any,
  sampleRate?: number,
  method?: string
) => void;

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  sendAudioSegment: (audioData: ArrayBuffer, imageData?: string) => void;
  onAudioReceived: (callback: AudioReceivedCallback) => void;
  onInterrupt: (callback: () => void) => void;
  onError: (callback: (error: string) => void) => void;
  onStatusChange: (callback: (status: string) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    );
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Callback refs to avoid stale closures
  const audioReceivedCallbackRef = useRef<AudioReceivedCallback | null>(null);
  const interruptCallbackRef = useRef<(() => void) | null>(null);
  const errorCallbackRef = useRef<((error: string) => void) | null>(null);
  const statusCallbackRef = useRef<((status: string) => void) | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current || isConnecting) return;

    setIsConnecting(true);
    statusCallbackRef.current?.('connecting');

    // Use a relative URL for the WebSocket, which will be proxied by Next.js
    const wsUrl = `ws://${window.location.host}/ws/test-client`;
    console.log(`Connecting to WebSocket at: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
      statusCallbackRef.current?.('connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.audio) {
        audioReceivedCallbackRef.current?.(
          data.audio,
          data.word_timings,
          data.sample_rate,
          data.method
        );
      } else if (data.interrupt) {
        interruptCallbackRef.current?.();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      errorCallbackRef.current?.('Connection failed');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;
      statusCallbackRef.current?.('disconnected');
    };
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const sendAudioSegment = useCallback(
    (audioData: ArrayBuffer, imageData?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const audioBase64 = Buffer.from(audioData).toString('base64');
      const message: { audio_segment: string; image?: string } = {
        audio_segment: audioBase64
      };

      if (imageData) {
        message.image = imageData;
      }

      wsRef.current.send(JSON.stringify(message));
    },
    []
  );

  const value = {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendAudioSegment,
    onAudioReceived: (cb: AudioReceivedCallback) =>
      (audioReceivedCallbackRef.current = cb),
    onInterrupt: (cb: () => void) => (interruptCallbackRef.current = cb),
    onError: (cb: (error: string) => void) => (errorCallbackRef.current = cb),
    onStatusChange: (cb: (status: string) => void) =>
      (statusCallbackRef.current = cb)
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};