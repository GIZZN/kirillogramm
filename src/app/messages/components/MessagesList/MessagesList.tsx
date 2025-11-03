'use client';

import React from 'react';
import Image from 'next/image';
import { Message, User } from '../../types';
import styles from '../../page.module.css';

interface MessagesListProps {
  messages: Message[];
  user: User | null;
  loadingMessages: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessagesListComponent = ({
  messages,
  user,
  loadingMessages,
  messagesEndRef
}: MessagesListProps) => {
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
    <div className={styles.messagesContainer}>
      <div className={styles.messagesList}>
        {loadingMessages ? (
          // Loading скелетоны для сообщений
          [...Array(5)].map((_, i) => (
            <div key={`skeleton-${i}`} className={styles.messageItem}>
              <div className={styles.messageContent}>
                <div className={`${styles.skeleton} ${styles.messageTextSkeleton}`}></div>
                <div className={styles.messageInfo}>
                  <div className={`${styles.skeleton} ${styles.messageTimeSkeleton}`}></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          messages.map((message, index) => (
          <div
            key={`${message.id}-${message.createdAt}-${index}`}
            className={`${styles.messageItem} ${
              message.senderId === user?.id ? styles.own : styles.other
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
                {message.senderId === user?.id && (
                  <span className={`${styles.readStatus} ${message.isRead ? styles.read : ''}`}>
                    ✓✓
                  </span>
                )}
              </div>
            </div>
          </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export const MessagesList = React.memo(MessagesListComponent);
