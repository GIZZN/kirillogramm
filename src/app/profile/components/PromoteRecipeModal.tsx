'use client';

import { HiClock, HiUsers, HiFire, HiCheckCircle, HiSparkles } from 'react-icons/hi2';
import styles from '../page.module.css';
import { UserRecipe } from '../types';

interface PromoteRecipeModalProps {
  showPromoteModal: boolean;
  selectedRecipeForPromotion: UserRecipe | null;
  onClose: () => void;
  onSubmitPromotion: () => void;
}

export default function PromoteRecipeModal({
  showPromoteModal,
  selectedRecipeForPromotion,
  onClose,
  onSubmitPromotion
}: PromoteRecipeModalProps) {
  if (!showPromoteModal || !selectedRecipeForPromotion) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Добавить рецепт на страницу Постов</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.recipeForm}>
          <div className={styles.promotePreview}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.previewCategory}>{selectedRecipeForPromotion.category}</span>
                <div className={styles.previewStatus}>
                  {selectedRecipeForPromotion.is_approved ? (
                    <span className={styles.statusApproved}>
                      <HiCheckCircle size={14} />
                      Одобрено
                    </span>
                  ) : (
                    <span className={styles.statusPending}>
                      <HiClock size={14} />
                      Добавлено
                    </span>
                  )}
                </div>
              </div>
              <h3 className={styles.previewTitle}>{selectedRecipeForPromotion.title}</h3>
              <p className={styles.previewDescription}>{selectedRecipeForPromotion.description}</p>
              
              <div className={styles.previewMeta}>
                <div className={styles.metaItem}>
                  <HiClock size={16} />
                  <span>{selectedRecipeForPromotion.time}</span>
                </div>
                <div className={styles.metaItem}>
                  <HiUsers size={16} />
                  <span>{selectedRecipeForPromotion.servings}</span>
                </div>
                <div className={styles.metaItem}>
                  <HiFire size={16} />
                  <span>{selectedRecipeForPromotion.difficulty}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.promoteInfo}>
            <div className={styles.infoIcon}>
              <HiSparkles size={24} />
            </div>
            <div className={styles.infoContent}>
              <h4>Публикация рецепта</h4>
              <p>
                Ваш рецепт будет добавлен на страницу рецептов и станет доступен 
                всем пользователям приложения для поиска и просмотра.
              </p>
              <ul className={styles.benefitsList}>
                <li>🔍 Рецепт появится в поиске</li>
                <li>❤️ Пользователи смогут добавлять в избранное</li>
                <li>⭐ Получение рейтинга и отзывов</li>
                <li>👥 Привлечение новых подписчиков</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button type="button" className={styles.submitButton} onClick={onSubmitPromotion}>
              <HiSparkles size={16} />
              Опубликовать рецепт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
