'use client';

import { HiPlus, HiChevronDown } from 'react-icons/hi2';
import styles from '../page.module.css';
import { UserRecipe, RecipeForm, CATEGORIES, DIFFICULTIES } from '../types';

interface AddRecipeModalProps {
  showAddRecipe: boolean;
  editingRecipe: UserRecipe | null;
  recipeForm: RecipeForm;
  selectedImage: File | null;
  imagePreview: string | null;
  submitting: boolean;
  categoryDropdownOpen: boolean;
  difficultyDropdownOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: string, value: string | number) => void;
  onIngredientChange: (index: number, value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  setCategoryDropdownOpen: (open: boolean) => void;
  setDifficultyDropdownOpen: (open: boolean) => void;
}


export default function AddRecipeModal({
  showAddRecipe,
  editingRecipe,
  recipeForm,
  selectedImage,  // eslint-disable-line @typescript-eslint/no-unused-vars
  imagePreview,
  submitting,
  categoryDropdownOpen,
  difficultyDropdownOpen,
  onClose,
  onSubmit,
  onInputChange,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onImageSelect,
  onRemoveImage,
  setCategoryDropdownOpen,
  setDifficultyDropdownOpen
}: AddRecipeModalProps) {
  if (!showAddRecipe) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editingRecipe ? 'Редактировать рецепт' : 'Добавить новый рецепт'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form className={styles.recipeForm} onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Название рецепта *</label>
              <input
                type="text"
                className={styles.input}
                value={recipeForm.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="Например: Паста Карбонара"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Категория *</label>
              <div className={styles.customSelect}>
                <button
                  type="button"
                  className={`${styles.selectButton} ${categoryDropdownOpen ? styles.selectButtonOpen : ''}`}
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <span>{recipeForm.category}</span>
                  <HiChevronDown 
                    size={16} 
                    className={`${styles.selectIcon} ${categoryDropdownOpen ? styles.selectIconOpen : ''}`}
                  />
                </button>
                {categoryDropdownOpen && (
                  <div className={styles.selectDropdown}>
                        {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.selectOption} ${recipeForm.category === cat ? styles.selectOptionActive : ''}`}
                        onClick={() => {
                          onInputChange('category', cat);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Описание *</label>
            <textarea
              className={styles.textarea}
              value={recipeForm.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Краткое описание блюда..."
              rows={3}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Ингредиенты *</label>
            {recipeForm.ingredients.map((ingredient, index) => (
              <div key={index} className={styles.ingredientRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={ingredient}
                  onChange={(e) => onIngredientChange(index, e.target.value)}
                  placeholder={`Ингредиент ${index + 1}`}
                  required
                />
                {recipeForm.ingredients.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => onRemoveIngredient(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className={styles.addIngredientButton}
              onClick={onAddIngredient}
            >
              + Добавить ингредиент
            </button>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Инструкции по приготовлению *</label>
            <textarea
              className={styles.textarea}
              value={recipeForm.instructions}
              onChange={(e) => onInputChange('instructions', e.target.value)}
              placeholder="Пошаговые инструкции..."
              rows={6}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Фото рецепта</label>
            <div className={styles.imageUploadContainer}>
              {imagePreview ? (
                <div className={styles.imagePreview}> 
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Превью рецепта" className={styles.previewImage} />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={onRemoveImage}
                    title="Удалить изображение"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className={styles.imageUploadArea}>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={onImageSelect}
                    className={styles.imageInput}
                  />
                  <label htmlFor="image-upload" className={styles.imageUploadLabel}>
                    <HiPlus size={24} />
                    <span>Добавить фото</span>
                    <small>JPEG, PNG, WebP до 5MB</small>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Время приготовления</label>
              <input
                type="text"
                className={styles.input}
                value={recipeForm.time}
                onChange={(e) => onInputChange('time', e.target.value)}
                placeholder="30 мин"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Порций</label>
              <input
                type="number"
                className={styles.input}
                value={recipeForm.servings}
                onChange={(e) => onInputChange('servings', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Сложность</label>
              <div className={styles.customSelect}>
                <button
                  type="button"
                  className={`${styles.selectButton} ${difficultyDropdownOpen ? styles.selectButtonOpen : ''}`}
                  onClick={() => setDifficultyDropdownOpen(!difficultyDropdownOpen)}
                >
                  <span>{recipeForm.difficulty}</span>
                  <HiChevronDown 
                    size={16} 
                    className={`${styles.selectIcon} ${difficultyDropdownOpen ? styles.selectIconOpen : ''}`}
                  />
                </button>
                {difficultyDropdownOpen && (
                  <div className={styles.selectDropdown}>
                        {DIFFICULTIES.map(diff => (
                      <button
                        key={diff}
                        type="button"
                        className={`${styles.selectOption} ${recipeForm.difficulty === diff ? styles.selectOptionActive : ''}`}
                        onClick={() => {
                          onInputChange('difficulty', diff);
                          setDifficultyDropdownOpen(false);
                        }}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting 
                ? (editingRecipe ? 'Обновление...' : 'Добавление...') 
                : (editingRecipe ? 'Обновить рецепт' : 'Добавить рецепт')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
