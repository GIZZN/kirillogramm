'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPhoto, UserStats } from '../types';

export function useProfileData(user: { id: number; name: string; email: string; bio?: string; avatarUrl?: string | null } | null) {
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalPhotos: 0,
    totalLikes: 0,
    totalViews: 0,
    followers: 0,
    following: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchUserPhotos = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/recipes', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Преобразуем рецепты в формат фото
        const photos = data.recipes.map((recipe: {
          id: number;
          title: string;
          description: string;
          likes_count: number;
          views_count: number;
          comments_count: number;
          created_at: string;
          has_image: boolean;
          is_published: boolean;
          category: string;
        }) => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          likes_count: recipe.likes_count || 0,
          views_count: recipe.views_count || 0,
          comments_count: recipe.comments_count || 0,
          created_at: recipe.created_at,
          has_image: recipe.has_image,
          is_published: recipe.is_published,
          category: recipe.category
        }));
        setUserPhotos(photos);
      }
    } catch (error) {
      console.error('Error fetching user photos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedPhotos = useCallback(async () => {
    if (!user || !user.id) return;
    
    setLoadingSaved(true);
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Преобразуем данные избранного в формат UserPhoto
        const photos: UserPhoto[] = data.favorites.map((fav: {
          id: number;
          title: string;
          description: string;
          category: string;
          views_count: number;
          likes_count: number;
          created_at: string;
          has_image: boolean;
          comments_count?: number;
        }) => ({
          id: fav.id,
          title: fav.title,
          description: fav.description || '',
          category: fav.category || 'Фото',
          views_count: fav.views_count || 0,
          likes_count: fav.likes_count || 0,
          comments_count: fav.comments_count || 0,
          created_at: fav.created_at,
          has_image: fav.has_image || false,
          is_published: true
        }));

        setSavedPhotos(photos);
      }
    } catch (error) {
      console.error('Error fetching saved photos:', error);
    } finally {
      setLoadingSaved(false);
    }
  }, [user]);

  const fetchUserStats = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingStats(true);
      const [recipesResponse, profileStatsResponse] = await Promise.all([
        fetch('/api/recipes', { credentials: 'include' }),
        fetch('/api/profile/stats', { credentials: 'include' })
      ]);
      
      if (recipesResponse.ok) {
        const data = await recipesResponse.json();
        const photos = data.recipes || [];
        
        const totalPhotos = photos.length;
        const totalLikes = photos.reduce((sum: number, photo: UserPhoto) => sum + photo.likes_count, 0);
        const totalViews = photos.reduce((sum: number, photo: UserPhoto) => sum + photo.views_count, 0);
        
        setStats(prev => ({
          ...prev,
          totalPhotos,
          totalLikes,
          totalViews
        }));
      }

      if (profileStatsResponse.ok) {
        const profileStats = await profileStatsResponse.json();
        setStats(prev => ({
          ...prev,
          followers: profileStats.followers || 0,
          following: profileStats.following || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  // Update stats when photos change
  useEffect(() => {
    if (userPhotos.length > 0) {
      setStats(prev => ({
        ...prev,
        totalPhotos: userPhotos.length,
        totalLikes: userPhotos.reduce((sum, photo) => sum + photo.likes_count, 0),
        totalViews: userPhotos.reduce((sum, photo) => sum + photo.views_count, 0)
      }));
    }
  }, [userPhotos]);

  return {
    userPhotos,
    setUserPhotos,
    savedPhotos,
    setSavedPhotos,
    loading,
    loadingSaved,
    stats,
    loadingStats,
    fetchUserPhotos,
    fetchSavedPhotos,
    fetchUserStats
  };
}
