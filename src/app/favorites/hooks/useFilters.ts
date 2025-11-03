'use client';

import { useState, useMemo } from 'react';
import { SavedPhoto, SortBy } from '../types';

export function useFilters(savedPhotos: SavedPhoto[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация и сортировка
  const filteredPhotos = useMemo(() => {
    let filtered = [...savedPhotos];

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(photo =>
        photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.author_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(photo => photo.category === selectedCategory);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
        case 'likes':
          return b.likes_count - a.likes_count;
        case 'views':
          return b.views_count - a.views_count;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [savedPhotos, searchQuery, selectedCategory, sortBy]);

  // Получить уникальные категории
  const categories = useMemo(() => {
    return ['all', ...new Set(savedPhotos.map(photo => photo.category).filter((cat): cat is string => Boolean(cat)))];
  }, [savedPhotos]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
    showFilters,
    setShowFilters,
    filteredPhotos,
    categories
  };
}

