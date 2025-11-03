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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Очищаем таймаут переподключения перед новым подключением
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Закрываем предыдущее соединение если оно существует
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Добавляем timestamp чтобы избежать кеширования соединения бразуером или CDN
      const url = `/api/realtime?ts=${Date.now()}`;
      const eventSource = new EventSource(url, { withCredentials: true });
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

                const rawMessage = data.message as unknown as Record<string, unknown>;
                const rawChatId = rawMessage.chatId ?? rawMessage.chat_id;
                const rawSenderId = rawMessage.senderId ?? rawMessage.sender_id;
                const normalizedMessage: Message = {
                  ...data.message,
                  chatId: rawChatId !== undefined && rawChatId !== null
                    ? Number(rawChatId)
                    : undefined,
                  senderId: rawSenderId !== undefined && rawSenderId !== null
                    ? Number(rawSenderId)
                    : Number(data.message.senderId),
                  messageType: data.message.messageType
                    || (data.message.imageData ? 'image' : 'text'),
                  createdAt: data.message.createdAt || new Date().toISOString(),
                  isRead: Boolean(data.message.isRead)
                };

                handleNewMessage(normalizedMessage);
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
        reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [user, handleNewMessage, handleMessageRead, handleUserOnline]);

  return {
    eventSourceRef
  };
}
