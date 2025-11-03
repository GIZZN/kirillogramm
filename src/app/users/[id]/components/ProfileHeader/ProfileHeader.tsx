'use client';

import Image from 'next/image';
import { HiCamera } from 'react-icons/hi2';
import { UserProfile } from '../../types';
import { ProfileActions } from '../ProfileActions';
import { ProfileStats } from '../ProfileStats';
import styles from '../../page.module.css';

interface ProfileHeaderProps {
  user: UserProfile;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  followingLoading: boolean;
  onFollow: () => void;
  onSendMessage: () => void;
}

export function ProfileHeader({
  user,
  followersCount,
  followingCount,
  isFollowing,
  followingLoading,
  onFollow,
  onSendMessage
}: ProfileHeaderProps) {
  const defaultBio = 'Нет информации о себе';
  const displayBio = user.bio || defaultBio;

  return (
    <header className={styles.profileHeader}>
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          {user.avatarUrl ? (
            <Image 
              src={user.avatarUrl} 
              alt={`Аватар ${user.name}`}
              width={150}
              height={150}
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <HiCamera size={40} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.profileInfo}>
        <ProfileActions
          username={user.name}
          isFollowing={isFollowing}
          followingLoading={followingLoading}
          onFollow={onFollow}
          onSendMessage={onSendMessage}
        />

        <ProfileStats
          totalRecipes={user.stats.totalRecipes}
          followersCount={followersCount}
          followingCount={followingCount}
        />
        
        <div className={styles.bio}>
          <h2 className={styles.displayName}>{user.name}</h2>
          <p className={styles.bioText}>
            {displayBio.split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < displayBio.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      </div>
    </header>
  );
}
