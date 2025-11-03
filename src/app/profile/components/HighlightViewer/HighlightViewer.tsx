'use client';

import Image from 'next/image';
import { HiXMark, HiUsers, HiPlay, HiPause, HiSpeakerWave, HiSpeakerXMark, HiTrash } from 'react-icons/hi2';
import { Highlight, VideoControls } from '../../types';
import styles from '../../page.module.css';

interface HighlightViewerProps {
  highlight: Highlight;
  showHighlightViewer: boolean;
  videoControls: VideoControls;
  highlightVideoRef: React.RefObject<HTMLVideoElement | null>;
  onClose: () => void;
  onVideoControlsChange: (controls: Partial<VideoControls>) => void;
  onDeleteHighlight: (highlightId: number) => void;
}

export function HighlightViewer({
  highlight,
  showHighlightViewer,
  videoControls,
  highlightVideoRef,
  onClose,
  onVideoControlsChange,
  onDeleteHighlight
}: HighlightViewerProps) {
  if (!showHighlightViewer) return null;

  const toggleVideoPlay = () => {
    const video = highlightVideoRef.current;
    if (video) {
      if (videoControls.isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      onVideoControlsChange({ isPlaying: !videoControls.isPlaying });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = highlightVideoRef.current;
    const newTime = parseFloat(e.target.value);
    if (video) {
      video.currentTime = newTime;
      onVideoControlsChange({ currentTime: newTime });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = highlightVideoRef.current;
    const newVolume = parseFloat(e.target.value);
    if (video) {
      video.volume = newVolume;
      onVideoControlsChange({ 
        volume: newVolume, 
        isMuted: newVolume === 0 
      });
    }
  };

  const toggleVideoMute = () => {
    const video = highlightVideoRef.current;
    if (video) {
      video.muted = !videoControls.isMuted;
      onVideoControlsChange({ isMuted: !videoControls.isMuted });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                ref={highlightVideoRef}
                className={styles.highlightVideoCircle}
                src={highlight.video_data}
                muted={videoControls.isMuted}
                onTimeUpdate={(e) => onVideoControlsChange({ currentTime: e.currentTarget.currentTime })}
                onLoadedMetadata={(e) => onVideoControlsChange({ duration: e.currentTarget.duration })}
                onPlay={() => onVideoControlsChange({ isPlaying: true })}
                onPause={() => onVideoControlsChange({ isPlaying: false })}
                onEnded={() => onVideoControlsChange({ isPlaying: false })}
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
          <div className={styles.videoControlsContainer}>
            <div className={styles.videoControls}>
              <button 
                className={styles.playPauseButton}
                onClick={toggleVideoPlay}
                title={videoControls.isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {videoControls.isPlaying ? <HiPause /> : <HiPlay />}
              </button>

              <div className={styles.seekBarContainer}>
                <div className={styles.timeInfoContainer}>
                  <span className={styles.currentTime}>
                    {formatTime(videoControls.currentTime)}
                  </span>
                  <span className={styles.totalTime}>
                    {formatTime(videoControls.duration)}
                  </span>
                </div>
                <div className={styles.seekBarWrapper}>
                  <input
                    type="range"
                    min="0"
                    max={videoControls.duration || 100}
                    value={videoControls.currentTime}
                    onChange={handleSeek}
                    className={styles.seekBar}
                  />
                </div>
              </div>

              <div className={styles.volumeControls}>
                <button 
                  className={styles.muteButton}
                  onClick={toggleVideoMute}
                  title={videoControls.isMuted ? 'Включить звук' : 'Выключить звук'}
                >
                  {videoControls.isMuted || videoControls.volume === 0 ? (
                    <HiSpeakerXMark />
                  ) : (
                    <HiSpeakerWave />
                  )}
                </button>
                
                <div className={styles.volumeSliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={videoControls.isMuted ? 0 : videoControls.volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.highlightViewerActions}>
          <button 
            className={styles.deleteButtonCircle}
            onClick={() => onDeleteHighlight(highlight.id)}
            title="Удалить highlight"
          >
            <HiTrash />
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
