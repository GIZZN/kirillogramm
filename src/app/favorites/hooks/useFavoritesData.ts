'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedPhoto } from '../types';

export function useFavoritesData() {
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные в формат фото
        const photos = data.favorites.map((recipe: {
          id: number;
          title: string;
          description: string;
          author_name: string;
          likes_count: number;
          views_count: number;
          favorited_at: string;
          has_image: boolean;
          category: string;
        }) => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          author_name: recipe.author_name,
          likes_count: recipe.likes_count,
          views_count: recipe.views_count,
          saved_at: recipe.favorited_at,
          has_image: recipe.has_image,
          category: recipe.category
        }));
        setSavedPhotos(photos);
      } else {
        console.error('Failed to fetch saved photos');
      }
    } catch (error) {
      console.error('Error fetching saved photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPhotos();
  }, [fetchSavedPhotos]);

  const removePhoto = useCallback((photoId: number) => {
    setSavedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }, []);

  const clearAllPhotos = useCallback(() => {
    setSavedPhotos([]);
  }, []);

  return {
    savedPhotos,
    loading,
    removePhoto,
    clearAllPhotos
  };
}

