'use client';

import Image from 'next/image';
import { HiXMark, HiUsers, HiPlay, HiPause, HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { Highlight, VideoControls } from '../../types';
import highlightStyles from '../../highlight-viewer.module.css';

interface HighlightViewerProps {
  highlight: Highlight;
  showHighlightViewer: boolean;
  videoControls: VideoControls;
  onClose: () => void;
  onVideoTimeUpdate: (currentTime: number) => void;
  onVideoLoadedMetadata: (duration: number) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoEnded: () => void;
  onTogglePlay: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  formatTime: (seconds: number) => string;
}

export function HighlightViewer({
  highlight,
  showHighlightViewer,
  videoControls,
  onClose,
  onVideoTimeUpdate,
  onVideoLoadedMetadata,
  onVideoPlay,
  onVideoPause,
  onVideoEnded,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  formatTime
}: HighlightViewerProps) {
  if (!showHighlightViewer) return null;

  return (
    <div className={highlightStyles.modalOverlay}>
      <div className={highlightStyles.modalContentCircle}>
        <button 
          className={highlightStyles.modalCloseButtonCircle}
          onClick={onClose}
        >
          <HiXMark />
        </button>

        <div className={highlightStyles.highlightViewerCircle}>
          {highlight.media_type === 'video' && highlight.video_data ? (
            <>
              <video
                className={`highlight-video ${highlightStyles.highlightVideoCircle}`}
                src={highlight.video_data}
                muted={videoControls.isMuted}
                onTimeUpdate={(e) => onVideoTimeUpdate(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => onVideoLoadedMetadata(e.currentTarget.duration)}
                onPlay={onVideoPlay}
                onPause={onVideoPause}
                onEnded={onVideoEnded}
              />
              {highlight.thumbnail_data && !videoControls.isPlaying && (
                <div className={highlightStyles.videoThumbnailOverlay}>
                  <Image
                    src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
                    alt={highlight.title}
                    width={450}
                    height={450}
                    className={highlightStyles.highlightImageCircle}
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
              className={highlightStyles.highlightImageCircle}
            />
          ) : (
            <div className={highlightStyles.highlightPlaceholder}>
              <HiUsers />
            </div>
          )}
        </div>

        {highlight.media_type === 'video' && (
          <div className={highlightStyles.videoControlsContainer}>
            <div className={highlightStyles.videoControls}>
              <button 
                className={highlightStyles.playPauseButton}
                onClick={onTogglePlay}
                title={videoControls.isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {videoControls.isPlaying ? <HiPause /> : <HiPlay />}
              </button>

              <div className={highlightStyles.seekBarContainer}>
                <div className={highlightStyles.timeInfoContainer}>
                  <span className={highlightStyles.currentTime}>
                    {formatTime(videoControls.currentTime)}
                  </span>
                  <span className={highlightStyles.totalTime}>
                    {formatTime(videoControls.duration)}
                  </span>
                </div>
                <div className={highlightStyles.seekBarWrapper}>
                  <input
                    type="range"
                    min="0"
                    max={videoControls.duration || 100}
                    value={videoControls.currentTime}
                    onChange={onSeek}
                    className={highlightStyles.seekBar}
                  />
                </div>
              </div>

              <div className={highlightStyles.volumeControls}>
                <button 
                  className={highlightStyles.muteButton}
                  onClick={onToggleMute}
                  title={videoControls.isMuted ? 'Включить звук' : 'Выключить звук'}
                >
                  {videoControls.isMuted || videoControls.volume === 0 ? (
                    <HiSpeakerXMark />
                  ) : (
                    <HiSpeakerWave />
                  )}
                </button>
                
                <div className={highlightStyles.volumeSliderContainer}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={videoControls.isMuted ? 0 : videoControls.volume}
                    onChange={onVolumeChange}
                    className={highlightStyles.volumeSlider}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={highlightStyles.highlightInfo}>
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
