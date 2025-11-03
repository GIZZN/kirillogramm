'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProtectedRoute from '../components/ProtectedRoute';
import Link from 'next/link';
import { useFavorites } from '../context/FavoritesContext';
import styles from './page.module.css';
import highlightStyles from './highlight-viewer.module.css';

// Components
import CommentsSidebar from './components/CommentsSidebar';

// Hooks
import { useRecipes } from './hooks/useRecipes';
import { useComments } from './hooks/useComments';

// Icons
import { HiMagnifyingGlass, HiHeart, HiChatBubbleLeft, HiBookmark, HiEllipsisHorizontal, HiFire, HiUsers, HiStar, HiPlay, HiPause, HiSpeakerWave, HiSpeakerXMark, HiXMark } from 'react-icons/hi2';

interface Highlight {
  id: number;
  title: string;
  thumbnail_data?: string;
  video_data?: string;
  media_type: 'image' | 'video';
  has_media: boolean;
  duration?: number;
  user_id?: number;
  author_name?: string;
}

export default function RecipesPage() {
  const { toggleFavorite, favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostForComments, setSelectedPostForComments] = useState<number | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoVolume, setVideoVolume] = useState(1);
  
  // Recipe data and operations
  const { recipes, loading, likedRecipes, toggleLike } = useRecipes();
  

  // Comments state
  const {
    comments,
    loadingComments,
    submittingComment,
    fetchComments,
    addComment,
    toggleCommentLike
  } = useComments();

  // Filter recipes based on search and tags
  const filteredRecipes = recipes.filter(recipe => {
    let matchesSearch = true;
    
    if (searchQuery.trim()) {
      if (searchQuery.startsWith('#')) {
        // Поиск по хештегам
        const hashtag = searchQuery.slice(1).toLowerCase();
        matchesSearch = recipe.hashtags?.some(tag => 
          tag.toLowerCase().includes(hashtag)
        ) || false;
      } else {
        // Обычный поиск по тексту
        matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
      }
    }
    
      return matchesSearch;
  });

  const handleLike = async (recipeId: number) => {
    try {
      await toggleLike(recipeId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Load highlights from feed (own + subscriptions)
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        setLoadingHighlights(true);
        const response = await fetch('/api/highlights/feed', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setHighlights(data.highlights || []);
        } else {
          // Если пользователь не авторизован, просто показываем пустой список
          if (response.status === 401) {
            setHighlights([]);
          }
        }
      } catch (error) {
        console.error('Error loading highlights:', error);
      } finally {
        setLoadingHighlights(false);
      }
    };

    loadHighlights();
  }, []);

  const handleStoryClick = async (highlight: Highlight & { user_id?: number }) => {
    try {
      // Всегда используем API пользователя, так как у нас есть user_id
      const response = await fetch(`/api/users/${highlight.user_id}/highlights/${highlight.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const { highlight: fullHighlight } = await response.json();
        setSelectedHighlight(fullHighlight);
        setShowHighlightViewer(true);
        setIsVideoPlaying(false);
        setVideoCurrentTime(0);
        setVideoDuration(0);
        setIsVideoMuted(true);
        setVideoVolume(1);
      }
    } catch (error) {
      console.error('Error loading highlight:', error);
    }
  };

  // Video control functions
  const toggleVideoPlay = () => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    if (video) {
      if (isVideoPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    const newTime = parseFloat(e.target.value);
    if (video) {
      video.currentTime = newTime;
      setVideoCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    const newVolume = parseFloat(e.target.value);
    if (video) {
      video.volume = newVolume;
      setVideoVolume(newVolume);
      setIsVideoMuted(newVolume === 0);
    }
  };

  const toggleVideoMute = () => {
    const video = document.querySelector('.highlight-video') as HTMLVideoElement;
    if (video) {
      video.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBookmark = async (recipeId: number) => {
    try {
        await toggleFavorite(recipeId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };


  // Get top 3 recipes for suggestions
  const topRecipes = recipes
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 3);

  return (
    <ProtectedRoute>
      <div className={styles.feedContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <h2 className={styles.sidebarTitle}>Поиск фото</h2>
            
            {/* Search */}
            <div className={styles.searchBox}>
              <HiMagnifyingGlass className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Поиск Постов или #хештегов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
            </div>

            {/* Stories */}
            <div className={styles.storiesSection}>
              <h3 className={styles.storiesTitle}>Сторисы</h3>
              <div className={styles.storiesList}>
                {loadingHighlights ? (
                  <>
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className={styles.storyItemSkeleton}>
                        <div className={`${styles.skeleton} ${styles.storyCircleSkeleton}`}></div>
                        <div className={`${styles.skeleton} ${styles.storyLabelSkeleton}`}></div>
                      </div>
                    ))}
                  </>
                ) : highlights.length > 0 ? (
                  highlights.map(highlight => (
                    <div 
                      key={highlight.id} 
                      className={styles.storyItem}
                      onClick={() => handleStoryClick(highlight)}
                    >
                      <div className={styles.storyCircle}>
                        {highlight.has_media && highlight.thumbnail_data ? (
                          <Image
                            src={highlight.thumbnail_data.startsWith('data:') ? highlight.thumbnail_data : `data:image/jpeg;base64,${highlight.thumbnail_data}`}
                            alt={highlight.title}
                            width={60}
                            height={60}
                            className={styles.storyImage}
                          />
                        ) : (
                          <div className={styles.storyPlaceholder}>
                            <HiUsers />
                          </div>
                        )}
                        {highlight.media_type === 'video' && (
                          <div className={styles.videoIndicator}>
                            <div className={styles.playIcon}>▶</div>
                          </div>
                        )}
                      </div>
                      <span className={styles.storyLabel}>
                        {highlight.author_name ? highlight.author_name : highlight.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.noStories}>Нет сторисов</div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsSection}>
              {loading ? (
                <>
                  <div className={styles.statSkeleton}>
                    <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
                    <div className={`${styles.skeleton} ${styles.statLabelSkeleton}`}></div>
                  </div>
                  <div className={styles.statSkeleton}>
                    <div className={`${styles.skeleton} ${styles.statNumberSkeleton}`}></div>
                    <div className={`${styles.skeleton} ${styles.statLabelSkeleton}`}></div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>{recipes.length}</span>
                    <span className={styles.statLabel}>Постовв</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>{filteredRecipes.length}</span>
                    <span className={styles.statLabel}>Найдено</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className={styles.feed}>
          <div className={styles.feedHeader}>
            <h1 className={styles.feedTitle}>Лента Постов</h1>
            <p className={styles.feedSubtitle}>Откройте для себя новые впечатления</p>
          </div>

          {loading ? (
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
          ) : (
            <div className={styles.postsContainer}>
              {filteredRecipes.map(recipe => (
                <article key={recipe.id} className={styles.post}>
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
                        onClick={() => handleLike(recipe.id)}
                      >
                        <HiHeart />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => {
                          setSelectedPostForComments(recipe.id);
                          if (!comments[recipe.id] || comments[recipe.id].length === 0) {
                            fetchComments(recipe.id);
                          }
                        }}
                      >
                        <HiChatBubbleLeft />
                      </button>
                    </div>
                    <button 
                      className={`${styles.actionBtn} ${favorites.includes(recipe.id) ? styles.bookmarked : ''}`}
                      onClick={() => handleBookmark(recipe.id)}
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
                            onClick={() => setSearchQuery(`#${hashtag}`)}
                          >
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                </article>
              ))}
            </div>
          )}

          {filteredRecipes.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>Рецепты не найдены</h3>
              <p>Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
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


        {/* Comments Sidebar */}
        {selectedPostForComments && (
          <CommentsSidebar
            recipe={recipes.find(r => r.id === selectedPostForComments) || null}
            comments={comments[selectedPostForComments] || []}
            loading={loadingComments[selectedPostForComments] || false}
            submitting={submittingComment[selectedPostForComments] || false}
            onAddComment={(content, parentId) => addComment(selectedPostForComments, content, parentId)}
            onToggleLike={(commentId) => toggleCommentLike(selectedPostForComments, commentId)}
            onClose={() => setSelectedPostForComments(null)}
          />
        )}

        {/* Highlight Viewer Modal */}
        {showHighlightViewer && selectedHighlight && (
          <div className={highlightStyles.modalOverlay}>
            <div className={highlightStyles.modalContentCircle}>
              <button 
                className={highlightStyles.modalCloseButtonCircle}
                onClick={() => setShowHighlightViewer(false)}
              >
                <HiXMark />
              </button>

              <div className={highlightStyles.highlightViewerCircle}>
                {selectedHighlight.media_type === 'video' && selectedHighlight.video_data ? (
                  <>
                    <video
                      className={`highlight-video ${highlightStyles.highlightVideoCircle}`}
                      src={selectedHighlight.video_data}
                      muted={isVideoMuted}
                      onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
                      onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                    {selectedHighlight.thumbnail_data && !isVideoPlaying && (
                      <div className={highlightStyles.videoThumbnailOverlay}>
                        <Image
                          src={selectedHighlight.thumbnail_data.startsWith('data:') ? selectedHighlight.thumbnail_data : `data:image/jpeg;base64,${selectedHighlight.thumbnail_data}`}
                          alt={selectedHighlight.title}
                          width={450}
                          height={450}
                          className={highlightStyles.highlightImageCircle}
                        />
                      </div>
                    )}
                  </>
                ) : selectedHighlight.thumbnail_data ? (
                  <Image
                    src={selectedHighlight.thumbnail_data.startsWith('data:') ? selectedHighlight.thumbnail_data : `data:image/jpeg;base64,${selectedHighlight.thumbnail_data}`}
                    alt={selectedHighlight.title}
                    width={450}
                    height={450}
                    className={highlightStyles.highlightImageCircle}
                  />
                ) : (
                  <div className={highlightStyles.highlightPlaceholder}>
                    <HiUsers />
                  </div>
                )}
              </div>

              {selectedHighlight.media_type === 'video' && (
                <div className={highlightStyles.videoControlsContainer}>
                  <div className={highlightStyles.videoControls}>
                    <button 
                      className={highlightStyles.playPauseButton}
                      onClick={toggleVideoPlay}
                      title={isVideoPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {isVideoPlaying ? <HiPause /> : <HiPlay />}
                    </button>

                    <div className={highlightStyles.seekBarContainer}>
                      <div className={highlightStyles.timeInfoContainer}>
                        <span className={highlightStyles.currentTime}>
                          {formatTime(videoCurrentTime)}
                        </span>
                        <span className={highlightStyles.totalTime}>
                          {formatTime(videoDuration)}
                        </span>
                      </div>
                      <div className={highlightStyles.seekBarWrapper}>
                        <input
                          type="range"
                          min="0"
                          max={videoDuration || 100}
                          value={videoCurrentTime}
                          onChange={handleSeek}
                          className={highlightStyles.seekBar}
                        />
                      </div>
                    </div>

                    <div className={highlightStyles.volumeControls}>
                      <button 
                        className={highlightStyles.muteButton}
                        onClick={toggleVideoMute}
                        title={isVideoMuted ? 'Включить звук' : 'Выключить звук'}
                      >
                        {isVideoMuted || videoVolume === 0 ? (
                          <HiSpeakerXMark />
                        ) : (
                          <HiSpeakerWave />
                        )}
                      </button>
                      
                      <div className={highlightStyles.volumeSliderContainer}>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isVideoMuted ? 0 : videoVolume}
                          onChange={handleVolumeChange}
                          className={highlightStyles.volumeSlider}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={highlightStyles.highlightInfo}>
                <p><strong>{selectedHighlight.title}</strong></p>
                <p>Тип: {selectedHighlight.media_type === 'video' ? 'Видео' : 'Изображение'}</p>
                {selectedHighlight.duration && selectedHighlight.duration > 0 && (
                  <p>Длительность: {selectedHighlight.duration}с</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}