export interface UserRecipe {
  id: number;
  title: string;
  category: string;
  description: string;
  ingredients: string[];
  instructions: string;
  time: string;
  servings: number;
  difficulty: string;
  image_url?: string;
  is_approved: boolean;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  has_image: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string | null;
}

// Profile specific types
export interface UserPhoto {
  id: number;
  title: string;
  description: string;
  likes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  has_image: boolean;
  is_published: boolean;
  category?: string;
}

export interface UserStats {
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  followers: number;
  following: number;
}

export interface Highlight {
  id: number;
  title: string;
  thumbnail_data?: string;
  video_data?: string;
  media_type: 'image' | 'video';
  duration: number;
  created_at: string;
  has_media: boolean;
}

export interface UploadForm {
  title: string;
  description: string;
  category: string;
  hashtags: string;
}

export interface HighlightForm {
  title: string;
  mediaType: 'image' | 'video';
}

export interface VideoControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
}

export type TabType = 'photos' | 'saved' | 'tagged';
export type ViewMode = 'grid' | 'list';

export interface RecipeForm {
  title: string;
  category: string;
  description: string;
  ingredients: string[];
  instructions: string;
  time: string;
  servings: number;
  difficulty: string;
}

export const CATEGORIES = [
  'Основные блюда', 
  'Супы', 
  'Салаты', 
  'Десерты', 
  'Закуски', 
  'Напитки', 
  'Выпечка'
];

export const DIFFICULTIES = [
  'Легкая', 
  'Средняя', 
  'Сложная'
];

export const DEFAULT_RECIPE_FORM: RecipeForm = {
  title: '',
  category: 'Основные блюда',
  description: '',
  ingredients: [''],
  instructions: '',
  time: '',
  servings: 2,
  difficulty: 'Средняя'
};

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
