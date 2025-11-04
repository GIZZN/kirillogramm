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

  const toRecord = useCallback((value: unknown): Record<string, unknown> => {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }, []);

  const normalizeMessage = useCallback((rawMessage: unknown): Message => {
    const messageRecord = toRecord(rawMessage) as Record<string, unknown> & Partial<Message>;

    const getNumber = (value: unknown): number | undefined => {
      if (value === undefined || value === null) return undefined;
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    };

    const chatId = getNumber(messageRecord.chatId ?? messageRecord['chat_id']);
    const senderId = getNumber(messageRecord.senderId ?? messageRecord['sender_id']);
    const messageId = getNumber(messageRecord.id ?? messageRecord['id']) ?? Date.now();

    const messageType = (messageRecord.messageType ?? messageRecord['message_type']) as Message['messageType'] | undefined;
    const imageData = (messageRecord.imageData ?? messageRecord['image_data']) as string | undefined;

    return {
      id: messageId,
      chatId,
      senderId: senderId ?? 0,
      senderName: (messageRecord.senderName ?? messageRecord['sender_name'] ?? '') as string,
      senderAvatar: (messageRecord.senderAvatar ?? messageRecord['sender_avatar']) as string | undefined,
      content: (messageRecord.content ?? '') as string,
      createdAt: (messageRecord.createdAt ?? messageRecord['created_at'] ?? new Date().toISOString()) as string,
      messageType: messageType ?? (imageData ? 'image' : 'text'),
      imageData,
      isRead: Boolean(messageRecord.isRead ?? messageRecord['is_read'])
    };
  }, [toRecord]);

  const normalizeId = useCallback((value?: number | string | null) => {
    if (value === undefined || value === null) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }, []);

  const handleNewMessage = useCallback((message: unknown) => {
    const normalized = normalizeMessage(message);
    onNewMessage(normalized);
  }, [onNewMessage, normalizeMessage]);

  const handleMessageRead = useCallback((messageId: number | string | null | undefined) => {
    const normalizedId = normalizeId(messageId);
    if (normalizedId !== undefined) {
      onMessageRead(normalizedId);
    }
  }, [onMessageRead, normalizeId]);

  const handleUserOnline = useCallback((userId: number | string | null | undefined, isOnline: boolean) => {
    const normalizedId = normalizeId(userId);
    if (normalizedId !== undefined) {
      onUserOnline(normalizedId, isOnline);
    }
  }, [onUserOnline, normalizeId]);

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
          const dataRecord = toRecord(data);
          
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
              handleMessageRead(data.messageId ?? (dataRecord['message_id'] as number | string | null | undefined));
              break;
            case 'user_online':
              handleUserOnline(data.userId ?? (dataRecord['user_id'] as number | string | null | undefined), true);
              break;
            case 'user_offline':
              handleUserOnline(data.userId ?? (dataRecord['user_id'] as number | string | null | undefined), false);
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
  }, [user, handleNewMessage, handleMessageRead, handleUserOnline, toRecord]);

  return {
    eventSourceRef
  };
}
