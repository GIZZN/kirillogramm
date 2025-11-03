'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, Chat, User } from '../types';

export function useMessages(user: User | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async (chatId: number) => {
    if (!user) return;

    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        // Заменяем все сообщения новыми данными из API
        setMessages(data.messages || []);
        
        // Отмечаем сообщения как прочитанные
        const unreadMessages = data.messages.filter((msg: Message) => 
          msg.senderId !== user.id && !msg.isRead
        );
        
        if (unreadMessages.length > 0) {
          await fetch(`/api/chats/${chatId}/read`, {
            method: 'POST',
            credentials: 'include'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Проверяем, нет ли уже сообщения с таким ID
      const exists = prev.find(msg => msg.id === message.id);
      if (exists) {
        return prev; // Не добавляем дубликат
      }
      return [...prev, message];
    });
  }, []);

  const sendMessage = useCallback(async (selectedChat: Chat | null) => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    const messageData = {
      chatId: selectedChat.id,
      content: newMessage.trim()
    };

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Добавляем сообщение локально для отправителя
        const localMessage: Message = {
          id: data.data.id,
          chatId: selectedChat.id,
          senderId: user.id,
          senderName: user.name,
          content: newMessage.trim(),
          messageType: 'text',
          createdAt: new Date().toISOString(),
          isRead: false
        };

        addMessage(localMessage);
        setNewMessage('');
        scrollToBottom();
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, user, scrollToBottom, addMessage]);

  const sendImage = useCallback(async (file: File, selectedChat: Chat | null) => {
    if (!selectedChat || !user) return;

    const formData = new FormData();
    formData.append('chatId', selectedChat.id.toString());
    formData.append('image', file);

    try {
      const response = await fetch('/api/messages/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Добавляем сообщение с изображением локально для отправителя
        const localMessage: Message = {
          id: data.data.id,
          chatId: selectedChat.id,
          senderId: user.id,
          senderName: user.name,
          content: data.data.content,
          messageType: 'image',
          imageData: data.data.imageData,
          createdAt: new Date().toISOString(),
          isRead: false
        };

        addMessage(localMessage);
        scrollToBottom();
      } else {
        const errorData = await response.json();
        console.error('Error uploading image:', errorData.error);
        alert(`Ошибка загрузки изображения: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка загрузки изображения');
    }
  }, [user, scrollToBottom, addMessage]);

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверяем размер файла (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      // sendImage будет вызван из основного компонента
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  const markMessageAsRead = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isRead: true }
        : msg
    ));
  }, []);

  return {
    messages,
    setMessages,
    newMessage,
    setNewMessage,
    loadingMessages,
    messagesEndRef,
    fileInputRef,
    fetchMessages,
    scrollToBottom,
    sendMessage,
    sendImage,
    handleImageSelect,
    addMessage,
    markMessageAsRead
  };
}
