'use client';

import Image from 'next/image';
import { HiPhoto, HiPlus } from 'react-icons/hi2';
import { Highlight } from '../../types';
import styles from '../../page.module.css';

interface HighlightsSectionProps {
  highlights: Highlight[];
  loadingHighlights: boolean;
  onStoryClick: (highlight: Highlight) => void;
  onAddHighlight: () => void;
}

export function HighlightsSection({
  highlights,
  loadingHighlights,
  onStoryClick,
  onAddHighlight
}: HighlightsSectionProps) {
  return (
    <div className={styles.highlights}>
      <div 
        className={styles.highlight}
        onClick={onAddHighlight}
      >
        <div className={styles.highlightCircle}>
          <HiPlus />
        </div>
        <span className={styles.highlightLabel}>Новое</span>
      </div>
      
      {loadingHighlights ? (
        [...Array(3)].map((_, index) => (
          <div key={index} className={styles.highlightSkeleton}>
            <div className={`${styles.skeleton} ${styles.highlightCircleSkeleton}`}></div>
            <div className={`${styles.skeleton} ${styles.highlightLabelSkeleton}`}></div>
          </div>
        ))
      ) : (
        highlights.map(highlight => (
          <div 
            key={highlight.id}
            className={styles.highlight}
            onClick={() => onStoryClick(highlight)}
          >
            <div className={styles.highlightCircle}>
              {highlight.has_media && highlight.thumbnail_data ? (
                <>
                  <Image 
                    src={highlight.thumbnail_data}
                    alt={highlight.title}
                    width={77}
                    height={77}
                    className={styles.highlightImage}
                  />
                  {highlight.media_type === 'video' && (
                    <div className={styles.videoIndicator}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                  )}
                </>
              ) : (
                <HiPhoto />
              )}
            </div>
            <span className={styles.highlightLabel}>{highlight.title}</span>
          </div>
        ))
      )}
    </div>
  );
}
