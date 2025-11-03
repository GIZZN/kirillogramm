export interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
  bio?: string;
  avatarUrl?: string | null;
  stats: {
    totalRecipes: number;
    totalLikes: number;
    totalViews: number;
    following?: number;
  };
}

export interface UserPhoto {
  id: number;
  title: string;
  category: string;
  description: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  has_image: boolean;
}

export interface Highlight {
  id: number;
  title: string;
  thumbnail_data?: string;
  video_data?: string;
  media_type: 'image' | 'video';
  has_media: boolean;
  duration?: number;
}

export interface UserProfileData {
  user: UserProfile;
  recipes: UserPhoto[];
}

export type TabType = 'photos' | 'saved' | 'tagged';
export type ViewMode = 'grid' | 'list';

export interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
}

export interface VideoControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
}
