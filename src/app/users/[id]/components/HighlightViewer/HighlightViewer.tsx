'use client';

import Image from 'next/image';
import { HiXMark, HiUsers } from 'react-icons/hi2';
import { Highlight, VideoControls as VideoControlsType } from '../../types';
import { VideoControls } from './VideoControls';
import styles from '../../page.module.css';

interface HighlightViewerProps {
  highlight: Highlight;
  videoControls: VideoControlsType;
  onClose: () => void;
  onVideoControlsChange: (controls: Partial<VideoControlsType>) => void;
}

export function HighlightViewer({
  highlight,
  videoControls,
  onClose,
  onVideoControlsChange
}: HighlightViewerProps) {
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    onVideoControlsChange({ currentTime: e.currentTarget.currentTime });
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    onVideoControlsChange({ duration: e.currentTarget.duration });
  };

  const handlePlay = () => {
    onVideoControlsChange({ isPlaying: true });
  };

  const handlePause = () => {
    onVideoControlsChange({ isPlaying: false });
  };

  const handleEnded = () => {
    onVideoControlsChange({ isPlaying: false });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentCircle}>
        <button 
          className={styles.modalCloseButtonCircle}
          onClick={onClose}
        >
          <HiXMark />
        </button>

        <div className={styles.highlightViewerCircle}>
          {highlight.media_type === 'video' && highlight.video_data ? (
            <>
              <video
                className={`highlight-video ${styles.highlightVideoCircle}`}
                src={highlight.video_data}
                muted={videoControls.isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
              />
              {highlight.thumbnail_data && !videoControls.isPlaying && (
                <div className={styles.videoThumbnailOverlay}>
                  <Image
                    src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
                    alt={highlight.title}
                    width={450}
                    height={450}
                    className={styles.highlightImageCircle}
                  />
                </div>
              )}
            </>
          ) : highlight.thumbnail_data ? (
            <Image
              src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
              alt={highlight.title}
              width={450}
              height={450}
              className={styles.highlightImageCircle}
            />
          ) : (
            <div className={styles.highlightPlaceholder}>
              <HiUsers />
            </div>
          )}
        </div>

        {highlight.media_type === 'video' && (
          <VideoControls
            videoControls={videoControls}
            onVideoControlsChange={onVideoControlsChange}
          />
        )}

        <div className={styles.highlightInfo}>
          <p><strong>{highlight.title}</strong></p>
          <p>Тип: {highlight.media_type === 'video' ? 'Видео' : 'Изображение'}</p>
          {highlight.duration && highlight.duration > 0 && (
            <p>Длительность: {highlight.duration}с</p>
          )}
        </div>
      </div>
    </div>
  );
}
