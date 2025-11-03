'use client';

import { useState, useCallback } from 'react';

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
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);

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
      } else {
        alert('Ошибка при загрузке аватара');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка при загрузке аватара');
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
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
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
