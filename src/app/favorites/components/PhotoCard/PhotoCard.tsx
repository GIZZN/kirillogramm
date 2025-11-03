'use client';

import Image from 'next/image';
import { HiHeart, HiEye, HiCamera, HiBookmark, HiShare, HiArrowDownTray } from 'react-icons/hi2';
import { SavedPhoto, ViewMode } from '../../types';
import styles from '../../page.module.css';

interface PhotoCardProps {
  photo: SavedPhoto;
  viewMode: ViewMode;
  onRemove: (photoId: number) => void;
}

export function PhotoCard({ photo, viewMode, onRemove }: PhotoCardProps) {
  return (
    <div className={styles.photoCard}>
      <div className={styles.photoContainer}>
        {photo.has_image ? (
          <Image
            src={`/api/recipes/${photo.id}/image`}
            alt={photo.title}
            width={300}
            height={300}
            className={styles.photoImage}
          />
        ) : (
          <div className={styles.noImage}>
            <HiCamera size={48} />
          </div>
        )}
        
        <div className={styles.photoOverlay}>
          <div className={styles.photoStats}>
            <div className={styles.overlayStatItem}>
              <HiHeart />
              <span>{photo.likes_count}</span>
            </div>
            <div className={styles.overlayStatItem}>
              <HiEye />
              <span>{photo.views_count}</span>
            </div>
          </div>
          
          <div className={styles.photoActions}>
            <button 
              className={styles.actionButton}
              onClick={() => {/* Share functionality */}}
              title="Поделиться"
            >
              <HiShare />
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => {/* Download functionality */}}
              title="Скачать"
            >
              <HiArrowDownTray />
            </button>
            <button 
              className={styles.removeButton}
              onClick={() => onRemove(photo.id)}
              title="Удалить из сохраненных"
            >
              <HiBookmark />
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'list' && (
        <div className={styles.photoInfo}>
          <h3 className={styles.photoTitle}>{photo.title}</h3>
          <p className={styles.photoDescription}>{photo.description}</p>
          <div className={styles.photoMeta}>
            <span className={styles.author}>@{photo.author_name}</span>
            <span className={styles.savedDate}>
              Сохранено {new Date(photo.saved_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

