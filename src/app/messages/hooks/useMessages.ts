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
        try {
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
        } catch (parseError) {
          console.error('Error parsing messages:', parseError);
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
        try {
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
        } catch (parseError) {
          console.error('Error parsing send message response:', parseError);
        }
      } else {
        try {
          const errorData = await response.json();
          console.error('Error sending message:', errorData.error);
        } catch {
          console.error('Error sending message: Server error');
        }
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

      try {
        const data = await response.json();
        
        if (response.ok) {
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
          console.error('Error uploading image:', data.error);
          alert(`Ошибка загрузки изображения: ${data.error || 'Неизвестная ошибка'}`);
        }
      } catch (parseError) {
        console.error('Failed to parse upload image response:', parseError);
        alert('Ошибка сервера при загрузке изображения');
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
