'use client';

import Image from 'next/image';
import { HiXMark, HiPhoto } from 'react-icons/hi2';
import { HighlightForm } from '../../types';
import styles from '../../page.module.css';

interface HighlightModalProps {
  showHighlightModal: boolean;
  highlightForm: HighlightForm;
  selectedHighlightMedia: File | null;
  highlightMediaPreview: string | null;
  uploadingHighlight: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: keyof HighlightForm, value: string) => void;
  onMediaSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HighlightModal({
  showHighlightModal,
  highlightForm,
  selectedHighlightMedia,
  highlightMediaPreview,
  uploadingHighlight,
  onClose,
  onSubmit,
  onFormChange,
  onMediaSelect
}: HighlightModalProps) {
  if (!showHighlightModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <h2>Добавить Highlight</h2>
            <button 
              className={styles.modalCloseButton}
              onClick={onClose}
            >
              <HiXMark />
            </button>
          </div>

          <form id="highlightForm" onSubmit={onSubmit} className={styles.highlightForm}>
            <div className={styles.formGroup}>
              <label htmlFor="highlightTitle">Название</label>
              <input
                id="highlightTitle"
                type="text"
                value={highlightForm.title}
                onChange={(e) => onFormChange('title', e.target.value)}
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
                  onClick={() => onFormChange('mediaType', 'image')}
                >
                  <HiPhoto />
                  Изображение
                </button>
                <button
                  type="button"
                  className={`${styles.mediaTypeButton} ${highlightForm.mediaType === 'video' ? styles.active : ''}`}
                  onClick={() => onFormChange('mediaType', 'video')}
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
                onChange={onMediaSelect}
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
                    height={250}
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
              onClick={onClose}
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
  );
}
