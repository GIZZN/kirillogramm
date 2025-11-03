'use client';

import { useState, useRef, useCallback } from 'react';
import { Highlight, HighlightForm, VideoControls } from '../types';
import { compressImage } from '@/lib/imageCompression';

export function useHighlights(user: { id: number; name: string; email: string; bio?: string; avatarUrl?: string | null } | null) {  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightForm, setHighlightForm] = useState<HighlightForm>({
    title: '',
    mediaType: 'image'
  });
  const [selectedHighlightMedia, setSelectedHighlightMedia] = useState<File | null>(null);
  const [highlightMediaPreview, setHighlightMediaPreview] = useState<string | null>(null);
  const [uploadingHighlight, setUploadingHighlight] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [videoControls, setVideoControls] = useState<VideoControls>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: true,
    volume: 1
  });
  const highlightVideoRef = useRef<HTMLVideoElement>(null);

  const fetchHighlights = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      setLoadingHighlights(true);
      const response = await fetch('/api/highlights', {
        credentials: 'include'
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          setHighlights(data.highlights || []);
        } catch (parseError) {
          console.error('Error parsing highlights:', parseError);
        }
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoadingHighlights(false);
    }
  }, [user]);

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
        video.muted = true; // Важно для автовоспроизведения
        video.playsInline = true;
        
        // Используем более надежный метод
        video.onloadeddata = () => {
          video.currentTime = 0.5; // Берем кадр в 0.5 секунды
        };
        
        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            
            // Устанавливаем размеры с сохранением пропорций
            const maxWidth = 400;
            const maxHeight = 200;
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              ctx.drawImage(video, 0, 0, width, height);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
              setHighlightMediaPreview(thumbnail);
              console.log('Video preview created successfully');
            } else {
              console.error('Failed to get canvas context or invalid video dimensions');
              // Показываем заглушку для видео
              setHighlightMediaPreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7inrY8L3RleHQ+PC9zdmc+');
            }
          } catch (error) {
            console.error('Error creating video preview:', error);
            setHighlightMediaPreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7inrY8L3RleHQ+PC9zdmc+');
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        
        video.onerror = (error) => {
          console.error('Video loading error:', error);
          URL.revokeObjectURL(url);
          // Показываем заглушку при ошибке
          setHighlightMediaPreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7inrY8L3RleHQ+PC9zdmc+');
        };
        
        // Добавляем таймаут на случай если видео не загрузится
        setTimeout(() => {
          if (!video.readyState || video.readyState < 2) {
            console.warn('Video loading timeout');
            URL.revokeObjectURL(url);
            setHighlightMediaPreview('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj7inrY8L3RleHQ+PC9zdmc+');
          }
        }, 5000);
      } else {
        setHighlightForm(prev => ({ ...prev, mediaType: 'image' }));
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
           img.onload = () => {
             // Максимальные размеры для превью (соответствуют CSS)
             const maxWidth = 400;
             const maxHeight = 200;
            
            let width = img.width;
            let height = img.height;
            
            // Вычисляем новые размеры сохраняя пропорции
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }
            
            // Создаем canvas для изменения размера
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const resizedPreview = canvas.toDataURL('image/jpeg', 0.9);
              setHighlightMediaPreview(resizedPreview);
            } else {
              setHighlightMediaPreview(e.target?.result as string);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleHighlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHighlightMedia || !highlightForm.title.trim()) {
      alert('Пожалуйста, заполните все поля и выберите медиа');
      return;
    }

    try {
      setUploadingHighlight(true);
      
      // Сжимаем файл если он слишком большой (>4MB для Vercel Free)
      let fileToUpload = selectedHighlightMedia;
      const maxSize = 4 * 1024 * 1024; // 4MB
      
      if (fileToUpload.size > maxSize) {
        if (highlightForm.mediaType === 'image') {
          // Сжимаем изображение
          fileToUpload = await compressImage(fileToUpload, { maxSizeMB: 4, quality: 0.8 });
        } else {
          alert('Видео слишком большое. Максимальный размер: 4MB. Пожалуйста, сожмите видео перед загрузкой.');
          setUploadingHighlight(false);
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('title', highlightForm.title);
      formData.append('mediaType', highlightForm.mediaType);
      formData.append('media', fileToUpload);

      const response = await fetch('/api/highlights', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setShowHighlightModal(false);
        setHighlightForm({ title: '', mediaType: 'image' });
        setSelectedHighlightMedia(null);
        setHighlightMediaPreview(null);
        fetchHighlights();
      } else {
        try {
          const error = await response.json();
          alert(error.error || 'Ошибка при создании сториса');
        } catch {
          alert('Ошибка сервера при создании сториса');
        }
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
      alert('Ошибка при создании сториса');
    } finally {
      setUploadingHighlight(false);
    }
  };

  const handleStoryClick = async (highlight: Highlight) => {
    try {
      const response = await fetch(`/api/highlights/${highlight.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        try {
          const { highlight: fullHighlight } = await response.json();
          setSelectedHighlight(fullHighlight);
          setShowHighlightViewer(true);
          setVideoControls({
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            isMuted: true,
            volume: 1
          });
        } catch (parseError) {
          console.error('Error parsing highlight:', parseError);
        }
      }
    } catch (error) {
      console.error('Error loading highlight:', error);
    }
  };

  const closeHighlightModal = () => {
    setShowHighlightModal(false);
    setHighlightForm({ title: '', mediaType: 'image' });
    setSelectedHighlightMedia(null);
    setHighlightMediaPreview(null);
  };

  const closeHighlightViewer = () => {
    setShowHighlightViewer(false);
    setSelectedHighlight(null);
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
        setSelectedHighlight(null);
      }
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  return {
    highlights,
    loadingHighlights,
    showHighlightModal,
    highlightForm,
    selectedHighlightMedia,
    highlightMediaPreview,
    uploadingHighlight,
    selectedHighlight,
    showHighlightViewer,
    videoControls,
    highlightVideoRef,
    setShowHighlightModal,
    setHighlightForm,
    setVideoControls,
    fetchHighlights,
    handleHighlightMediaSelect,
    handleHighlightSubmit,
    handleStoryClick,
    closeHighlightModal,
    closeHighlightViewer,
    handleDeleteHighlight
  };
}
