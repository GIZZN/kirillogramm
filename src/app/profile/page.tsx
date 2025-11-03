'use client';

import { useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import styles from './page.module.css';

// Types
import { TabType, ViewMode, UserPhoto, UploadForm } from './types';

// Hooks
import { 
  useProfileData, 
  useProfileManager, 
  useHighlights, 
  useUploadModal 
} from './hooks';

// Components
import {
  ProfileManager,
  ProfileTabs,
  PhotosGrid,
  HighlightsSection,
  UploadModal,
  HighlightViewer,
  HighlightModal
} from './components';

export default function ProfilePage() {
  const { user, fetchUserData } = useAuth();
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Custom hooks
  const {
    userPhotos,
    savedPhotos,
    loading,
    loadingSaved,
    stats,
    loadingStats,
    fetchUserPhotos,
    fetchSavedPhotos,
    fetchUserStats
  } = useProfileData(user);

  const {
    userBio,
    isEditingBio,
    bioText,
    showAvatarModal,
    avatarPreview,
    uploadingAvatar,
    setIsEditingBio,
    setBioText,
    fetchUserBio,
    handleBioSave,
    handleAvatarSelect,
    handleAvatarUpload,
    handleAvatarDelete,
    closeAvatarModal
  } = useProfileManager(user, fetchUserData);

  const {
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
  } = useHighlights(user);

  const {
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
  } = useUploadModal();

  // Effects
  useEffect(() => {
    if (user && user.id) {
      fetchUserPhotos();
      fetchUserStats();
      fetchUserBio();
      fetchHighlights();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'saved' && user && user.id) {
      fetchSavedPhotos();
    }
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for favorites updates
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

  // Handler functions
  const handleEditBio = () => {
    setBioText(userBio);
    setIsEditingBio(true);
  };

  const handleBioCancel = () => {
    setBioText(userBio);
    setIsEditingBio(false);
  };

  const handleUploadFormChange = (field: keyof UploadForm, value: string) => {
    setUploadForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadSuccess = () => {
    fetchUserPhotos();
    fetchUserStats();
  };

  const handlePhotoEdit = (photo: UserPhoto) => {
    // TODO: Implement photo editing
    console.log('Edit photo:', photo);
  };

  const handlePhotoDelete = async (photoId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту фотографию?')) {
      return;
    }
    try {
      const response = await fetch(`/api/recipes/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Фотография успешно удалена!');
        fetchUserPhotos(); // Обновляем список фото
        fetchUserStats(); // Обновляем статистику
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка при удалении фотографии');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Ошибка при удалении фотографии');
    }
  };

  const handlePhotoTogglePublish = async (photoId: number, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/recipes/${photoId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ is_published: !isPublished }),
      });

      if (response.ok) {
        alert(`Фотография ${!isPublished ? 'опубликована' : 'скрыта'}!`);
        fetchUserPhotos(); // Обновляем список фото
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка при изменении статуса публикации');
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Ошибка при изменении статуса публикации');
    }
  };

  const handleHighlightFormChange = (field: keyof typeof highlightForm, value: string) => {
    setHighlightForm(prev => ({ ...prev, [field]: value }));
  };

  // Get current photos based on active tab
  const getCurrentPhotos = () => {
    switch (activeTab) {
      case 'saved':
        return savedPhotos;
      case 'photos':
        return userPhotos;
      default:
        return [];
    }
  };

  return (
    <ProtectedRoute>
      <div className={styles.profilePage}>
        <div className={styles.container}>
          {/* Profile Manager */}
          <ProfileManager
            user={user}
            stats={stats}
            loadingStats={loadingStats}
            userBio={userBio}
            isEditingBio={isEditingBio}
            bioText={bioText}
            showAvatarModal={showAvatarModal}
            avatarPreview={avatarPreview}
            uploadingAvatar={uploadingAvatar}
            onEditBio={handleEditBio}
            onBioChange={setBioText}
            onBioSave={handleBioSave}
            onBioCancel={handleBioCancel}
            onAvatarSelect={handleAvatarSelect}
            onAvatarUpload={handleAvatarUpload}
            onAvatarDelete={handleAvatarDelete}
            onAvatarModalClose={closeAvatarModal}
          />

          {/* Highlights Section */}
          <HighlightsSection
            highlights={highlights}
            loadingHighlights={loadingHighlights}
            onStoryClick={handleStoryClick}
            onAddHighlight={() => setShowHighlightModal(true)}
          />

          {/* Navigation Tabs */}
          <ProfileTabs
            activeTab={activeTab}
            viewMode={viewMode}
            onTabChange={setActiveTab}
            onViewModeChange={setViewMode}
          />

          {/* Content */}
          <main className={styles.content}>
            <PhotosGrid
              photos={getCurrentPhotos()}
              activeTab={activeTab}
              viewMode={viewMode}
              loading={loading}
              loadingSaved={loadingSaved}
              onPhotoEdit={handlePhotoEdit}
              onPhotoDelete={handlePhotoDelete}
              onPhotoTogglePublish={handlePhotoTogglePublish}
            />
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
          <UploadModal
            showUploadModal={showUploadModal}
            uploadForm={uploadForm}
            selectedImage={selectedImage}
            imagePreview={imagePreview}
            uploading={uploading}
            onClose={closeUploadModal}
            onSubmit={(e) => handleUploadSubmit(e, handleUploadSuccess)}
            onFormChange={handleUploadFormChange}
            onImageSelect={handleImageSelect}
          />

          {/* Highlight Modal */}
          <HighlightModal
            showHighlightModal={showHighlightModal}
            highlightForm={highlightForm}
            selectedHighlightMedia={selectedHighlightMedia}
            highlightMediaPreview={highlightMediaPreview}
            uploadingHighlight={uploadingHighlight}
            onClose={closeHighlightModal}
            onSubmit={handleHighlightSubmit}
            onFormChange={handleHighlightFormChange}
            onMediaSelect={handleHighlightMediaSelect}
          />

          {/* Highlight Viewer */}
          {selectedHighlight && (
            <HighlightViewer
              highlight={selectedHighlight}
              showHighlightViewer={showHighlightViewer}
              videoControls={videoControls}
              highlightVideoRef={highlightVideoRef}
              onClose={closeHighlightViewer}
              onVideoControlsChange={(controls) => 
                setVideoControls(prev => ({ ...prev, ...controls }))
              }
              onDeleteHighlight={handleDeleteHighlight}
            />  
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
