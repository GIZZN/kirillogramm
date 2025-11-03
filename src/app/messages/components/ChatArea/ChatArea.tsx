'use client';

import React from 'react';
import Image from 'next/image';
import { HiArrowLeft, HiPencilSquare } from 'react-icons/hi2';
import { Chat, Message, User } from '../../types';
import { MessagesList } from '../MessagesList/MessagesList';
import { MessageInput } from '../MessageInput/MessageInput';
import styles from '../../page.module.css';

interface ChatAreaProps {
  selectedChat: Chat | null;
  messages: Message[];
  newMessage: string;
  user: User | null;
  isMobile: boolean;
  loadingMessages: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChatDeselect: () => void;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ChatAreaComponent = ({
  selectedChat,
  messages,
  newMessage,
  user,
  isMobile,
  loadingMessages,
  messagesEndRef,
  fileInputRef,
  onChatDeselect,
  onMessageChange,
  onSendMessage,
  onImageSelect
}: ChatAreaProps) => {
  if (!selectedChat) {
    return (
      <div className={`${styles.chatArea} ${styles.noChatSelected}`}>
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
      </div>
    );
  }

  return (
    <div className={styles.chatArea}>
      {/* Заголовок чата */}
      <div className={styles.chatHeader}>
        {isMobile && (
          <button 
            className={styles.backButton}
            onClick={onChatDeselect}
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
      <MessagesList
        messages={messages}
        user={user}
        loadingMessages={loadingMessages}
        messagesEndRef={messagesEndRef}
      />

      {/* Поле ввода сообщения */}
      <MessageInput
        newMessage={newMessage}
        fileInputRef={fileInputRef}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        onImageSelect={onImageSelect}
      />
    </div>
  );
};

export const ChatArea = React.memo(ChatAreaComponent);
