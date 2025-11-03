'use client';

import { useEffect, useRef, useCallback } from 'react';
import { SSEMessage, Message, User } from '../types';

interface UseRealtimeProps {
  user: User | null;
  onNewMessage: (message: Message) => void;
  onMessageRead: (messageId: number) => void;
  onUserOnline: (userId: number, isOnline: boolean) => void;
}

export function useRealtime({
  user,
  onNewMessage,
  onMessageRead,
  onUserOnline
}: UseRealtimeProps) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleNewMessage = useCallback((message: Message) => {
    onNewMessage(message);
  }, [onNewMessage]);

  const handleMessageRead = useCallback((messageId: number) => {
    onMessageRead(messageId);
  }, [onMessageRead]);

  const handleUserOnline = useCallback((userId: number, isOnline: boolean) => {
    onUserOnline(userId, isOnline);
  }, [onUserOnline]);

  // Инициализация SSE
  useEffect(() => {
    if (!user) return;

    const connectSSE = () => {
      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('SSE connection established');
              break;
            case 'new_message':
              if (data.message) {
                console.log('SSE received new message:', data.message);
                handleNewMessage(data.message);
              }
              break;
            case 'message_read':
              if (data.messageId) {
                handleMessageRead(data.messageId);
              }
              break;
            case 'user_online':
              if (data.userId) {
                handleUserOnline(data.userId, true);
              }
              break;
            case 'user_offline':
              if (data.userId) {
                handleUserOnline(data.userId, false);
              }
              break;
            case 'ping':
              // Игнорируем пинг сообщения
              break;
            default:
              console.log('Unknown SSE message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        
        // Переподключение через 3 секунды
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [user, handleNewMessage, handleMessageRead, handleUserOnline]);

  return {
    eventSourceRef
  };
}
