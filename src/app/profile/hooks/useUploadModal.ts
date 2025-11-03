'use client';

import { useState } from 'react';
import { UploadForm } from '../types';

export function useUploadModal() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    title: '',
    description: '',
    category: 'Фото',
    hashtags: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Можно загружать только изображения');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent, onSuccess?: () => void) => {
    e.preventDefault();
    
    if (!selectedImage || !uploadForm.title.trim()) {
      alert('Пожалуйста, заполните все обязательные поля и выберите изображение');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('hashtags', uploadForm.hashtags);
      formData.append('image', selectedImage);

      const response = await fetch('/api/recipes', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        closeUploadModal();
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при загрузке фото');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Ошибка при загрузке фото');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadForm({
      title: '',
      description: '',
      category: 'Фото',
      hashtags: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  return {
    showUploadModal,
    uploadForm,
    selectedImage,
    imagePreview,
    uploading,
    setShowUploadModal,
    setUploadForm,
    handleImageSelect,
    handleUploadSubmit,
    closeUploadModal
  };
}
