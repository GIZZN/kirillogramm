'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import styles from './page.module.css';
import { 
  HiMagnifyingGlass,
  HiPencilSquare,
  HiPaperAirplane,
  HiPhoto,
  HiHeart,
  HiArrowLeft
} from 'react-icons/hi2';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  userId: number;
}

interface Message {
  id: number;
  chatId?: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'image';
  imageData?: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markMessagesAsRead = useCallback(async (chatId: number) => {
    try {
      await fetch(`/api/chats/${chatId}/read`, {
        method: 'POST',
        credentials: 'include'
      });

      // Обновляем локальное состояние
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        
        // Отмечаем сообщения как прочитанные
        markMessagesAsRead(chatId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [markMessagesAsRead]);

  const handleMessageRead = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ));
  }, []);

  const handleUserOnline = useCallback((userId: number, isOnline: boolean) => {
    setChats(prev => prev.map(chat => 
      chat.userId === userId ? { ...chat, isOnline } : chat
    ));
  }, []);

  const fetchChats = useCallback(async (): Promise<void> => {
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
        if (!selectedChat && sortedChats.length > 0 && !loading) {
          console.log('Auto-selecting first chat:', sortedChats[0]);
          setSelectedChat(sortedChats[0]);
          fetchMessages(sortedChats[0].id);
        }
        
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChat, loading, fetchMessages]);

  const handleNewMessage = useCallback((message: Message) => {
    console.log('New message received:', message); // Для отладки
    
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
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
      
      // Сортируем чаты по времени последнего сообщения
      return updatedChats.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
    });
  }, [selectedChat, fetchChats, fetchMessages, scrollToBottom]);

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
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('SSE connection established');
              break;
            case 'new_message':
              console.log('SSE received new message:', data.message); // Для отладки
              handleNewMessage(data.message);
              break;
            case 'message_read':
              handleMessageRead(data.messageId);
              break;
            case 'user_online':
              handleUserOnline(data.userId, true);
              break;
            case 'user_offline':
              handleUserOnline(data.userId, false);
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

  // Загрузка чатов
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

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

  const sendMessage = async () => {
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

        setMessages(prev => [...prev, localMessage]);
        setNewMessage('');
        
        // Обновляем список чатов для отправителя
        setChats(prev => {
          const updatedChats = prev.map(chat => {
            if (chat.id === selectedChat.id) {
              return {
                ...chat,
                lastMessage: newMessage.trim(),
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0 // Для отправителя всегда 0
              };
            }
            return chat;
          });
          
          return updatedChats.sort((a, b) => 
            new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          );
        });
        
        scrollToBottom();
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendImage = async (file: File) => {
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

        setMessages(prev => [...prev, localMessage]);
        
        // Обновляем список чатов для отправителя
        setChats(prev => {
          const updatedChats = prev.map(chat => {
            if (chat.id === selectedChat.id) {
              return {
                ...chat,
                lastMessage: '📷 Изображение',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0 // Для отправителя всегда 0
              };
            }
            return chat;
          });
          
          return updatedChats.sort((a, b) => 
            new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          );
        });
        
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

      sendImage(file);
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    if (event.target) {
      event.target.value = '';
    }
  };
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className={styles.messagesPage}>
        {/* Sidebar с чатами */}
        <div className={`${styles.sidebar} ${isMobile && selectedChat ? styles.hidden : ''}`}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.title}>Сообщения</h1>
            <button className={styles.newChatButton}>
              <HiPencilSquare />
            </button>
          </div>

          <div className={styles.searchContainer}>
            <HiMagnifyingGlass className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.chatsList}>
            {loading ? (
              <div className={styles.loadingChats}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={styles.chatSkeleton}>
                    <div className={styles.skeletonAvatar}></div>
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonName}></div>
                      <div className={styles.skeletonMessage}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className={styles.emptyChats}>
                <HiPencilSquare className={styles.emptyIcon} />
                <h3>Нет чатов</h3>
                <p>Начните новый разговор</p>
              </div>
            ) : (
              filteredChats.map(chat => (
                <div
                  key={chat.id}
                  className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.active : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className={styles.chatAvatar}>
                    {chat.avatar ? (
                      <Image 
                        src={chat.avatar} 
                        alt={chat.name}
                        width={48}
                        height={48}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {chat.isOnline && <div className={styles.onlineIndicator}></div>}
                  </div>
                  
                  <div className={styles.chatContent}>
                    <div className={styles.chatHeader}>
                      <span className={styles.chatName}>{chat.name}</span>
                      <span className={styles.chatTime}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className={styles.chatPreview}>
                      <span className={styles.lastMessage}>{chat.lastMessage}</span>
                      {chat.unreadCount > 0 && (
                        <div className={styles.unreadBadge}>{chat.unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Основная область чата */}
        <div className={`${styles.chatArea} ${!selectedChat ? styles.noChatSelected : ''}`}>
          {selectedChat ? (
            <>
              {/* Заголовок чата */}
              <div className={styles.chatHeader}>
                {isMobile && (
                  <button 
                    className={styles.backButton}
                    onClick={() => setSelectedChat(null)}
                  >
                    <HiArrowLeft />
                  </button>
                )}
                
                <div className={styles.chatInfo}>
                  <div className={styles.chatAvatar}>
                    {selectedChat.avatar ? (
                      <Image 
                        src={selectedChat.avatar} 
                        alt={selectedChat.name}
                        width={48}
                        height={48}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {selectedChat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {selectedChat.isOnline && <div className={styles.onlineIndicator}></div>}
                  </div>
                  <div className={styles.chatDetails}>
                    <h2 className={styles.chatName}>{selectedChat.name}</h2>
                    <span className={styles.chatStatus}>
                      {selectedChat.isOnline ? 'В сети' : 'Не в сети'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Область сообщений */}
              <div className={styles.messagesContainer}>
                <div className={styles.messagesList}>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`${styles.messageItem} ${
                        message.senderId === user.id ? styles.own : styles.other
                      }`}
                      >
                        <div className={styles.messageContent}>
                          {message.messageType === 'text' ? (
                            <p className={styles.messageText}>{message.content}</p>
                          ) : (
                            <div className={styles.imageMessage}>
                              <div className={styles.messageImageWrapper}>
                                <Image 
                                  src={message.imageData || ''} 
                                  alt="Отправленное изображение"
                                  fill
                                  className={styles.messageImage}
                                  onClick={() => {
                                    if (message.imageData) {
                                      window.open(message.imageData, '_blank');
                                    }
                                  }}
                                  style={{ objectFit: 'contain', cursor: 'pointer' }}
                                />
                              </div>
                              <p className={styles.imageCaption}>{message.content}</p>
                            </div>
                          )}
                          <div className={styles.messageInfo}>
                            <span className={styles.messageTime}>
                              {formatTime(message.createdAt)}
                            </span>
                            {message.senderId === user.id && (
                              <span className={`${styles.readStatus} ${message.isRead ? styles.read : ''}`}>
                                ✓✓
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Поле ввода сообщения */}
              <div className={styles.messageInput}>
                <div className={styles.inputContainer}>
                  <button 
                    className={styles.attachButton}
                    onClick={() => fileInputRef.current?.click()}
                    title="Отправить изображение"
                  >
                    <HiPhoto />
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                  />
                  
                  <input
                    type="text"
                    placeholder="Написать сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className={styles.textInput}
                  />
                  
                  <button 
                    className={styles.sendButton}
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    {newMessage.trim() ? <HiPaperAirplane /> : <HiHeart />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noChatState}>
              <div className={styles.noChatContent}>
                <HiPencilSquare className={styles.noChatIcon} />
                <h2>Ваши сообщения</h2>
                <p>Отправляйте фотографии и сообщения друзьям и близким</p>
                <button className={styles.startChatButton}>
                  Отправить сообщение
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
