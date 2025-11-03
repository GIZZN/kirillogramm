'use client';

import { useState, useEffect } from 'react';
import { Highlight, VideoControls } from '../types';

export function useHighlights(userId: string) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);

  // Video controls state
  const [videoControls, setVideoControls] = useState<VideoControls>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: true,
    volume: 1
  });

  useEffect(() => {
    const fetchUserHighlights = async () => {
      try {
        setLoadingHighlights(true);
        const response = await fetch(`/api/users/${userId}/highlights`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setHighlights(data.highlights || []);
        } else {
          setHighlights([]);
        }
      } catch (error) {
        console.error('Error loading user highlights:', error);
        setHighlights([]);
      } finally {
        setLoadingHighlights(false);
      }
    };

    if (userId) {
      fetchUserHighlights();
    }
  }, [userId]);

  const handleStoryClick = async (highlight: Highlight) => {
    try {
      const response = await fetch(`/api/users/${userId}/highlights/${highlight.id}`, {
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
  };

  const closeHighlightViewer = () => {
    setShowHighlightViewer(false);
    setSelectedHighlight(null);
  };

  return {
    highlights,
    loadingHighlights,
    selectedHighlight,
    showHighlightViewer,
    videoControls,
    setVideoControls,
    handleStoryClick,
    closeHighlightViewer
  };
}
