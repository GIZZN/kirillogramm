'use client';

import { HiArrowLeft } from 'react-icons/hi2';
import styles from '../../page.module.css';

export function ProfileLoadingState() {
  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          {/* Back Button Skeleton */}
          <div className={styles.backButtonContainer}>
            <div className={styles.backButton} style={{ opacity: 0.3, pointerEvents: 'none' }}>
              <HiArrowLeft />
              Назад
            </div>
          </div>

          {/* Profile Header Skeleton */}
          <div className={styles.loadingProfileHeader}>
            <div className={styles.loadingAvatar}></div>
            
            <div className={styles.loadingProfileInfo}>
              <div className={styles.loadingProfileActions}>
                <div className={styles.loadingUsername}></div>
                <div className={styles.loadingActionButtons}>
                  <div className={styles.loadingButton}></div>
                  <div className={styles.loadingMenuButton}></div>
                </div>
              </div>

              <div className={styles.loadingStats}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={styles.loadingStat}>
                    <div className={styles.loadingStatNumber}></div>
                    <div className={styles.loadingStatLabel}></div>
                  </div>
                ))}
              </div>
              
              <div className={styles.loadingBio}>
                <div className={styles.loadingDisplayName}></div>
                <div className={styles.loadingBioText}></div>
              </div>
            </div>
          </div>

          {/* Highlights Skeleton */}
          <div className={styles.loadingHighlights}>
            <div className={styles.loadingHighlight}>
              <div className={styles.loadingHighlightCircle}></div>
              <div className={styles.loadingHighlightLabel}></div>
            </div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className={styles.loadingTabsNav}>
            <div className={styles.loadingTabs}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.loadingTab}></div>
              ))}
            </div>
            <div className={styles.loadingViewToggle}>
              <div className={styles.loadingViewButton}></div>
              <div className={styles.loadingViewButton}></div>
            </div>
          </div>

          {/* Photos Grid Skeleton */}
          <div className={styles.loadingPhotosGrid}>
            {[...Array(9)].map((_, i) => (
              <div key={i} className={styles.loadingPhotoCard}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhotosLoadingState() {
  return (
    <div className={styles.loadingGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.skeletonPhoto}></div>
      ))}
    </div>
  );
}
