'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiHeart, HiChatBubbleLeft, HiBookmark, HiEllipsisHorizontal } from 'react-icons/hi2';
import { PublicRecipe } from '../../types';
import styles from '../../page.module.css';

interface PostProps {
  recipe: PublicRecipe;
  likedRecipes: Set<number>;
  favorites: number[];
  onLike: (recipeId: number) => void;
  onCommentClick: (recipeId: number) => void;
  onBookmark: (recipeId: number) => void;
  onHashtagClick: (hashtag: string) => void;
}

export function Post({
  recipe,
  likedRecipes,
  favorites,
  onLike,
  onCommentClick,
  onBookmark,
  onHashtagClick
}: PostProps) {
  return (
    <article className={styles.post}>
      {/* Post Header */}
      <header className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <Link href={`/users/${recipe.author_id}`} className={styles.authorAvatar}>
            {recipe.author_avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={recipe.author_avatar} 
                alt={`${recipe.author_name} avatar`}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarInitial}>
                {recipe.author_name.charAt(0).toUpperCase()}
              </span>
            )}
          </Link>
          <div className={styles.authorInfo}>
            <Link href={`/users/${recipe.author_id}`} className={styles.authorName}>
              {recipe.author_name}
            </Link>
            <span className={styles.postTime}>
              {new Date(recipe.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
        <button className={styles.postMenu}>
          <HiEllipsisHorizontal />
        </button>
      </header>

      {/* Post Image */}
      <div className={styles.postImage}>
        {recipe.has_image ? (
          <Image 
            src={`/api/recipes/${recipe.id}/image`} 
            alt={recipe.title}
            width={600}
            height={600}
            className={styles.recipeImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>📸</span>
            <p>Фото рецепта</p>
          </div>
        )}
        <div className={styles.imageOverlay}>
          <span className={styles.category}>{recipe.category}</span>
        </div>
      </div>

      {/* Post Actions */}
      <div className={styles.postActions}>
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionBtn} ${likedRecipes.has(recipe.id) ? styles.liked : ''}`}
            onClick={() => onLike(recipe.id)}
          >
            <HiHeart />
          </button>
          <button 
            className={styles.actionBtn}
            onClick={() => onCommentClick(recipe.id)}
          >
            <HiChatBubbleLeft />
          </button>
        </div>
        <button 
          className={`${styles.actionBtn} ${favorites.includes(recipe.id) ? styles.bookmarked : ''}`}
          onClick={() => onBookmark(recipe.id)}
        >
          <HiBookmark />
        </button>
      </div>

      {/* Post Content */}
      <div className={styles.postContent}>
        <div className={styles.likesCount}>
          {recipe.likes_count} отметок &quot;Нравится&quot;
        </div>
        <div className={styles.postCaption}>
          <span className={styles.authorName}>{recipe.author_name}</span>
          <span className={styles.captionText}>{recipe.title}</span>
        </div>
        <p className={styles.postDescription}>{recipe.description}</p>
        <div className={styles.postMeta}>
          <div className={styles.metaItem}>
            <HiHeart className={styles.metaIcon} />
            <span>{recipe.likes_count || 0}</span>
          </div>
          <div className={styles.metaItem}>
            <HiChatBubbleLeft className={styles.metaIcon} />
            <span>{recipe.comments_count || 0}</span>
          </div>
          <div className={styles.metaItem}>
            <HiBookmark className={styles.metaIcon} />
            <span>{favorites.includes(recipe.id) ? 1 : 0}</span>
          </div>
        </div>
        
        {recipe.hashtags && recipe.hashtags.length > 0 && (
          <div className={styles.hashtags}>
            {recipe.hashtags.map((hashtag, index) => (
              <span 
                key={index} 
                className={styles.hashtag}
                onClick={() => onHashtagClick(hashtag)}
              >
                #{hashtag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}