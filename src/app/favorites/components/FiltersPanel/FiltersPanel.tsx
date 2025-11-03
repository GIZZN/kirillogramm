'use client';

import { HiMagnifyingGlass } from 'react-icons/hi2';
import { SortBy } from '../../types';
import styles from '../../page.module.css';

interface FiltersPanelProps {
  searchQuery: string;
  sortBy: SortBy;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortBy) => void;
  onCategoryChange: (category: string) => void;
}

export function FiltersPanel({
  searchQuery,
  sortBy,
  selectedCategory,
  categories,
  onSearchChange,
  onSortChange,
  onCategoryChange
}: FiltersPanelProps) {
  return (
    <div className={styles.filtersPanel}>
      <div className={styles.searchBox}>
        <HiMagnifyingGlass className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Поиск по названию, описанию или автору..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Сортировка:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className={styles.filterSelect}
          >
            <option value="date">По дате сохранения</option>
            <option value="likes">По лайкам</option>
            <option value="views">По просмотрам</option>
            <option value="title">По названию</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Категория:</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все категории</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

