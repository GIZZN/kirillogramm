'use client';

import Image from 'next/image';
import { HiXMark, HiPhoto, HiCamera } from 'react-icons/hi2';
import { UploadForm } from '../../types';
import styles from '../../page.module.css';

interface UploadModalProps {
  showUploadModal: boolean;
  uploadForm: UploadForm;
  selectedImage: File | null;
  imagePreview: string | null;
  uploading: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: keyof UploadForm, value: string) => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadModal({
  showUploadModal,
  uploadForm,
  selectedImage,
  imagePreview,
  uploading,
  onClose,
  onSubmit,
  onFormChange,
  onImageSelect
}: UploadModalProps) {
  if (!showUploadModal) return null;

  const handleCloseModal = () => {
    onClose();
  };

  return (
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

        <form onSubmit={onSubmit} className={styles.uploadForm}>
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
              onChange={onImageSelect}
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
                onChange={(e) => onFormChange('title', e.target.value)}
                className={styles.input}
                placeholder="Добавьте название..."
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Описание</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                className={styles.textarea}
                placeholder="Напишите описание..."
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Категория</label>
              <select
                value={uploadForm.category}
                onChange={(e) => onFormChange('category', e.target.value)}
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
                onChange={(e) => onFormChange('hashtags', e.target.value)}
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
  );
}
