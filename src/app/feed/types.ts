import React from 'react';

export interface PublicRecipe {
  id: number;
  title: string;
  category: string;
  description: string;
  ingredients: string[];
  instructions: string;
  time: string;
  servings: number;
  difficulty: string;
  likes_count: number;
  comments_count?: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  has_image: boolean;
  hashtags?: string[];
}

export interface Comment {
  id: number;
  content: string;
  parent_id?: number;
  likes_count: number;
  created_at: string;
  author_id: number;
  author_name: string;
  author_email: string;
  author_avatar?: string;
  is_liked_by_user?: boolean;
  replies?: Comment[];
}

export const RECIPE_CATEGORIES = [
  'Все',
  'Основные блюда',
  'Супы', 
  'Салаты',
  'Десерты',
  'Закуски',
  'Напитки',
  'Выпечка'
];

export interface CategoryIconMap {
  [key: string]: React.ReactElement;
}

export interface RecipeFiltersState {
  activeFilter: string;
  searchQuery: string;
}

export interface RecipeModalState {
  selectedRecipe: PublicRecipe | null;
  showRecipeModal: boolean;
}

export interface Highlight {
  id: number;
  title: string;
  thumbnail_data?: string;
  video_data?: string;
  media_type: 'image' | 'video';
  has_media: boolean;
  duration?: number;
  user_id?: number;
  author_name?: string;
}

export interface VideoControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
}

export interface SearchState {
  searchQuery: string;
  selectedPostForComments: number | null;
}
