'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import styles from './page.module.css';

// Types
import { Chat, Message } from './types';

// Hooks
import { useChats, useMessages, useRealtime } from './hooks';

// Components
import { ChatSidebar, ChatArea } from './components';

export default function MessagesPage() {
  const { user } = useAuth();
  
  // Local state
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Custom hooks
  const {
    chats,
    setChats,
    loading,
    fetchChats,
    updateChatLastMessage,
    updateUserOnlineStatus,
    sortChatsByTime
  } = useChats(user);

  const {
    messages,
    newMessage,
    setNewMessage,
    loadingMessages,
    messagesEndRef,
    fileInputRef,
    fetchMessages,
    scrollToBottom,
    sendMessage,
    sendImage,
    addMessage,
    markMessageAsRead
  } = useMessages(user);

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Загрузка чатов
  useEffect(() => {
    const loadChats = async () => {
      try {
        const result = await fetchChats(selectedChat, fetchMessages);
        if (result && !selectedChat) {
          setSelectedChat(result);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    
    loadChats();
  }, [fetchChats, selectedChat, fetchMessages]);

  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, fetchMessages]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Handler functions
  const handleNewMessage = (message: Message) => {
    console.log('New message received:', message);
    
    // Обновляем список чатов
    setChats(prev => {
      // Ищем существующий чат
      let chatExists = false;
      let targetChat: Chat | null = null;
      
      const updatedChats = prev.map(chat => {
        if (chat.id === message.chatId) {
          chatExists = true;
          targetChat = chat;
          return {
            ...chat,
            lastMessage: message.messageType === 'image' ? '📷 Изображение' : message.content,
            lastMessageTime: message.createdAt,
            unreadCount: selectedChat?.id === chat.id ? 0 : chat.unreadCount + 1
          };
        }
        return chat;
      });
      
      // Если чат не существует (новый чат), перезагружаем список чатов
      if (!chatExists) {
        console.log('Chat not found in list, refetching chats...');
        // Задержка чтобы сервер успел создать чат
        setTimeout(() => {
          fetchChats().then(() => {
            // После загрузки чатов открываем чат с новым сообщением
            const newChat = { 
              id: message.chatId!, 
              name: message.senderName || 'Unknown',
              lastMessage: message.messageType === 'image' ? '📷 Изображение' : message.content,
              lastMessageTime: message.createdAt,
              unreadCount: 1,
              isOnline: false,
              userId: message.senderId
            };
            setSelectedChat(newChat);
            fetchMessages(message.chatId!);
          });
        }, 500);
        return prev; // Возвращаем текущий список пока не обновится
      }
      
      // Автоматически открываем чат если:
      // 1. Нет выбранного чата ИЛИ
      // 2. Пришло сообщение в другой чат (переключаемся на новый)
      if (!selectedChat || (selectedChat.id !== message.chatId && targetChat)) {
        console.log('Auto-opening chat:', message.chatId);
        
        if (targetChat) {
          setSelectedChat({
            ...targetChat as Chat,
            lastMessage: message.messageType === 'image' ? '📷 Изображение' : message.content,
            lastMessageTime: message.createdAt,
            unreadCount: 0 // Сбрасываем при открытии
          });
          
          // Загружаем сообщения для этого чата
          fetchMessages(message.chatId!);
        }
      } else if (selectedChat && message.chatId === selectedChat.id) {
        // Если чат уже открыт - просто добавляем сообщение
        addMessage(message);
        setTimeout(scrollToBottom, 100);
      }
      
      // Сортируем чаты по времени последнего сообщения
      return updatedChats.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
    });
  };

  const handleMessageRead = (messageId: number) => {
    markMessageAsRead(messageId);
  };

  const handleUserOnline = (userId: number, isOnline: boolean) => {
    updateUserOnlineStatus(userId, isOnline);
  };

  const handleSendMessage = async () => {
    await sendMessage(selectedChat);
    // Обновляем список чатов для отправителя
    if (selectedChat) {
      updateChatLastMessage(
        selectedChat.id, 
        newMessage.trim(), 
        new Date().toISOString()
      );
      sortChatsByTime();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      sendImage(file, selectedChat);
      // Обновляем список чатов для отправителя
      if (selectedChat) {
        updateChatLastMessage(
          selectedChat.id, 
          '📷 Изображение', 
          new Date().toISOString()
        );
        sortChatsByTime();
      }
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    if (event.target) {
      event.target.value = '';
    }
  };

  // Real-time connection
  useRealtime({
    user,
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
    onUserOnline: handleUserOnline
  });

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className={styles.messagesPage}>
        {/* Sidebar с чатами */}
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          searchQuery={searchQuery}
          loading={loading}
          isMobile={isMobile}
          onChatSelect={setSelectedChat}
          onSearchChange={setSearchQuery}
        />

        {/* Основная область чата */}
        <ChatArea
          selectedChat={selectedChat}
          messages={messages}
          newMessage={newMessage}
          user={user}
          isMobile={isMobile}
          loadingMessages={loadingMessages}
          messagesEndRef={messagesEndRef}
          fileInputRef={fileInputRef}
          onChatDeselect={() => setSelectedChat(null)}
          onMessageChange={setNewMessage}
          onSendMessage={handleSendMessage}
          onImageSelect={handleImageSelect}
        />
      </div>
    </ProtectedRoute>
  );
}