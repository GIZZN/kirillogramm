'use client';

import Image from 'next/image';
import { HiPhoto } from 'react-icons/hi2';
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
      <div className={styles.highlights}>
        <div className={styles.highlightsLoading}>Загрузка сторисов...</div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className={styles.highlights}>
        <div className={styles.noHighlights}>Нет сторисов</div>
      </div>
    );
  }

  return (
    <div className={styles.highlights}>
      {highlights.map(highlight => (
        <div 
          key={highlight.id}
          className={styles.highlight}
          onClick={() => onStoryClick(highlight)}
        >
          <div className={styles.highlightCircle}>
            {highlight.has_media && highlight.thumbnail_data ? (
              <Image
                src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
                alt={highlight.title}
                width={77}
                height={77}
                className={styles.highlightImage}
              />
            ) : (
              <HiPhoto />
            )}
            {highlight.media_type === 'video' && (
              <div className={styles.videoIndicator}>
                <div className={styles.playIcon}>▶</div>
              </div>
            )}
          </div>
          <span className={styles.highlightLabel}>{highlight.title}</span>
        </div>
      ))}
    </div>
  );
}
