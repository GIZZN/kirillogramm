'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import styles from './page.module.css';
import { 
  HiPlus, 
  HiCog6Tooth, 
  HiEllipsisHorizontal, 
  HiCamera,
  HiHeart,
  HiEye,
  HiChatBubbleLeft,
  HiBookmark,
  HiPencil,
  HiTrash,
  HiGlobeAlt,
  HiLockClosed,
  HiXMark,
  HiPhoto,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiPlay,
  HiPause
} from 'react-icons/hi2';
import { MdGridView, MdViewList } from 'react-icons/md';

interface UserPhoto {
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

interface UserStats {
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  followers: number;
  following: number;
}

interface Highlight {
  id: number;
  title: string;
  thumbnail_data?: string;
  video_data?: string;
  media_type: 'image' | 'video';
  duration: number;
  created_at: string;
  has_media: boolean;
}

export default function ProfilePage() {
  const { user, fetchUserData } = useAuth();
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'photos' | 'saved' | 'tagged'>('photos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Фото',
    hashtags: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalPhotos: 0,
    totalLikes: 0,
    totalViews: 0,
    followers: 0,
    following: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [userBio, setUserBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Highlights state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightForm, setHighlightForm] = useState({
    title: '',
    mediaType: 'image' as 'image' | 'video'
  });
  const [selectedHighlightMedia, setSelectedHighlightMedia] = useState<File | null>(null);
  const [highlightMediaPreview, setHighlightMediaPreview] = useState<string | null>(null);
  const [uploadingHighlight, setUploadingHighlight] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoVolume, setVideoVolume] = useState(1);
  const highlightVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (user) {
      fetchUserPhotos();
      fetchUserStats();
      fetchUserBio();
      fetchHighlights();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'saved' && user) {
      fetchSavedPhotos();
    }
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Слушаем события обновления сохраненных фото
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (activeTab === 'saved' && user) {
        fetchSavedPhotos();
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Обновляем статистику при изменении списка фото
  useEffect(() => {
    if (userPhotos.length > 0) {
      setStats(prev => ({
        ...prev,
        totalPhotos: userPhotos.length,
        totalLikes: userPhotos.reduce((sum, photo) => sum + photo.likes_count, 0),
        totalViews: userPhotos.reduce((sum, photo) => sum + photo.views_count, 0)
      }));
    }
  }, [userPhotos]);

  const fetchUserPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Преобразуем рецепты в формат фото
        const photos = data.recipes.map((recipe: {
          id: number;
          title: string;
          description: string;
          likes_count: number;
          views_count: number;
          comments_count: number;
          created_at: string;
          has_image: boolean;
          is_published: boolean;
          category: string;
        }) => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          likes_count: recipe.likes_count || 0,
          views_count: recipe.views_count || 0,
          comments_count: recipe.comments_count || 0,
          created_at: recipe.created_at,
          has_image: recipe.has_image,
          is_published: recipe.is_published,
          category: recipe.category
        }));
        setUserPhotos(photos);
      }
    } catch (error) {
      console.error('Error fetching user photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const [recipesResponse, profileStatsResponse] = await Promise.all([
        fetch('/api/recipes', { credentials: 'include' }),
        fetch('/api/profile/stats', { credentials: 'include' })
      ]);
      
      if (recipesResponse.ok) {
        const data = await recipesResponse.json();
        const photos = data.recipes || [];
        
        const totalPhotos = photos.length;
        const totalLikes = photos.reduce((sum: number, photo: UserPhoto) => sum + photo.likes_count, 0);
        const totalViews = photos.reduce((sum: number, photo: UserPhoto) => sum + photo.views_count, 0);
        
        setStats(prev => ({
          ...prev,
          totalPhotos,
          totalLikes,
          totalViews
        }));
      }

      if (profileStatsResponse.ok) {
        const profileStats = await profileStatsResponse.json();
        setStats(prev => ({
          ...prev,
          followers: profileStats.followers || 0,
          following: profileStats.following || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUserBio = async () => {
    try {
      const response = await fetch('/api/user/bio', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const bio = data.bio || user?.bio || 'Нет информации о себе';
        setUserBio(bio);
        setBioText(bio);
      } else {
        // Если био не найдено, используем данные из контекста или дефолтное
        const defaultBio = user?.bio || '';
        setUserBio(defaultBio);
        setBioText(defaultBio);
      }
    } catch (error) {
      console.error('Error fetching user bio:', error);
      // Используем дефолтное био при ошибке
      const defaultBio = user?.bio || '';
      setUserBio(defaultBio);
      setBioText(defaultBio);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверяем размер файла (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Размер файла не должен превышать 2MB');
        return;
      }

      setAvatarFile(file);
      
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setShowAvatarModal(true);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        await response.json();
        // Обновляем данные пользователя
        await fetchUserData();
        
        // Закрываем модалку
        setShowAvatarModal(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        
        alert('Аватарка обновлена!');
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка загрузки аватарки');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteAvatar = async () => {
    if (!confirm('Удалить аватарку?')) return;

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchUserData();
        alert('Аватарка удалена');
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      alert('Ошибка удаления аватарки');
    }
  };

  const handleSaveBio = async () => {
    try {
      const response = await fetch('/api/user/bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ bio: bioText })
      });

      if (response.ok) {
        setUserBio(bioText);
        setIsEditingBio(false);
      } else {
        console.error('Failed to save bio');
      }
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  const handleCancelBioEdit = () => {
    setBioText(userBio);
    setIsEditingBio(false);
  };

  const fetchSavedPhotos = async () => {
    if (!user) return;
    
    setLoadingSaved(true);
    try {
      const response = await fetch('/api/favorites', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Преобразуем данные избранного в формат UserPhoto
        const photos: UserPhoto[] = data.favorites.map((fav: {
          id: number;
          title: string;
          description: string;
          category: string;
          views_count: number;
          likes_count: number;
          created_at: string;
          has_image: boolean;
          comments_count?: number;
        }) => ({
          id: fav.id,
          title: fav.title,
          description: fav.description || '',
          category: fav.category || 'Фото',
          views_count: fav.views_count || 0,
          likes_count: fav.likes_count || 0,
          comments_count: fav.comments_count || 0,
          created_at: fav.created_at,
          has_image: fav.has_image || false,
          is_published: true
        }));

        setSavedPhotos(photos);
      }
    } catch (error) {
      console.error('Error fetching saved photos:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const filteredPhotos = (() => {
    switch (activeTab) {
      case 'photos':
        return userPhotos;
      case 'saved':
        return savedPhotos;
      case 'tagged':
        return []; // Здесь будут фото с тегами
      default:
        return userPhotos;
    }
  })();

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const response = await fetch(`/api/recipes/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUserPhotos(prev => prev.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleRemoveFromSaved = async (photoId: number) => {
    try {
      const response = await fetch(`/api/favorites?recipeId=${photoId}&recipeType=user_recipe`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSavedPhotos(prev => prev.filter(photo => photo.id !== photoId));
        // Уведомляем другие компоненты об обновлении
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
    }
  };

  const handleTogglePublish = async (photoId: number, isPublished: boolean) => {
    try {
      const endpoint = isPublished ? 'unpublish' : 'publish';
      const response = await fetch(`/api/recipes/${photoId}/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUserPhotos(prev => prev.map(photo => 
          photo.id === photoId 
            ? { ...photo, is_published: !isPublished }
            : photo
        ));
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  // Highlights functions
  const fetchHighlights = async () => {
    try {
      setLoadingHighlights(true);
      const response = await fetch('/api/highlights', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setHighlights(data.highlights || []);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoadingHighlights(false);
    }
  };

  const handleHighlightMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedHighlightMedia(file);
      
      // Автоматически определяем тип медиа
      if (file.type.startsWith('video/')) {
        setHighlightForm(prev => ({ ...prev, mediaType: 'video' }));
        
        // Для видео создаем превью из первого кадра
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.src = url;
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          video.currentTime = 0.1;
        };
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL('image/png');
            setHighlightMediaPreview(thumbnail);
          }
          URL.revokeObjectURL(url);
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setHighlightForm(prev => ({ ...prev, mediaType: 'image' }));
        const reader = new FileReader();
        reader.onload = (e) => {
          setHighlightMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleHighlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHighlightMedia || !highlightForm.title.trim()) return;

    setUploadingHighlight(true);
    try {
      const formData = new FormData();
      formData.append('title', highlightForm.title);
      formData.append('media', selectedHighlightMedia);
      formData.append('mediaType', highlightForm.mediaType);
      
      // Если есть превью (thumbnail для видео), добавляем его
      if (highlightMediaPreview && highlightForm.mediaType === 'video') {
        // Конвертируем base64 в Blob для отправки
        const response = await fetch(highlightMediaPreview);
        const blob = await response.blob();
        formData.append('thumbnail', blob, 'thumbnail.png');
      }

      const response = await fetch('/api/highlights', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        await fetchHighlights(); // Обновляем список highlights
        setShowHighlightModal(false);
        setHighlightForm({ title: '', mediaType: 'image' });
        setSelectedHighlightMedia(null);
        setHighlightMediaPreview(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при создании highlight');
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
      alert('Ошибка при создании highlight');
    } finally {
      setUploadingHighlight(false);
    }
  };

  const handleHighlightClick = async (highlight: Highlight) => {
    try {
      const response = await fetch(`/api/highlights/${highlight.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const { highlight } = await response.json();
        setSelectedHighlight(highlight);
        setShowHighlightViewer(true);
        setIsVideoPlaying(false);
        setVideoCurrentTime(0);
        setVideoDuration(0);
        setIsVideoMuted(true);
        setVideoVolume(1);
      }
    } catch (error) {
      console.error('Error fetching highlight details:', error);
    }
  };

  const toggleVideoPlay = () => {
    if (highlightVideoRef.current) {
      if (isVideoPlaying) {
        highlightVideoRef.current.pause();
      } else {
        highlightVideoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (highlightVideoRef.current) {
      const newTime = parseFloat(e.target.value);
      highlightVideoRef.current.currentTime = newTime;
      setVideoCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideoMute = () => {
    if (highlightVideoRef.current) {
      highlightVideoRef.current.muted = !highlightVideoRef.current.muted;
      setIsVideoMuted(highlightVideoRef.current.muted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVideoVolume(newVolume);
    if (highlightVideoRef.current) {
      highlightVideoRef.current.volume = newVolume;
      if (newVolume === 0) {
        highlightVideoRef.current.muted = true;
        setIsVideoMuted(true);
      } else if (isVideoMuted) {
        highlightVideoRef.current.muted = false;
        setIsVideoMuted(false);
      }
    }
  };

  const handleDeleteHighlight = async (highlightId: number) => {
    if (!confirm('Удалить этот highlight?')) return;
    
    try {
      const response = await fetch(`/api/highlights/${highlightId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setHighlights(prev => prev.filter(h => h.id !== highlightId));
        setShowHighlightViewer(false);
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !uploadForm.title.trim()) return;

    setUploading(true);
    try {
      // Отправляем данные как JSON
      const response = await fetch('/api/recipes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description,
          category: uploadForm.category,
          ingredients: ['Фото'], // Заглушка для совместимости с API
          instructions: 'Фотография', // Заглушка для совместимости с API
          time: '0 мин', // Заглушка
          servings: '1', // Заглушка
          difficulty: 'Легко', // Заглушка
          is_public: true, // Делаем публичным сразу
          is_approved: true, // Автоматически одобряем фото
          hashtags: uploadForm.hashtags.split(' ').filter(tag => tag.trim().length > 0) // Парсим хештеги
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('New recipe created:', responseData); // Для отладки
        
        const newRecipe = responseData.recipe;
        
        // Проверяем, что получили ID
        if (!newRecipe || !newRecipe.id) {
          console.error('No recipe ID received:', responseData);
      return;
    }

        // Загружаем изображение
        if (selectedImage) {
          const imageFormData = new FormData();
          imageFormData.append('image', selectedImage);

          const imageResponse = await fetch(`/api/recipes/${newRecipe.id}/image`, {
            method: 'POST',
            credentials: 'include',
            body: imageFormData,
          });
          
          if (!imageResponse.ok) {
            console.error('Failed to upload image:', imageResponse.statusText);
          }
        }

        // Добавляем новое фото в список сразу
        const newPhoto: UserPhoto = {
          id: newRecipe.id,
          title: uploadForm.title,
          description: uploadForm.description,
          likes_count: 0,
          views_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          has_image: true,
          is_published: true, // Публичный в профиле
          category: uploadForm.category
        };
        
        setUserPhotos(prev => [newPhoto, ...prev]);
        
        // Обновляем статистику
        setStats(prev => ({
          ...prev,
          totalPhotos: prev.totalPhotos + 1
        }));
        
        // Уведомляем другие страницы об обновлении
        window.dispatchEvent(new CustomEvent('recipeAdded', { 
          detail: { recipeId: newRecipe.id } 
        }));
        
        // Закрываем модал и сбрасываем форму
        setShowUploadModal(false);
        resetUploadForm();
    } else {
        console.error('Failed to create photo:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      category: 'Фото',
      hashtags: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    resetUploadForm();
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className={styles.profilePage}>
        <div className={styles.container}>
          {/* Profile Header */}
          <header className={styles.profileHeader}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>
                {user.avatarUrl ? (
                  <Image 
                    src={user.avatarUrl} 
                    alt={`Аватар ${user.name}`}
                    width={150}
                    height={150}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <HiCamera size={40} />
                  </div>
                )}
                <button 
                  className={styles.avatarEditButton}
                  title="Изменить фото профиля"
                  onClick={() => document.getElementById('avatarInput')?.click()}
                >
                  <HiCamera size={20} />
                </button>
                {user.avatarUrl && (
                  <button 
                    className={styles.avatarDeleteButton}
                    title="Удалить аватар"
                    onClick={deleteAvatar}
                  >
                    <HiTrash size={16} />
                  </button>
                )}
              </div>
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileActions}>
                <h1 className={styles.username}>@{user.name?.toLowerCase().replace(/\s+/g, '_')}</h1>
                <div className={styles.actionButtons}>
                  <button className={styles.settingsButton}>
                    <HiCog6Tooth />
                  </button>
                  <button className={styles.menuButton}>
                    <HiEllipsisHorizontal />
                </button>
                </div>
              </div>

              <div className={styles.stats}>
                {loadingStats ? (
                  <>
                    <div className={styles.statItemSkeleton}>
                      <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
                      <div className={`${styles.skeleton} ${styles.statLabelSkeleton}`}></div>
                    </div>
                    <div className={styles.statItemSkeleton}>
                      <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
                      <div className={`${styles.skeleton} ${styles.statLabelSkeleton}`}></div>
                    </div>
                    <div className={styles.statItemSkeleton}>
                      <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
                      <div className={`${styles.skeleton} ${styles.statLabelSkeleton}`}></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>{stats.totalPhotos}</span>
                      <span className={styles.statLabel}>публикаций</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>{stats.followers}</span>
                      <span className={styles.statLabel}>подписчиков</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber}>{stats.following}</span>
                      <span className={styles.statLabel}>подписок</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className={styles.bio}>
                <h2 className={styles.displayName}>{user.name}</h2>
                {isEditingBio ? (
                  <div className={styles.bioEditContainer}>
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className={styles.bioTextarea}
                      placeholder="Расскажите о себе..."
                      maxLength={150}
                      rows={3}
                    />
                    <div className={styles.bioEditActions}>
                      <button 
                        className={styles.bioSaveButton}
                        onClick={handleSaveBio}
                      >
                        Сохранить
                      </button>
                      <button 
                        className={styles.bioCancelButton}
                        onClick={handleCancelBioEdit}
                      >
                        Отмена
                      </button>
                    </div>
                    <div className={styles.bioCharCount}>
                      {bioText.length}/150
                    </div>
                  </div>
                ) : (
                  <div className={styles.bioDisplay}>
                    <p className={styles.bioText}>
                      {userBio.split('\n').map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < userBio.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                    <button 
                      className={styles.bioEditButton}
                      onClick={() => setIsEditingBio(true)}
                    >
                      <HiPencil />
                      Редактировать
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Highlights */}
          <div className={styles.highlights}>
            <div 
              className={styles.highlight}
              onClick={() => setShowHighlightModal(true)}
            >
              <div className={styles.highlightCircle}>
                <HiPlus />
              </div>
              <span className={styles.highlightLabel}>Новое</span>
            </div>
            
            {loadingHighlights ? (
              [...Array(3)].map((_, index) => (
                <div key={index} className={styles.highlightSkeleton}>
                  <div className={`${styles.skeleton} ${styles.highlightCircleSkeleton}`}></div>
                  <div className={`${styles.skeleton} ${styles.highlightLabelSkeleton}`}></div>
                </div>
              ))
            ) : (
              highlights.map(highlight => (
                <div 
                  key={highlight.id}
                  className={styles.highlight}
                  onClick={() => handleHighlightClick(highlight)}
                >
                  <div className={styles.highlightCircle}>
                    {highlight.has_media && highlight.thumbnail_data ? (
                      <>
                        <Image 
                          src={highlight.thumbnail_data}
                          alt={highlight.title}
                          width={77}
                          height={77}
                          className={styles.highlightImage}
                        />
                        {highlight.media_type === 'video' && (
                          <div className={styles.videoIndicator}>
                            <div className={styles.playIcon}>▶</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <HiPhoto />
                    )}
                  </div>
                  <span className={styles.highlightLabel}>{highlight.title}</span>
                </div>
              ))
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className={styles.tabsNav}>
            <div className={styles.tabs}>
                    <button 
                className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`}
                onClick={() => setActiveTab('photos')}
                    >
                <MdGridView />
                <span>ПУБЛИКАЦИИ</span>
                    </button>
                    <button 
                className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
                onClick={() => setActiveTab('saved')}
                    >
                <HiBookmark />
                <span>СОХРАНЕННОЕ</span>
                    </button>
                    <button 
                className={`${styles.tab} ${activeTab === 'tagged' ? styles.active : ''}`}
                onClick={() => setActiveTab('tagged')}
                    >
                <HiCamera />
                <span>ОТМЕТКИ</span>
                    </button>
                  </div>

            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
                title="Сетка"
              >
                <MdGridView />
              </button>
                    <button 
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                title="Список"
              >
                <MdViewList />
                    </button>
            </div>
          </nav>

          {/* Content */}
          <main className={styles.content}>
            {(loading && activeTab === 'photos') || (loadingSaved && activeTab === 'saved') ? (
              <div className={styles.photosGrid}>
                {[...Array(6)].map((_, index) => (
                  <div key={index} className={styles.photoSkeleton}>
                    <div className={`${styles.skeleton} ${styles.photoImageSkeleton}`}></div>
                    {viewMode === 'list' && (
                      <div className={styles.photoSkeletonInfo}>
                        <div className={`${styles.skeleton} ${styles.photoTitleSkeleton}`}></div>
                        <div className={`${styles.skeleton} ${styles.photoDescSkeleton}`}></div>
                        <div className={styles.photoMetaSkeleton}>
                          <div className={`${styles.skeleton} ${styles.photoStatSkeleton}`}></div>
                          <div className={`${styles.skeleton} ${styles.photoStatSkeleton}`}></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : filteredPhotos.length > 0 ? (
              <div className={`${styles.photosGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className={styles.photoCard}>
                    <div className={styles.photoContainer}>
                      {photo.has_image ? (
                        <Image
                          src={`/api/recipes/${photo.id}/image`}
                          alt={photo.title}
                          width={300}
                          height={300}
                          className={styles.photoImage}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <HiCamera size={48} />
                        </div>
                      )}
                      
                      <div className={styles.photoOverlay}>
                        <div className={styles.photoStats}>
                          <div className={styles.overlayStatItem}>
                            <HiHeart />
                            <span>{photo.likes_count}</span>
                          </div>
                          <div className={styles.overlayStatItem}>
                            <HiChatBubbleLeft />
                            <span>{photo.comments_count}</span>
                          </div>
                        </div>
                        
                        <div className={styles.photoActions}>
                          {activeTab === 'photos' ? (
                            <>
                              <button 
                                className={styles.actionButton}
                                onClick={() => handleTogglePublish(photo.id, photo.is_published)}
                                title={photo.is_published ? "Скрыть" : "Опубликовать"}
                              >
                                {photo.is_published ? <HiGlobeAlt /> : <HiLockClosed />}
                              </button>
                              <button 
                                className={styles.actionButton}
                                onClick={() => {/* Edit functionality */}}
                                title="Редактировать"
                              >
                                <HiPencil />
                              </button>
                              <button 
                                className={styles.deleteButton}
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="Удалить"
                              >
                                <HiTrash />
                              </button>
                            </>
                          ) : activeTab === 'saved' ? (
                            <button 
                              className={styles.deleteButton}
                              onClick={() => handleRemoveFromSaved(photo.id)}
                              title="Удалить из сохраненных"
                            >
                              <HiBookmark />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {!photo.is_published && (
                        <div className={styles.privateIndicator}>
                          <HiLockClosed />
                        </div>
                      )}
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className={styles.photoInfo}>
                        <h3 className={styles.photoTitle}>{photo.title}</h3>
                        <p className={styles.photoDescription}>{photo.description}</p>
                        <div className={styles.photoMeta}>
                          <span className={styles.photoDate}>
                            {new Date(photo.created_at).toLocaleDateString('ru-RU')}
                          </span>
                          <div className={styles.photoStatsInline}>
                            <span><HiHeart /> {photo.likes_count}</span>
                            <span><HiEye /> {photo.views_count}</span>
                            <span><HiChatBubbleLeft /> {photo.comments_count}</span>
                          </div>
                </div>
              </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                {activeTab === 'photos' ? (
                  <>
                    <div className={styles.emptyIcon}>
                      <HiCamera size={64} />
                    </div>
                    <h3 className={styles.emptyTitle}>Поделитесь фотографиями</h3>
                    <p className={styles.emptyText}>
                      Когда вы поделитесь фотографиями, они появятся в вашем профиле.
                    </p>
                    <button 
                      className={styles.uploadButton}
                      onClick={() => setShowUploadModal(true)}
                    >
                      Поделиться первой фотографией
                    </button>
                  </>
                ) : activeTab === 'saved' ? (
                  <>
                    <div className={styles.emptyIcon}>
                      <HiBookmark size={64} />
                    </div>
                    <h3 className={styles.emptyTitle}>Нет сохраненных фото</h3>
                    <p className={styles.emptyText}>
                      Сохраняйте понравившиеся фото, чтобы легко находить их позже.
                    </p>
                  </>
                ) : (
                  <>
                    <div className={styles.emptyIcon}>
                      <HiEye size={64} />
                    </div>
                    <h3 className={styles.emptyTitle}>Нет отмеченных фото</h3>
                    <p className={styles.emptyText}>
                      Фото, где вас отметили, появятся здесь.
                    </p>
                  </>
                )}
              </div>
            )}
          </main>

          {/* Floating Add Button */}
          <button 
            className={styles.floatingAddButton}
            onClick={() => setShowUploadModal(true)}
            title="Добавить фото"
          >
            <HiPlus />
          </button>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className={styles.modalOverlay} onClick={handleCloseModal}>
              <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>Новая публикация</h2>
                  <button 
                    className={styles.closeButton}
                    onClick={handleCloseModal}
                  >
                    <HiXMark />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className={styles.uploadForm}>
                  {/* Image Upload */}
                  <div className={styles.imageUploadSection}>
                    {imagePreview ? (
                      <div className={styles.imagePreview}>
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={400}
                          height={400}
                          className={styles.previewImage}
                        />
                        <button
                          type="button"
                          className={styles.changeImageButton}
                          onClick={() => document.getElementById('imageInput')?.click()}
                        >
                          <HiPhoto />
                          Изменить фото
                        </button>
              </div>
            ) : (
                      <div 
                        className={styles.imageUploadArea}
                        onClick={() => document.getElementById('imageInput')?.click()}
                      >
                        <HiCamera size={48} />
                        <p>Нажмите, чтобы выбрать фото</p>
                        <span>или перетащите файл сюда</span>
                      </div>
                    )}
                    <input
                      id="imageInput"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className={styles.hiddenInput}
                    />
                  </div>

                  {/* Form Fields */}
                  <div className={styles.formFields}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Название</label>
                      <input
                        type="text"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        className={styles.input}
                        placeholder="Добавьте название..."
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Описание</label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        className={styles.textarea}
                        placeholder="Напишите описание..."
                        rows={3}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Категория</label>
                      <select
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                        className={styles.select}
                      >
                        <option value="Фото">Фото</option>
                        <option value="Природа">Природа</option>
                        <option value="Портрет">Портрет</option>
                        <option value="Архитектура">Архитектура</option>
                        <option value="Еда">Еда</option>
                        <option value="Путешествия">Путешествия</option>
                        <option value="Другое">Другое</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Хештеги</label>
                      <input
                        type="text"
                        value={uploadForm.hashtags}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, hashtags: e.target.value }))}
                        className={styles.input}
                        placeholder="#природа #фотография #красота"
                      />
                      <span className={styles.hashtagHint}>
                        Разделяйте хештеги пробелами. Символ # добавится автоматически.
                      </span>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCloseModal}
                    >
                      Отмена
                    </button>
                  <button 
                      type="submit"
                      className={styles.submitButton}
                      disabled={!selectedImage || !uploadForm.title.trim() || uploading}
                  >
                      {uploading ? (
                        <>
                          <div className={styles.buttonSpinner}></div>
                          Загружаем...
                        </>
                      ) : 'Опубликовать'}
                  </button>
                  </div>
                </form>
                </div>
              </div>
            )}

            {/* Avatar Upload Modal */}
            {showAvatarModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.avatarModal}>
                  <div className={styles.modalHeader}>
                    <h3>Изменить фото профиля</h3>
                    <button 
                      className={styles.closeButton}
                      onClick={() => {
                        setShowAvatarModal(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      <HiXMark size={24} />
                    </button>
                  </div>
                  
                  <div className={styles.avatarPreviewSection}>
                    {avatarPreview && (
                      <div className={styles.avatarPreview}>
                        <Image 
                          src={avatarPreview} 
                          alt="Превью аватара"
                          width={200}
                          height={200}
                          className={styles.avatarPreviewImage}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.modalActions}>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => {
                        setShowAvatarModal(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Отмена
                    </button>
                    <button 
                      className={styles.uploadButton}
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar || !avatarFile}
                    >
                      {uploadingAvatar ? (
                        <>
                          <div className={styles.buttonSpinner}></div>
                          Загрузка...
                        </>
                      ) : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </div>
            )}

        {/* Highlight Upload Modal */}
        {showHighlightModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalCard}>
                <div className={styles.modalHeader}>
                  <h2>Добавить Highlight</h2>
                  <button 
                    className={styles.modalCloseButton}
                    onClick={() => {
                      setShowHighlightModal(false);
                      setHighlightForm({ title: '', mediaType: 'image' });
                      setSelectedHighlightMedia(null);
                      setHighlightMediaPreview(null);
                    }}
                  >
                    <HiXMark />
                  </button>
                </div>

                <form id="highlightForm" onSubmit={handleHighlightSubmit} className={styles.highlightForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="highlightTitle">Название</label>
                  <input
                    id="highlightTitle"
                    type="text"
                    value={highlightForm.title}
                    onChange={(e) => setHighlightForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Введите название highlight"
                    className={styles.input}
                    required
                    maxLength={50}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Тип медиа</label>
                  <div className={styles.mediaTypeSelector}>
                    <button
                      type="button"
                      className={`${styles.mediaTypeButton} ${highlightForm.mediaType === 'image' ? styles.active : ''}`}
                      onClick={() => setHighlightForm(prev => ({ ...prev, mediaType: 'image' }))}
                    >
                      <HiPhoto />
                      Изображение
                    </button>
                    <button
                      type="button"
                      className={`${styles.mediaTypeButton} ${highlightForm.mediaType === 'video' ? styles.active : ''}`}
                      onClick={() => setHighlightForm(prev => ({ ...prev, mediaType: 'video' }))}
                    >
                      📹
                      Видео
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    {highlightForm.mediaType === 'video' ? 'Видео файл' : 'Изображение'}
                  </label>
                  <div 
                    className={styles.fileUploadArea}
                    onClick={() => document.getElementById('highlightMedia')?.click()}
                  >
                    <div className={styles.fileUploadIcon}>
                      {highlightForm.mediaType === 'video' ? '🎥' : '📸'}
                    </div>
                    <div className={styles.fileUploadText}>
                      {selectedHighlightMedia 
                        ? selectedHighlightMedia.name
                        : `Выберите ${highlightForm.mediaType === 'video' ? 'видео' : 'изображение'}`
                      }
                    </div>
                    <div className={styles.fileUploadHint}>
                      Нажмите для выбора файла
                    </div>
                  </div>
                  <input
                    id="highlightMedia"
                    type="file"
                    accept={highlightForm.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleHighlightMediaSelect}
                    style={{ display: 'none' }}
                    required
                  />
                  <p className={styles.fileNote}>
                    {highlightForm.mediaType === 'video' 
                      ? 'Максимальный размер: 50MB. Поддерживаемые форматы: MP4, WebM, MOV'
                      : 'Максимальный размер: 10MB. Поддерживаемые форматы: JPG, PNG, GIF'
                    }
                  </p>
                </div>

                {highlightMediaPreview && (
                  <div className={styles.mediaPreview}>
                    {highlightForm.mediaType === 'video' ? (
                      <div className={styles.videoPreviewContainer}>
                        <Image
                          src={highlightMediaPreview}
                          alt="Video preview"
                          width={200}
                          height={200}
                          className={styles.previewImage}
                        />
                        <div className={styles.playButtonOverlay}>
                          <div className={styles.playIcon}>▶</div>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={highlightMediaPreview}
                        alt="Preview"
                        width={400}
                        height={300}
                        className={styles.previewImage}
                      />
                    )}
                  </div>
                )}
              </form>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowHighlightModal(false);
                    setHighlightForm({ title: '', mediaType: 'image' });
                    setSelectedHighlightMedia(null);
                    setHighlightMediaPreview(null);
                  }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  form="highlightForm"
                  className={styles.submitButton}
                  disabled={uploadingHighlight || !selectedHighlightMedia || !highlightForm.title.trim()}
                >
                  {uploadingHighlight ? (
                    <>
                      <div className={styles.buttonSpinner}></div>
                      Загрузка...
                    </>
                  ) : 'Создать'}
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Highlight Viewer Modal */}
        {showHighlightViewer && selectedHighlight && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContentCircle}>
              <button 
                className={styles.modalCloseButtonCircle}
                onClick={() => {
                  setShowHighlightViewer(false);
                  setSelectedHighlight(null);
                }}
              >
                <HiXMark />
              </button>

              {selectedHighlight.media_type === 'video' ? (
                <>
                  <div className={styles.highlightViewerCircle}>
                    {selectedHighlight.video_data && (
                      <video
                        ref={highlightVideoRef}
                        src={selectedHighlight.video_data}
                        className={styles.highlightVideoCircle}
                        loop
                        onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
                        onLoadedMetadata={(e) => {
                          setVideoDuration(e.currentTarget.duration);
                          e.currentTarget.volume = videoVolume;
                        }}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        onEnded={() => setIsVideoPlaying(false)}
                      />
                    )}
                  </div>

                  <div className={styles.videoControlsContainer}>
                    <div className={styles.videoControls}>
                      <button 
                        className={styles.playPauseButton}
                        onClick={toggleVideoPlay}
                        title={isVideoPlaying ? 'Пауза' : 'Воспроизвести'}
                      >
                        {isVideoPlaying ? <HiPause /> : <HiPlay />}
                      </button>

                      <div className={styles.seekBarContainer}>
                        <div className={styles.timeInfoContainer}>
                          <span className={styles.currentTime}>
                            {formatTime(videoCurrentTime)}
                          </span>
                          <span className={styles.totalTime}>
                            {formatTime(videoDuration)}
                          </span>
                        </div>
                        <div className={styles.seekBarWrapper}>
                          <input
                            type="range"
                            min="0"
                            max={videoDuration || 100}
                            value={videoCurrentTime}
                            onChange={handleSeek}
                            className={styles.seekBar}
                          />
                        </div>
                      </div>

                      <div className={styles.volumeControls}>
                        <button 
                          className={styles.muteButton}
                          onClick={toggleVideoMute}
                          title={isVideoMuted ? 'Включить звук' : 'Выключить звук'}
                        >
                          {isVideoMuted || videoVolume === 0 ? (
                            <HiSpeakerXMark />
                          ) : (
                            <HiSpeakerWave />
                          )}
                        </button>
                        
                        <div className={styles.volumeSliderContainer}>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isVideoMuted ? 0 : videoVolume}
                            onChange={handleVolumeChange}
                            className={styles.volumeSlider}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.highlightViewerCircle}>
                  {selectedHighlight.thumbnail_data && (
                    <Image
                      src={selectedHighlight.thumbnail_data}
                      alt={selectedHighlight.title}
                      width={500}
                      height={500}
                      className={styles.highlightImageCircle}
                    />
                  )}
                </div>
              )}

              <div className={styles.highlightViewerActions}>
                <button 
                  className={styles.deleteButtonCircle}
                  onClick={() => handleDeleteHighlight(selectedHighlight.id)}
                  title="Удалить highlight"
                >
                  <HiTrash />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}