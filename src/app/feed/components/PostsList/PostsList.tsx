'use client';

import { Post } from '../Post';
import { PublicRecipe } from '../../types';
import styles from '../../page.module.css';

interface PostsListProps {
  recipes: PublicRecipe[];
  loading: boolean;
  likedRecipes: Set<number>;
  favorites: number[];
  onLike: (recipeId: number) => void;
  onCommentClick: (recipeId: number) => void;
  onBookmark: (recipeId: number) => void;
  onHashtagClick: (hashtag: string) => void;
}

export function PostsList({
  recipes,
  loading,
  likedRecipes,
  favorites,
  onLike,
  onCommentClick,
  onBookmark,
  onHashtagClick
}: PostsListProps) {
  if (loading) {
    return (
      <div className={styles.postsContainer}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className={styles.skeletonPost}>
            {/* Skeleton Header */}
            <div className={styles.skeletonHeader}>
              <div className={`${styles.skeleton} ${styles.skeletonAvatar}`}></div>
              <div className={styles.skeletonAuthorInfo}>
                <div className={`${styles.skeleton} ${styles.skeletonLine}`}></div>
                <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`}></div>
              </div>
            </div>

            {/* Skeleton Image */}
            <div className={`${styles.skeleton} ${styles.skeletonImage}`}></div>

            {/* Skeleton Actions */}
            <div className={styles.skeletonActions}>
              <div className={`${styles.skeleton} ${styles.skeletonButton}`}></div>
              <div className={`${styles.skeleton} ${styles.skeletonButton}`}></div>
              <div className={`${styles.skeleton} ${styles.skeletonButton}`}></div>
            </div>

            {/* Skeleton Content */}
            <div className={styles.skeletonContent}>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`}></div>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`}></div>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`}></div>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🔍</span>
        <h3>Посты не найдены</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    );
  }

  return (
    <div className={styles.postsContainer}>
      {recipes.map(recipe => (
        <Post
          key={recipe.id}
          recipe={recipe}
          likedRecipes={likedRecipes}
          favorites={favorites}
          onLike={onLike}
          onCommentClick={onCommentClick}
          onBookmark={onBookmark}
          onHashtagClick={onHashtagClick}
        />
      ))}
    </div>
  );
}
