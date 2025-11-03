'use client';

import React from 'react';
import { HiPhoto, HiPaperAirplane, HiHeart } from 'react-icons/hi2';
import styles from '../../page.module.css';

interface MessageInputProps {
  newMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MessageInputComponent = ({
  newMessage,
  fileInputRef,
  onMessageChange,
  onSendMessage,
  onImageSelect
}: MessageInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
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
          onChange={onImageSelect}
        />
        
        <input
          type="text"
          placeholder="Написать сообщение..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.textInput}
        />
        
        <button 
          className={styles.sendButton}
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
        >
          {newMessage.trim() ? <HiPaperAirplane /> : <HiHeart />}
        </button>
      </div>
    </div>
  );
};

export const MessageInput = React.memo(MessageInputComponent);
