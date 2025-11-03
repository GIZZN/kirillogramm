'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Recipe {
  id: number;
  title: string;
  category: string;
  time: string;
  servings: number;
  difficulty: string;
  rating: number;
  image: string;
  icon: React.ReactNode;
  ingredients: string[];
  description: string;
}

interface FavoritesContextType {
  favorites: number[];
  isFavorite: (recipeId: number) => boolean;
  toggleFavorite: (recipeId: number) => Promise<void>;
  clearFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Загружаем избранные рецепты из API при авторизации
  useEffect(() => {
    if (user) {
      loadFavoritesFromAPI();
    } else {
      // Если пользователь не авторизован, загружаем из localStorage
      loadFavoritesFromLocalStorage();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavoritesFromLocalStorage = () => {
    const savedFavorites = localStorage.getItem('favoriteRecipes');
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites);
        setFavorites(parsedFavorites);
      } catch (error) {
        console.error('Error parsing saved favorites:', error);
        localStorage.removeItem('favoriteRecipes');
      }
    }
  };

  const loadFavoritesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const favoriteIds = data.favorites.map((fav: { id: number }) => fav.id);
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites from API:', error);
      // Fallback к localStorage
      loadFavoritesFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Сохраняем в localStorage для неавторизованных пользователей
  useEffect(() => {
    if (!user) {
      localStorage.setItem('favoriteRecipes', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const isFavorite = (recipeId: number): boolean => {
    return favorites.includes(recipeId);
  };

  const toggleFavorite = async (recipeId: number): Promise<void> => {
    const isCurrentlyFavorite = favorites.includes(recipeId);

    if (user) {
      // Авторизованный пользователь - работаем через API
      try {
        if (isCurrentlyFavorite) {
          // Удаляем из избранного
          const response = await fetch(`/api/favorites?recipeId=${recipeId}&recipeType=user_recipe`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setFavorites(prev => prev.filter(id => id !== recipeId));
          }
        } else {
          // Добавляем в избранное
          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              recipeId,
              recipeType: 'user_recipe'
            }),
          });

          if (response.ok) {
            setFavorites(prev => [...prev, recipeId]);
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    } else {
      // Неавторизованный пользователь - работаем с localStorage
      setFavorites(prev => {
        if (prev.includes(recipeId)) {
          return prev.filter(id => id !== recipeId);
        } else {
          return [...prev, recipeId];
        }
      });
    }
  };

  const clearFavorites = async (): Promise<void> => {
    if (user) {
      // Авторизованный пользователь - очищаем через API
      try {
        const response = await fetch('/api/favorites/clear', {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error clearing favorites:', error);
      }
    } else {
      // Неавторизованный пользователь - очищаем localStorage
      setFavorites([]);
    }
  };

  const value = {
    favorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
