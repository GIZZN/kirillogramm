import { useState, useEffect, useMemo, useCallback } from 'react';
import { PublicRecipe } from '../types';

export function useRecipes() {
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedRecipes, setLikedRecipes] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPublicRecipes();
    loadLikedRecipes();

    // Слушаем событие добавления нового рецепта
    const handleRecipeAdded = () => {
      fetchPublicRecipes();
    };

    window.addEventListener('recipeAdded', handleRecipeAdded);
    
    return () => {
      window.removeEventListener('recipeAdded', handleRecipeAdded);
    };
  }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLikedRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/likes', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLikedRecipes(new Set(data.likedRecipeIds || []));
      }
    } catch (error) {
      console.error('Error loading liked recipes:', error);
    }
  };

  const fetchPublicRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes/public?limit=100000000000');
      
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
      } else {
        console.error('Failed to fetch recipes');
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLike = async (recipeId: number) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Обновляем состояние лайков
        setLikedRecipes(prev => {
          const newSet = new Set(prev);
          if (data.isLiked) {
            newSet.add(recipeId);
          } else {
            newSet.delete(recipeId);
          }
          return newSet;
        });

        // Обновляем количество лайков в рецептах
        setRecipes(prev => prev.map(recipe => 
          recipe.id === recipeId 
            ? { ...recipe, likes_count: data.likesCount }
            : recipe
        ));

        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при изменении лайка');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  return {
    recipes,
    loading,
    likedRecipes,
    setRecipes,
    toggleLike,
    fetchPublicRecipes
  };
}

export function useRecipeFilters(recipes: PublicRecipe[]) {
  const [activeFilter, setActiveFilter] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Фильтрация по категории
    if (activeFilter !== 'Все') {
      filtered = filtered.filter(recipe => recipe.category === activeFilter);
    }

    // Фильтрация по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.ingredients.some((ingredient: string) => 
          ingredient.toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, [activeFilter, searchQuery, recipes]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('Все');
  };

  return {
    activeFilter,
    searchQuery,
    filteredRecipes,
    setActiveFilter,
    setSearchQuery,
    resetFilters
  };
}
