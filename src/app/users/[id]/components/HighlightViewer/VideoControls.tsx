'use client';

import { HiPlay, HiPause, HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { VideoControls as VideoControlsType } from '../../types';
import { formatTime, getVideoElement } from '../../utils/videoUtils';
import styles from '../../page.module.css';

interface VideoControlsProps {
  videoControls: VideoControlsType;
  onVideoControlsChange: (controls: Partial<VideoControlsType>) => void;
}

export function VideoControls({ videoControls, onVideoControlsChange }: VideoControlsProps) {
  const toggleVideoPlay = () => {
    const video = getVideoElement();
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
    const video = getVideoElement();
    const newTime = parseFloat(e.target.value);
    if (video) {
      video.currentTime = newTime;
      onVideoControlsChange({ currentTime: newTime });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = getVideoElement();
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
    const video = getVideoElement();
    if (video) {
      video.muted = !videoControls.isMuted;
      onVideoControlsChange({ isMuted: !videoControls.isMuted });
    }
  };

  return (
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
  );
}
