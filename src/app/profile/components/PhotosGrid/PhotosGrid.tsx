'use client';

import Image from 'next/image';
import { HiCamera, HiHeart, HiEye, HiBookmark, HiChatBubbleLeft, HiPencil, HiTrash, HiGlobeAlt, HiLockClosed } from 'react-icons/hi2';
import { UserPhoto, TabType, ViewMode } from '../../types';
import styles from '../../page.module.css';

interface PhotosGridProps {
  photos: UserPhoto[];
  activeTab: TabType;
  viewMode: ViewMode;
  loading: boolean;
  loadingSaved: boolean;
  onPhotoEdit?: (photo: UserPhoto) => void;
  onPhotoDelete?: (photoId: number) => void;
  onPhotoTogglePublish?: (photoId: number, isPublished: boolean) => void;
}

export function PhotosGrid({ 
  photos, 
  activeTab, 
  viewMode, 
  loading,
  loadingSaved,
  onPhotoEdit,
  onPhotoDelete,
  onPhotoTogglePublish
}: PhotosGridProps) {
  const isLoading = (loading && activeTab === 'photos') || (loadingSaved && activeTab === 'saved');

  if (isLoading) {
    return (
      <div className={styles.photosGrid}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className={styles.photoSkeleton}>
            <div className={`${styles.skeleton} ${styles.photoImageSkeleton}`}></div>
            {viewMode === 'list' && (
              <div className={styles.photoSkeletonInfo}>
                <div className={`${styles.skeleton} ${styles.photoTitleSkeleton}`}></div>
                <div className={`${styles.skeleton} ${styles.photoDescSkeleton}`}></div>
                <div className={styles.photoMetaSkeleton}>
                  <div className={`${styles.skeleton} ${styles.photoStatSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.photoStatSkeleton}`}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={styles.emptyState}>
        {activeTab === 'photos' ? (
          <>
            <div className={styles.emptyIcon}>
              <HiCamera size={64} />
            </div>
            <h3 className={styles.emptyTitle}>Поделитесь фотографиями</h3>
            <p className={styles.emptyText}>
              Когда вы поделитесь фотографиями, они появятся в вашем профиле.
            </p>
          </>
        ) : activeTab === 'saved' ? (
          <>
            <div className={styles.emptyIcon}>
              <HiBookmark size={64} />
            </div>
            <h3 className={styles.emptyTitle}>Нет сохраненных фото</h3>
            <p className={styles.emptyText}>
              Сохраняйте понравившиеся фото, чтобы легко находить их позже.
            </p>
          </>
        ) : (
          <>
            <div className={styles.emptyIcon}>
              <HiEye size={64} />
            </div>
            <h3 className={styles.emptyTitle}>Нет отмеченных фото</h3>
            <p className={styles.emptyText}>
              Фото, где вас отметили, появятся здесь.
            </p>
          </>
        )}
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
                  <HiChatBubbleLeft />
                  <span>{photo.comments_count}</span>
                </div>
              </div>
              
              <div className={styles.photoActions}>
                {activeTab === 'photos' ? (
                  <>
                    <button 
                      className={styles.actionButton}
                      onClick={() => onPhotoTogglePublish && onPhotoTogglePublish(photo.id, photo.is_published)}
                      title={photo.is_published ? "Скрыть" : "Опубликовать"}
                    >
                      {photo.is_published ? <HiGlobeAlt /> : <HiLockClosed />}
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={() => onPhotoEdit && onPhotoEdit(photo)}
                      title="Редактировать"
                    >
                      <HiPencil />
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => onPhotoDelete && onPhotoDelete(photo.id)}
                      title="Удалить"
                    >
                      <HiTrash />
                    </button>
                  </>
                ) : activeTab === 'saved' ? (
                  <button 
                    className={styles.deleteButton}
                    onClick={() => {/* Remove from saved */}}
                    title="Удалить из сохраненных"
                  >
                    <HiBookmark />
                  </button>
                ) : null}
              </div>
            </div>

            {!photo.is_published && (
              <div className={styles.privateIndicator}>
                <HiLockClosed />
              </div>
            )}
          </div>
          
          {viewMode === 'list' && (
            <div className={styles.photoInfo}>
              <h3 className={styles.photoTitle}>{photo.title}</h3>
              <p className={styles.photoDescription}>{photo.description}</p>
              <div className={styles.photoMeta}>
                <span className={styles.photoDate}>
                  {new Date(photo.created_at).toLocaleDateString('ru-RU')}
                </span>
                <div className={styles.photoStatsInline}>
                  <span><HiHeart /> {photo.likes_count}</span>
                  <span><HiEye /> {photo.views_count}</span>
                  <span><HiChatBubbleLeft /> {photo.comments_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
