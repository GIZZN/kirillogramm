'use client';

import { PhotoCard } from '../PhotoCard';
import { SavedPhoto, ViewMode } from '../../types';
import styles from '../../page.module.css';

interface PhotosGridProps {
  photos: SavedPhoto[];
  viewMode: ViewMode;
  loading: boolean;
  onRemovePhoto: (photoId: number) => void;
}

export function PhotosGrid({ photos, viewMode, loading, onRemovePhoto }: PhotosGridProps) {
  if (loading) {
    return (
      <div className={`${styles.photosGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className={styles.photoCard}>
            <div className={styles.photoContainer}>
              <div className={`${styles.skeleton} ${styles.photoImageSkeleton}`}></div>
            </div>
            {viewMode === 'list' && (
              <div className={styles.photoInfo}>
                <div className={`${styles.skeleton} ${styles.photoTitleSkeleton}`}></div>
                <div className={`${styles.skeleton} ${styles.photoDescriptionSkeleton}`}></div>
                <div className={styles.photoMeta}>
                  <div className={`${styles.skeleton} ${styles.photoMetaSkeleton}`}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.photosGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          viewMode={viewMode}
          onRemove={onRemovePhoto}
        />
      ))}
    </div>
  );
}

