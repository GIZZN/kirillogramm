'use client';

import Image from 'next/image';
import { HiUsers } from 'react-icons/hi2';
import { Highlight } from '../../types';
import styles from '../../page.module.css';

interface HighlightsSectionProps {
  highlights: Highlight[];
  loadingHighlights: boolean;
  onStoryClick: (highlight: Highlight) => void;
}

export function HighlightsSection({
  highlights,
  loadingHighlights,
  onStoryClick
}: HighlightsSectionProps) {
  if (loadingHighlights) {
    return (
      <div className={styles.storiesList}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className={styles.storyItemSkeleton}>
            <div className={`${styles.skeleton} ${styles.storyCircleSkeleton}`}></div>
            <div className={`${styles.skeleton} ${styles.storyLabelSkeleton}`}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.storiesList}>
      {highlights.length === 0 ? (
        <div className={styles.noStories}>Нет сторисов</div>
      ) : (
        highlights.map(highlight => (
        <div 
          key={highlight.id} 
          className={styles.storyItem}
          onClick={() => onStoryClick(highlight)}
        >
          <div className={styles.storyCircle}>
            {highlight.has_media && highlight.thumbnail_data ? (
              <Image
                src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
                alt={highlight.title}
                width={60}
                height={60}
                className={styles.storyImage}
              />
            ) : (
              <div className={styles.storyPlaceholder}>
                <HiUsers />
              </div>
            )}
            {highlight.media_type === 'video' && (
              <div className={styles.videoIndicator}>
                <div className={styles.playIcon}>▶</div>
              </div>
            )}
          </div>
          <span className={styles.storyLabel}>
            {highlight.author_name ? highlight.author_name : highlight.title}
          </span>
        </div>
        ))
      )}
    </div>
  );
}
