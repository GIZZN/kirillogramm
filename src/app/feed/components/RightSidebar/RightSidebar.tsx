'use client';

import Image from 'next/image';
import { HiFire, HiUsers, HiHeart, HiStar } from 'react-icons/hi2';
import { PublicRecipe } from '../../types';
import styles from '../../page.module.css';

interface RightSidebarProps {
  recipes: PublicRecipe[];
  loading: boolean;
}

export function RightSidebar({ recipes, loading }: RightSidebarProps) {
  // Get top 3 recipes for suggestions
  const topRecipes = [...recipes]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 3);

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.rightSidebarContent}>
        <h3 className={styles.rightSidebarTitle}>
          <HiFire className={styles.sectionIcon} />
          Популярные
        </h3>
        
        <div className={styles.suggestionsList}>
          {loading ? (
            [...Array(3)].map((_, index) => (
              <div key={index} className={styles.suggestionItemSkeleton}>
                <div className={`${styles.skeleton} ${styles.suggestionImageSkeleton}`}></div>
                <div className={styles.suggestionInfoSkeleton}>
                  <div className={`${styles.skeleton} ${styles.suggestionTitleSkeleton}`}></div>
                  <div className={styles.suggestionMetaSkeleton}>
                    <div className={`${styles.skeleton} ${styles.suggestionAuthorSkeleton}`}></div>
                    <div className={`${styles.skeleton} ${styles.suggestionLikesSkeleton}`}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            topRecipes.map(recipe => (
              <div 
                key={recipe.id} 
                className={styles.suggestionItem}
              >
                <div className={styles.suggestionImage}>
                  {recipe.has_image ? (
                    <Image 
                      src={`/api/recipes/${recipe.id}/image`}
                      alt={recipe.title}
                      width={80}
                      height={80}
                      className={styles.suggestionImg}
                    />
                  ) : (
                    <div className={styles.suggestionPlaceholder}>
                      📸
                    </div>
                  )}
                </div>
                <div className={styles.suggestionInfo}>
                  <h4 className={styles.suggestionTitle}>{recipe.title}</h4>
                  <div className={styles.suggestionMeta}>
                    <span className={styles.suggestionAuthor}>
                      <HiUsers /> {recipe.author_name}
                    </span>
                    <span className={styles.suggestionLikes}>
                      <HiHeart /> {recipe.likes_count}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.rightSidebarStats}>
          <h4 className={styles.statsTitle}>
            <HiStar className={styles.sectionIcon} />
            Статистика
          </h4>
          <div className={styles.statsGrid}>
            {loading ? (
              <>
                <div className={styles.statCardSkeleton}>
                  <div className={`${styles.skeleton} ${styles.statIconSkeleton}`}></div>
                  <div className={styles.statContentSkeleton}>
                    <div className={`${styles.skeleton} ${styles.statValueSkeleton}`}></div>
                    <div className={`${styles.skeleton} ${styles.statTextSkeleton}`}></div>
                  </div>
                </div>
                <div className={styles.statCardSkeleton}>
                  <div className={`${styles.skeleton} ${styles.statIconSkeleton}`}></div>
                  <div className={styles.statContentSkeleton}>
                    <div className={`${styles.skeleton} ${styles.statValueSkeleton}`}></div>
                    <div className={`${styles.skeleton} ${styles.statTextSkeleton}`}></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.statCard}>
                  <HiFire className={styles.statIcon} />
                  <div>
                    <div className={styles.statValue}>{recipes.length}</div>
                    <div className={styles.statText}>Всего постов</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <HiUsers className={styles.statIcon} />
                  <div>
                    <div className={styles.statValue}>{new Set(recipes.map(r => r.author_name)).size}</div>
                    <div className={styles.statText}>Авторов</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
