'use client';

import React from 'react';
import Image from 'next/image';
import { HiCamera, HiPencil, HiXMark, HiCog6Tooth, HiEllipsisHorizontal, HiTrash } from 'react-icons/hi2';
import { User, UserStats } from '../../types';
import styles from '../../page.module.css';

interface ProfileManagerProps {
  user: User | null;
  stats: UserStats;
  loadingStats: boolean;
  userBio: string;
  isEditingBio: boolean;
  bioText: string;
  showAvatarModal: boolean;
  avatarPreview: string | null;
  uploadingAvatar: boolean;
  onEditBio: () => void;
  onBioChange: (text: string) => void;
  onBioSave: () => void;
  onBioCancel: () => void;
  onAvatarSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarUpload: () => void;
  onAvatarModalClose: () => void;
  onAvatarDelete: () => void;
}

const ProfileManagerComponent = ({
  user,
  stats,
  loadingStats,
  userBio,
  isEditingBio,
  bioText,
  showAvatarModal,
  avatarPreview,
  uploadingAvatar,
  onEditBio,
  onBioChange,
  onBioSave,
  onBioCancel,
  onAvatarSelect,
  onAvatarUpload,
  onAvatarModalClose,
  onAvatarDelete
}: ProfileManagerProps) => {
  // Кешируем аватар
  const avatarSection = React.useMemo(() => (
    <div className={styles.avatarSection}>
      <div className={styles.avatar}>
        {user?.avatarUrl ? (
          <Image 
            src={user.avatarUrl} 
            alt={`Аватар ${user.name}`}
            width={150}
            height={150}
            className={styles.avatarImage}
            priority
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
        {user?.avatarUrl && (
          <button 
            className={styles.avatarDeleteButton}
            title="Удалить аватар"
            onClick={onAvatarDelete}
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
        onChange={onAvatarSelect}
      />
    </div>
  ), [user?.avatarUrl, user?.name, onAvatarSelect, onAvatarDelete]);

  // Кешируем profileActions
  const profileActions = React.useMemo(() => (
    <div className={styles.profileActions}>
      <h1 className={styles.username}>@{user?.name?.toLowerCase().replace(/\s+/g, '_')}</h1>
      <div className={styles.actionButtons}>
        <button className={styles.settingsButton}>
          <HiCog6Tooth />
        </button>
        <button className={styles.menuButton}>
          <HiEllipsisHorizontal />
        </button>
      </div>
    </div>
  ), [user?.name]);

  return (
    <>
      {/* Profile Header */}
      <header className={styles.profileHeader}>
        {avatarSection}

        <div className={styles.profileInfo}>
          {profileActions}

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
            <h2 className={styles.displayName}>{user?.name}</h2>
            {isEditingBio ? (
              <div className={styles.bioEditContainer}>
                <textarea
                  value={bioText}
                  onChange={(e) => onBioChange(e.target.value)}
                  className={styles.bioTextarea}
                  placeholder="Расскажите о себе..."
                  maxLength={150}
                  rows={3}
                />
                <div className={styles.bioEditActions}>
                  <button 
                    className={styles.bioSaveButton}
                    onClick={onBioSave}
                  >
                    Сохранить
                  </button>
                  <button 
                    className={styles.bioCancelButton}
                    onClick={onBioCancel}
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
                  onClick={onEditBio}
                >
                  <HiPencil />
                  Редактировать
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.avatarModal}>
            <div className={styles.modalHeader}>
              <h3>Изменить фото профиля</h3>
              <button 
                className={styles.closeButton}
                onClick={onAvatarModalClose}
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
                onClick={onAvatarModalClose}
              >
                Отмена
              </button>
              <button 
                className={styles.uploadButton}
                onClick={onAvatarUpload}
                disabled={uploadingAvatar || !avatarPreview}
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
    </>
  );
};

// Мемоизируем компонент для предотвращения лишних перерисовок
export const ProfileManager = React.memo(ProfileManagerComponent);
