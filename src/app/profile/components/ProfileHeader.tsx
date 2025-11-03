'use client';

import { HiUser, HiCheckCircle, HiHeart } from 'react-icons/hi2';
import { MdRestaurantMenu } from 'react-icons/md';
import styles from '../page.module.css';
import { User, UserRecipe } from '../types';

interface ProfileHeaderProps {
  user: User | null;
  userRecipes: UserRecipe[];
}

export default function ProfileHeader({ user, userRecipes }: ProfileHeaderProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            <HiUser size={32} />
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{user?.name}</h1>
            <p className={styles.profileEmail}>{user?.email}</p>
            <div className={styles.profileStats}>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <MdRestaurantMenu size={20} />
                </div>
                <span className={styles.statNumber}>{userRecipes.length}</span>
                <span className={styles.statLabel}>Рецептов</span>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <HiCheckCircle size={20} />
                </div>
                <span className={styles.statNumber}>{userRecipes.filter(r => r.is_public).length}</span>
                <span className={styles.statLabel}>Опубликовано</span>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <HiHeart size={20} />
                </div>
                <span className={styles.statNumber}>{userRecipes.reduce((sum, r) => sum + r.likes_count, 0)}</span>
                <span className={styles.statLabel}>Лайков</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
