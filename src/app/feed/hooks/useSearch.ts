'use client';

import { useState, useMemo } from 'react';
import { PublicRecipe } from '../types';

export function useSearch(recipes: PublicRecipe[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);

  // Filter recipes based on search and tags
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      let matchesSearch = true;
      
      if (searchQuery.trim()) {
        if (searchQuery.startsWith('#')) {
          // Поиск по хештегам
          const hashtag = searchQuery.slice(1).toLowerCase();
          matchesSearch = recipe.hashtags?.some(tag => 
            tag.toLowerCase().includes(hashtag)
          ) || false;
        } else {
          // Обычный поиск по тексту
          matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
        }
      }
      
      return matchesSearch;
    });
  }, [recipes, searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedPostForComments,
    setSelectedPostForComments,
    filteredRecipes,
    clearSearch
  };
}
