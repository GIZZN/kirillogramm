'use client';

import { HiBookmark, HiTrash, HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { MdGridView, MdViewList } from 'react-icons/md';
import { ViewMode, FavoritesStats } from '../../types';
import styles from '../../page.module.css';

interface FavoritesHeaderProps {
  stats: FavoritesStats;
  filteredCount: number;
  viewMode: ViewMode;
  showFilters: boolean;
  hasPhotos: boolean;
  loading: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleFilters: () => void;
  onClearAll: () => void;
}

export function FavoritesHeader({
  stats,
  filteredCount,
  viewMode,
  showFilters,
  hasPhotos,
  loading,
  onViewModeChange,
  onToggleFilters,
  onClearAll
}: FavoritesHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>
          <HiBookmark className={styles.titleIcon} />
          Сохраненки
        </h1>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Сетка"
            >
              <MdGridView />
            </button>
            <button 
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => onViewModeChange('list')}
              title="Список"
            >
              <MdViewList />
            </button>
          </div>
          
          <button 
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={onToggleFilters}
            title="Фильтры"
          >
            <HiAdjustmentsHorizontal />
          </button>

          {hasPhotos && (
            <button 
              className={styles.clearButton}
              onClick={onClearAll}
            >
              <HiTrash />
              Очистить
            </button>
          )}
        </div>
      </div>
      
      {/* Расширенная статистика */}
      <div className={styles.statsBar}>
        {loading ? (
          <>
            <div className={styles.statItem}>
              <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
              <span className={styles.statLabel}>Фото</span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
              <span className={styles.statLabel}>Лайков</span>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
              <span className={styles.statLabel}>Просмотров</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.total}</span>
              <span className={styles.statLabel}>Фото</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.totalLikes}</span>
              <span className={styles.statLabel}>Лайков</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.totalViews}</span>
              <span className={styles.statLabel}>Просмотров</span>
            </div>
            {filteredCount !== stats.total && (
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{filteredCount}</span>
                <span className={styles.statLabel}>Найдено</span>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}

