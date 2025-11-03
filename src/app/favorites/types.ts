export interface SavedPhoto {
  id: number;
  title: string;
  description: string;
  author_name: string;
  likes_count: number;
  views_count: number;
  saved_at: string;
  has_image: boolean;
  category?: string;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'date' | 'likes' | 'views' | 'title';

export interface FavoritesStats {
  total: number;
  totalLikes: number;
  totalViews: number;
  mostLiked: SavedPhoto;
}

export interface FilterState {
  searchQuery: string;
  sortBy: SortBy;
  selectedCategory: string;
  showFilters: boolean;
}

