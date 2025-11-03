'use client';

import { HiEllipsisHorizontal, HiUserPlus, HiChatBubbleLeft } from 'react-icons/hi2';
import styles from '../../page.module.css';

interface ProfileActionsProps {
  username: string;
  isFollowing: boolean;
  followingLoading: boolean;
  onFollow: () => void;
  onSendMessage: () => void;
}

export function ProfileActions({
  username,
  isFollowing,
  followingLoading,
  onFollow,
  onSendMessage
}: ProfileActionsProps) {
  return (
    <div className={styles.profileActions}>
      <h1 className={styles.username}>@{username?.toLowerCase().replace(/\s+/g, '_')}</h1>
      <div className={styles.actionButtons}>
        <button 
          className={styles.messageButton}
          onClick={onSendMessage}
          title="Написать сообщение"
        >
          <HiChatBubbleLeft />
          Написать
        </button>
        <button 
          className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
          onClick={onFollow}
          disabled={followingLoading}
        >
          <HiUserPlus />
          {followingLoading ? 'Загрузка...' : isFollowing ? 'Отписаться' : 'Подписаться'}
        </button>
        <button className={styles.menuButton}>
          <HiEllipsisHorizontal />
        </button>
      </div>
    </div>
  );
}
