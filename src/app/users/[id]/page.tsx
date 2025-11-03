'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';
import styles from './page.module.css';

// Types
import { TabType, ViewMode } from './types';

// Hooks
import { useUserProfile, useFollowStatus, useHighlights } from './hooks';

// Components
import {
  ProfileLoadingState,
  ProfileHeader,
  HighlightsSection,
  ProfileTabs,
  PhotosGrid,
  HighlightViewer
} from './components';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Custom hooks
  const { profileData, loading, error } = useUserProfile(userId);
  
  const {
    isFollowing,
    followersCount,
    followingCount,
    followingLoading,
    handleFollow
  } = useFollowStatus(userId, profileData?.user?.stats?.following);

  const {
    highlights,
    loadingHighlights,
    selectedHighlight,
    showHighlightViewer,
    videoControls,
    setVideoControls,
    handleStoryClick,
    closeHighlightViewer
  } = useHighlights(userId);


  // Handler functions
  const handleSendMessage = async () => {
    if (!profileData?.user) return;
    
    try {
      // Создаем или получаем чат с пользователем
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          participantId: profileData.user.id,
          name: profileData.user.name
        })
      });

      if (response.ok) {
        const data = await response.json() as { message: string; chatId: number };
        // Переходим на страницу сообщений с открытым чатом
        window.location.href = `/messages?chat=${data.chatId}`;
      } else {
        // Если чат уже существует, просто переходим к сообщениям
        window.location.href = `/messages`;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // В случае ошибки просто переходим на страницу сообщений
      window.location.href = `/messages`;
    }
  };

  // Loading state
  if (loading) {
    return <ProfileLoadingState />;
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2>Ошибка</h2>
            <p>{error || 'Профиль не найден'}</p>
            <Link href="/recipes" className={styles.backButton}>
              <HiArrowLeft />
              Вернуться к ленте
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, recipes } = profileData;
  const userPhotos = recipes; // Переименовываем для консистентности

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Back Button */}
        <div className={styles.backButtonContainer}>
          <Link href="/recipes" className={styles.backButton}>
            <HiArrowLeft />
            Назад
          </Link>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          user={user}
          followersCount={followersCount}
          followingCount={followingCount}
          isFollowing={isFollowing}
          followingLoading={followingLoading}
          onFollow={handleFollow}
          onSendMessage={handleSendMessage}
        />

        {/* Highlights */}
        <HighlightsSection
          highlights={highlights}
          loadingHighlights={loadingHighlights}
          onStoryClick={handleStoryClick}
        />

        {/* Navigation Tabs */}
        <ProfileTabs
          activeTab={activeTab}
          viewMode={viewMode}
          onTabChange={setActiveTab}
          onViewModeChange={setViewMode}
        />

        {/* Tab Content */}
        <div className={styles.tabContent}>
          <PhotosGrid
            photos={activeTab === 'photos' ? userPhotos : []}
            activeTab={activeTab}
            viewMode={viewMode}
            loading={false}
          />
        </div>

        {/* Highlight Viewer Modal */}
        {showHighlightViewer && selectedHighlight && (
          <HighlightViewer
            highlight={selectedHighlight}
            videoControls={videoControls}
            onClose={closeHighlightViewer}
            onVideoControlsChange={(controls) => 
              setVideoControls(prev => ({ ...prev, ...controls }))
            }
          />
        )}
      </div>
    </div>
  );
}