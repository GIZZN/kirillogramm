'use client';

import { useState, useCallback } from 'react';
import { ensureFileSize } from '@/lib/imageCompression';

export function useProfileManager(user: { id: number; name: string; email: string; bio?: string; avatarUrl?: string | null } | null, fetchUserData: () => void) {
  const [userBio, setUserBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchUserBio = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      const response = await fetch('/api/user/bio', {
        credentials: 'include'
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          const bio = data.bio || user?.bio || 'Нет информации о себе';
          setUserBio(bio);
          setBioText(bio);
        } catch (parseError) {
          console.error('Error parsing user bio:', parseError);
          const fallbackBio = user?.bio || '';
          setUserBio(fallbackBio);
          setBioText(fallbackBio);
        }
      } else {
        // Если био не найдено, используем данные из контекста или дефолтное
        const defaultBio = user?.bio || '';
        setUserBio(defaultBio);
        setBioText(defaultBio);
      }
    } catch (error) {
      console.error('Error fetching user bio:', error);
      // В случае ошибки используем данные из контекста
      const fallbackBio = user?.bio || '';
      setUserBio(fallbackBio);
      setBioText(fallbackBio);
    }
  }, [user]);

  const handleBioSave = useCallback(async () => {
    try {
      const response = await fetch('/api/user/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ bio: bioText })
      });

      if (response.ok) {
        setUserBio(bioText);
        setIsEditingBio(false);
        fetchUserData();
      } else {
        alert('Ошибка при сохранении биографии');
      }
    } catch (error) {
      console.error('Error saving bio:', error);
      alert('Ошибка при сохранении биографии');
    }
  }, [bioText, fetchUserData]);

  const handleAvatarSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
        setShowAvatarModal(true); // Открываем модальное окно для подтверждения
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      
      // Сжимаем файл если он слишком большой
      let compressedFile;
      try {
        compressedFile = await ensureFileSize(avatarFile, 4);
        console.log('Compressed file size:', compressedFile.size / (1024 * 1024), 'MB');
      } catch (compressionError) {
        console.error('Compression error:', compressionError);
        alert('Не удалось обработать изображение. Попробуйте другой файл.');
        setUploadingAvatar(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('avatar', compressedFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setShowAvatarModal(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        fetchUserData();
        alert('Аватар успешно обновлен!');
      } else {
        try {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          alert(`Ошибка: ${errorData.error || 'Не удалось загрузить аватар'}`);
        } catch {
          alert('Ошибка сервера при загрузке аватара');
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Ошибка при загрузке аватара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setUploadingAvatar(false);
    }
  }, [avatarFile, fetchUserData]);

  const handleAvatarDelete = useCallback(async () => {
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
        try {
          const errorData = await response.json();
          alert(`Ошибка: ${errorData.error || 'Не удалось удалить аватар'}`);
        } catch {
          alert('Ошибка сервера при удалении аватара');
        }
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      alert('Ошибка удаления аватарки');
    }
  }, [fetchUserData]);

  const closeAvatarModal = useCallback(() => {
    setShowAvatarModal(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  }, []);

  return {
    userBio,
    isEditingBio,
    bioText,
    showAvatarModal,
    avatarFile,
    avatarPreview,
    uploadingAvatar,
    setIsEditingBio,
    setBioText,
    setShowAvatarModal,
    fetchUserBio,
    handleBioSave,
    handleAvatarSelect,
    handleAvatarUpload,
    handleAvatarDelete,
    closeAvatarModal
  };
}
