'use client';

import { HiMagnifyingGlass } from 'react-icons/hi2';
import styles from '../../page.module.css';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className={styles.searchBox}>
      <HiMagnifyingGlass className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Поиск Постов или #хештегов..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
      />
    </div>
  );
}
