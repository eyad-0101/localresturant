'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { chatService } from '../lib/api';
import useAuthStore from '../lib/authStore';

/**
 * Client-only component that creates the Socket.io connection and attaches it
 * to `chatService.socket`. It must be rendered once near the root of the app
 * (done in RootLayout). The effect never runs during server rendering, so the
 * socket.io-client bundle is only ever evaluated on the client.
 */
export default function ChatSocket() {
  const { token } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
    const socket = io(API_URL.replace(/\/api$/, ''), {
      autoConnect: false,
      transports: ['websocket'],
    });
    chatService.socket = socket;
    if (token) {
      socket.auth = { token };
      socket.connect();
    }
    return () => {
      socket.disconnect();
      chatService.socket = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = chatService.socket;
    if (!socket) return;
    if (token) {
      socket.auth = { token };
      if (!socket.connected) socket.connect();
    } else {
      socket.disconnect();
    }
  }, [token]);

  return null;
}
