'use client';

import { HiBookmark, HiCamera } from 'react-icons/hi2';
import { MdGridView, MdViewList } from 'react-icons/md';
import { TabType, ViewMode } from '../../types';
import styles from '../../page.module.css';

interface ProfileTabsProps {
  activeTab: TabType;
  viewMode: ViewMode;
  onTabChange: (tab: TabType) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ProfileTabs({
  activeTab,
  viewMode,
  onTabChange,
  onViewModeChange
}: ProfileTabsProps) {
  return (
    <nav className={styles.tabsNav}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`}
          onClick={() => onTabChange('photos')}
        >
          <MdGridView />
          <span>ПУБЛИКАЦИИ</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
          onClick={() => onTabChange('saved')}
        >
          <HiBookmark />
          <span>СОХРАНЕННОЕ</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tagged' ? styles.active : ''}`}
          onClick={() => onTabChange('tagged')}
        >
          <HiCamera />
          <span>ОТМЕТКИ</span>
        </button>
      </div>

      <div className={styles.viewToggle}>
        <button 
          className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
          onClick={() => onViewModeChange('grid')}
        >
          <MdGridView />
        </button>
        <button 
          className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => onViewModeChange('list')}
        >
          <MdViewList />
        </button>
      </div>
    </nav>
  );
}
