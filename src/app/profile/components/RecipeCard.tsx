'use client';

import { HiClock, HiUsers, HiFire, HiCheckCircle, HiEye, HiHeart, HiCalendar, HiSparkles, HiXCircle } from 'react-icons/hi2';
import { MdRestaurantMenu, MdEdit, MdDelete} from 'react-icons/md';
import styles from '../page.module.css';
import { UserRecipe } from '../types';

interface RecipeCardProps {
  recipe: UserRecipe;
  onPromoteRecipe: (recipe: UserRecipe) => void;
  onEditRecipe: (recipe: UserRecipe) => void;
  onShareRecipe: (recipe: UserRecipe) => void;
  onDeleteRecipe: (recipeId: number) => void;
  onUnpublishRecipe: (recipeId: number) => void;
}

export default function RecipeCard({
  recipe,
  onPromoteRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onUnpublishRecipe
}: RecipeCardProps) {
  return (
    <div className={styles.recipeCard}>
      <div className={styles.recipeImage}>
        {recipe.has_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={`/api/recipes/${recipe.id}/image`} 
            alt={recipe.title}
            className={styles.recipeImg}
          />
        ) : (
          <div className={styles.noImage}>
            <MdRestaurantMenu size={48} />
          </div>
        )}
        <div className={styles.recipeStatus}>
          {recipe.is_public ? (
            <div className={styles.statusApproved}>
              <HiCheckCircle size={14} />
              <span>Опубликовано</span>
            </div>
          ) : recipe.is_approved ? (
            <div className={styles.statusApproved}>
              <HiCheckCircle size={14} />
              <span>Одобрено</span>
            </div>
          ) : (
            <div className={styles.statusPending}>
              <HiClock size={14} />
              <span>Черновик</span>
            </div>
          )}
        </div>
        <div className={styles.cardMenu}>
          <button 
            className={styles.menuButton}
            onClick={() => onPromoteRecipe(recipe)}
            title="Добавить на страницу Постов"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.recipeCategory}>
          <span className={styles.categoryBadge}>{recipe.category}</span>
        </div>
        
        <h3 className={styles.recipeTitle}>{recipe.title}</h3>
        <p className={styles.recipeDescription}>{recipe.description}</p>
        
        <div className={styles.recipeMetadata}>
          <div className={styles.metaGroup}>
            <div className={styles.metaItem}>
              <HiClock size={16} />
              <span>{recipe.time}</span>
            </div>
            <div className={styles.metaItem}>
              <HiUsers size={16} />
              <span>{recipe.servings}</span>
            </div>
          </div>
          <div className={styles.difficultyBadge}>
            <HiFire size={14} />
            <span>{recipe.difficulty}</span>
          </div>
        </div>

        <div className={styles.ingredientsPreview}>
          <span className={styles.ingredientsLabel}>Ингредиенты:</span>
          <span className={styles.ingredientsCount}>
            {recipe.ingredients.length} шт.
          </span>
        </div>

        <div className={styles.recipeStats}>
          <div className={styles.statItem}>
            <HiEye size={14} />
            <span>{recipe.views_count}</span>
          </div>
          <div className={styles.statItem}>
            <HiHeart size={14} />
            <span>{recipe.likes_count}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.recipeDate}>
          <HiCalendar size={14} />
          <span>Создан {new Date(recipe.created_at).toLocaleDateString('ru-RU')}</span>
        </div>
        <div className={styles.recipeActions}>
          <button 
            className={styles.actionButton} 
            title="Редактировать"
            onClick={() => onEditRecipe(recipe)}
          >
            <MdEdit size={18} />
          </button>
          {recipe.is_public ? (
            <button 
              className={styles.actionButton} 
              title="Снять с публикации"
              onClick={() => onUnpublishRecipe(recipe.id)}
            >
              <HiXCircle size={18} />
            </button>
          ) : (
            <button 
              className={styles.actionButton} 
              title="Опубликовать"
              onClick={() => onPromoteRecipe(recipe)}
            >
              <HiSparkles size={18} />
            </button>
          )}
          <button 
            className={styles.actionButton} 
            title="Удалить"
            onClick={() => onDeleteRecipe(recipe.id)}
          >
            <MdDelete size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
