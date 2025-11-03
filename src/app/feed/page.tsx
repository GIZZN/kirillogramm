'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import styles from './page.module.css';

// Hooks
import {
  useRecipes,
  useComments,
  useHighlights,
  useSearch
} from './hooks';

// Components
import {
  SearchBar,
  HighlightsSection,
  HighlightViewer,
  PostsList,
  RightSidebar,
  CommentsSidebar
} from './components';

export default function RecipesPage() {
  const { toggleFavorite, favorites } = useFavorites();
  const { user } = useAuth();
  
  // Custom hooks
  const { recipes, loading, likedRecipes, toggleLike } = useRecipes();
  
  const {
    comments,
    loadingComments,
    submittingComment,
    fetchComments,
    addComment,
    toggleCommentLike
  } = useComments(user);

  const {
    highlights,
    loadingHighlights,
    selectedHighlight,
    showHighlightViewer,
    videoControls,
    handleStoryClick,
    closeHighlightViewer,
    toggleVideoPlay,
    handleSeek,
    handleVolumeChange,
    toggleVideoMute,
    formatTime,
    handleVideoTimeUpdate,
    handleVideoLoadedMetadata,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded
  } = useHighlights();

  const {
    searchQuery,
    setSearchQuery,
    selectedPostForComments,
    setSelectedPostForComments,
    filteredRecipes
  } = useSearch(recipes);

  // Handler functions
  const handleLike = async (recipeId: number) => {
    try {
      await toggleLike(recipeId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async (recipeId: number) => {
    try {
      await toggleFavorite(recipeId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleCommentClick = (recipeId: number) => {
    setSelectedPostForComments(recipeId);
    if (!comments[recipeId] || comments[recipeId].length === 0) {
      fetchComments(recipeId);
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(`#${hashtag}`);
  };

  return (
    <ProtectedRoute>
      <div className={styles.feedContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <h2 className={styles.sidebarTitle}>Поиск фото</h2>
            
            {/* Search */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Stories */}
            <div className={styles.storiesSection}>
              <h3 className={styles.storiesTitle}>Сторисы</h3>
              <HighlightsSection
                highlights={highlights}
                loadingHighlights={loadingHighlights}
                onStoryClick={handleStoryClick}
              />
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

          {/* Posts List */}
          <PostsList
            recipes={filteredRecipes}
            loading={loading}
            likedRecipes={likedRecipes}
            favorites={favorites}
            onLike={handleLike}
            onCommentClick={handleCommentClick}
            onBookmark={handleBookmark}
            onHashtagClick={handleHashtagClick}
          />
        </main>

        {/* Right Sidebar */}
        <RightSidebar
          recipes={recipes}
          loading={loading}
        />

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

        {/* Highlight Viewer */}
        {selectedHighlight && (
          <HighlightViewer
            highlight={selectedHighlight}
            showHighlightViewer={showHighlightViewer}
            videoControls={videoControls}
            onClose={closeHighlightViewer}
            onVideoTimeUpdate={handleVideoTimeUpdate}
            onVideoLoadedMetadata={handleVideoLoadedMetadata}
            onVideoPlay={handleVideoPlay}
            onVideoPause={handleVideoPause}
            onVideoEnded={handleVideoEnded}
            onTogglePlay={toggleVideoPlay}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleVideoMute}
            formatTime={formatTime}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}