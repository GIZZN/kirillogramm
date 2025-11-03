'use client';

import styles from '../../page.module.css';

interface ProfileStatsProps {
  totalRecipes: number;
  followersCount: number;
  followingCount: number;
}

export function ProfileStats({
  totalRecipes,
  followersCount,
  followingCount
}: ProfileStatsProps) {
  return (
    <div className={styles.stats}>
      <div className={styles.statItem}>
        <span className={styles.statNumber}>{totalRecipes}</span>
        <span className={styles.statLabel}>публикаций</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statNumber}>{followersCount}</span>
        <span className={styles.statLabel}>подписчиков</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.statNumber}>{followingCount}</span>
        <span className={styles.statLabel}>подписок</span>
      </div>
    </div>
  );
}
