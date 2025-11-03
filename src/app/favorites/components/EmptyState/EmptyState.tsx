'use client';

import Link from 'next/link';
import { HiBookmark } from 'react-icons/hi2';
import { MdPhotoLibrary } from 'react-icons/md';
import styles from '../../page.module.css';

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <HiBookmark size={64} />
      </div>
      <h3 className={styles.emptyTitle}>Нет сохраненных фото</h3>
      <p className={styles.emptyText}>
        Сохраняйте понравившиеся фото, чтобы легко находить их позже
      </p>
      <Link href="/recipes" className={styles.browseButton}>
        <MdPhotoLibrary />
        <span>Найти фото</span>
      </Link>
    </div>
  );
}

