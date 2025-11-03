'use client';

import { useState, useCallback } from 'react';
import { Chat, User } from '../types';

export function useChats(user: User | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async (selectedChat?: Chat | null, fetchMessages?: (chatId: number) => void): Promise<Chat | void> => {
    if (!user) return;

    try {
      const response = await fetch('/api/chats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Сортируем чаты по времени последнего сообщения
        const sortedChats = data.chats.sort((a: Chat, b: Chat) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        setChats(sortedChats);
        
        // Если нет выбранного чата, автоматически выбираем первый
        if (!selectedChat && sortedChats.length > 0 && !loading && fetchMessages) {
          console.log('Auto-selecting first chat:', sortedChats[0]);
          // Возвращаем первый чат для автовыбора
          return sortedChats[0];
        }
        
        return;
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  const updateChatLastMessage = useCallback((chatId: number, message: string, timestamp: string) => {
    setChats((prev: Chat[]) => prev.map((chat: Chat) => 
      chat.id === chatId 
        ? { ...chat, lastMessage: message, lastMessageTime: timestamp }
        : chat
    ));
  }, []);

  const updateChatUnreadCount = useCallback((chatId: number, count: number) => {
    setChats((prev: Chat[]) => prev.map((chat: Chat) => 
      chat.id === chatId 
        ? { ...chat, unreadCount: count }
        : chat
    ));
  }, []);

  const updateUserOnlineStatus = useCallback((userId: number, isOnline: boolean) => {
    setChats((prev: Chat[]) => prev.map((chat: Chat) => 
      chat.userId === userId 
        ? { ...chat, isOnline }
        : chat
    ));
  }, []);

  const sortChatsByTime = useCallback(() => {
    setChats((prev: Chat[]) => [...prev].sort((a: Chat, b: Chat) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    ));
  }, []);

  return {
    chats,
    setChats,
    loading,
    fetchChats,
    updateChatLastMessage,
    updateChatUnreadCount,
    updateUserOnlineStatus,
    sortChatsByTime
  };
}
