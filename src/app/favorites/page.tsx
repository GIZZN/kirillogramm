'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';
import ProtectedRoute from '../components/ProtectedRoute';
import { useFavorites } from '../context/FavoritesContext';
import { ViewMode, FavoritesStats } from './types';

// Hooks
import { useFavoritesData, useFilters } from './hooks';

// Components
import {
  FavoritesHeader,
  FiltersPanel,
  PhotosGrid,
  EmptyState
} from './components';

export default function FavoritesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { clearFavorites, toggleFavorite } = useFavorites();

  // Загрузка данных
  const { savedPhotos, loading, removePhoto, clearAllPhotos } = useFavoritesData();

  // Фильтрация
  const {
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
  } = useFilters(savedPhotos);

  // Обработчики
  const handleRemovePhoto = async (photoId: number) => {
    await toggleFavorite(photoId);
    removePhoto(photoId);
  };

  const handleClearAll = async () => {
    await clearFavorites();
    clearAllPhotos();
  };

  // Статистика
  const stats: FavoritesStats = useMemo(() => ({
    total: savedPhotos.length,
    totalLikes: savedPhotos.reduce((sum, photo) => sum + photo.likes_count, 0),
    totalViews: savedPhotos.reduce((sum, photo) => sum + photo.views_count, 0),
    mostLiked: savedPhotos.reduce((max, photo) => photo.likes_count > max.likes_count ? photo : max, savedPhotos[0] || { likes_count: 0 })
  }), [savedPhotos]);

  return (
    <ProtectedRoute>
      <div className={styles.page}>
        <main className={styles.main}>
          {/* Header */}
          <FavoritesHeader
            stats={stats}
            filteredCount={filteredPhotos.length}
            viewMode={viewMode}
            showFilters={showFilters}
            hasPhotos={savedPhotos.length > 0}
            onViewModeChange={setViewMode}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onClearAll={handleClearAll}
            loading={loading}
          />

          {/* Панель фильтров */}
          {showFilters && (
            <FiltersPanel
              searchQuery={searchQuery}
              sortBy={sortBy}
              selectedCategory={selectedCategory}
              categories={categories as string[]}
              onSearchChange={setSearchQuery}
              onSortChange={setSortBy}
              onCategoryChange={setSelectedCategory}
            />
          )}

          {/* Content */}
          <div className={styles.content}>
            {!loading && filteredPhotos.length === 0 && savedPhotos.length === 0 ? (
              <EmptyState />
            ) : (
              <PhotosGrid
                photos={filteredPhotos}
                viewMode={viewMode}
                loading={loading}
                onRemovePhoto={handleRemovePhoto}
              />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
