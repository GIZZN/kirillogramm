'use client';

import { useState, useEffect, useCallback } from 'react';
import { Highlight, VideoControls } from '../types';

export function useHighlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [videoControls, setVideoControls] = useState<VideoControls>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: true,
    volume: 1
  });

  // Load highlights from feed (own + subscriptions)
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        setLoadingHighlights(true);
        const response = await fetch('/api/highlights/feed', {
          credentials: 'include'
        });
        
      if (response.ok) {
        const data = await response.json();
        setHighlights(data.highlights || []);
      } else {
        // Если пользователь не авторизован, просто показываем пустой список
        if (response.status === 401) {
          setHighlights([]);
        }
      }
      } catch (error) {
        console.error('Error loading highlights:', error);
        setHighlights([]);
      } finally {
        setLoadingHighlights(false);
      }
    };

    loadHighlights();
  }, []);

  const handleStoryClick = useCallback(async (highlight: Highlight & { user_id?: number }) => {
    try {
      // Всегда используем API пользователя, так как у нас есть user_id
      const response = await fetch(`/api/users/${highlight.user_id}/highlights/${highlight.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const { highlight: fullHighlight } = await response.json();
        setSelectedHighlight(fullHighlight);
        setShowHighlightViewer(true);
        setVideoControls({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          isMuted: true,
          volume: 1
        });
      }
    } catch (error) {
      console.error('Error loading highlight:', error);
    }
  }, []);

  const closeHighlightViewer = useCallback(() => {
    setShowHighlightViewer(false);
    setSelectedHighlight(null);
  }, []);

  // Video control functions
  const toggleVideoPlay = useCallback(() => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    if (video) {
      if (videoControls.isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setVideoControls(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [videoControls.isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    const newTime = parseFloat(e.target.value);
    if (video) {
      video.currentTime = newTime;
      setVideoControls(prev => ({ ...prev, currentTime: newTime }));
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    const newVolume = parseFloat(e.target.value);
    if (video) {
      video.volume = newVolume;
      setVideoControls(prev => ({ 
        ...prev, 
        volume: newVolume,
        isMuted: newVolume === 0
      }));
    }
  }, []);

  const toggleVideoMute = useCallback(() => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    if (video) {
      video.muted = !videoControls.isMuted;
      setVideoControls(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [videoControls.isMuted]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    setVideoControls(prev => ({ ...prev, currentTime }));
  }, []);

  const handleVideoLoadedMetadata = useCallback((duration: number) => {
    setVideoControls(prev => ({ ...prev, duration }));
  }, []);

  const handleVideoPlay = useCallback(() => {
    setVideoControls(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handleVideoPause = useCallback(() => {
    setVideoControls(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleVideoEnded = useCallback(() => {
    setVideoControls(prev => ({ ...prev, isPlaying: false }));
  }, []);

  return {
    highlights,
    loadingHighlights,
    selectedHighlight,
    showHighlightViewer,
    videoControls,
    handleStoryClick,
    closeHighlightViewer,
    toggleVideoPlay,
    handleSeek,
    handleVolumeChange,
    toggleVideoMute,
    formatTime,
    handleVideoTimeUpdate,
    handleVideoLoadedMetadata,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded
  };
}
