'use client';

import Image from 'next/image';
import { HiCamera, HiHeart, HiEye, HiBookmark } from 'react-icons/hi2';
import { UserPhoto, TabType, ViewMode } from '../../types';
import { PhotosLoadingState } from '../LoadingStates';
import styles from '../../page.module.css';

interface PhotosGridProps {
  photos: UserPhoto[];
  activeTab: TabType;
  viewMode: ViewMode;
  loading: boolean;
}

export function PhotosGrid({ photos, activeTab, viewMode, loading }: PhotosGridProps) {
  if (loading) {
    return <PhotosLoadingState />;
  }

  // Empty states for different tabs
  if (activeTab === 'saved') {
    return (
      <div className={styles.emptyState}>
        <HiBookmark className={styles.emptyIcon} />
        <h3>Нет сохраненных публикаций</h3>
        <p>Сохраненные публикации видны только владельцу аккаунта</p>
      </div>
    );
  }

  if (activeTab === 'tagged') {
    return (
      <div className={styles.emptyState}>
        <HiCamera className={styles.emptyIcon} />
        <h3>Нет отмеченных публикаций</h3>
        <p>Когда кто-то отметит этого пользователя на фото, они появятся здесь</p>
      </div>
    );
  }

  // Photos tab
  if (photos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <HiCamera className={styles.emptyIcon} />
        <h3>Пока нет публикаций</h3>
        <p>Этот пользователь еще не опубликовал ни одного фото</p>
      </div>
    );
  }

  return (
    <div className={`${styles.photosGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
      {photos.map(photo => (
        <div key={photo.id} className={styles.photoCard}>
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
                <HiCamera />
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
            </div>
          </div>
          
          {viewMode === 'list' && (
            <div className={styles.photoInfo}>
              <h4 className={styles.photoTitle}>{photo.title}</h4>
              <p className={styles.photoDescription}>{photo.description}</p>
              <div className={styles.photoMeta}>
                <span className={styles.category}>{photo.category}</span>
                <span className={styles.date}>
                  {new Date(photo.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
