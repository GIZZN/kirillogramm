'use client';

import React from 'react';
import Image from 'next/image';
import { HiMagnifyingGlass, HiPencilSquare } from 'react-icons/hi2';
import { Chat } from '../../types';
import styles from '../../page.module.css';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  searchQuery: string;
  loading: boolean;
  isMobile: boolean;
  onChatSelect: (chat: Chat) => void;
  onSearchChange: (query: string) => void;
}

const ChatSidebarComponent = ({
  chats,
  selectedChat,
  searchQuery,
  loading,
  isMobile,
  onChatSelect,
  onSearchChange
}: ChatSidebarProps) => {
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

  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onChatSelect(chat)}
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
  );
};

export const ChatSidebar = React.memo(ChatSidebarComponent);
