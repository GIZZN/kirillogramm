'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Comment, PublicRecipe } from '../types';
import styles from './CommentsSidebar.module.css';
import { 
  HiXMark, 
  HiHeart, 
  HiChatBubbleLeft, 
  HiEllipsisVertical,
  HiPaperAirplane,
  HiOutlineHeart
} from 'react-icons/hi2';

interface CommentsSidebarProps {
  recipe: PublicRecipe | null;
  comments: Comment[];
  loading: boolean;
  submitting: boolean;
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<void>;
  onClose: () => void;
}

interface CommentItemProps {
  comment: Comment;
  onAddReply: (content: string, parentId: number) => Promise<void>;
  onToggleLike: (commentId: number) => Promise<void>;
  level?: number;
}

function CommentItem({ comment, onAddReply, onToggleLike, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      await onAddReply(replyContent, comment.id);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      await onToggleLike(comment.id);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className={`${styles.comment} ${level > 0 ? styles.reply : ''}`}>
      <div className={styles.commentAvatar}>
        <div className={styles.avatar}>
          {comment.author_avatar ? (
            <Image 
              src={comment.author_avatar} 
              alt={comment.author_name}
              width={32}
              height={32}
            />
          ) : (
            comment.author_name.charAt(0).toUpperCase()
          )}
        </div>
      </div>
      
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <Link href={`/users/${comment.author_id}`} className={styles.authorName}>
            @{comment.author_name}
          </Link>
          <span className={styles.commentTime}>{formatDate(comment.created_at)}</span>
          <button className={styles.commentMenu}>
            <HiEllipsisVertical />
          </button>
        </div>
        
        <div className={styles.commentText}>
          <p>{comment.content}</p>
        </div>
        
        <div className={styles.commentActions}>
          <button 
            className={`${styles.likeButton} ${comment.is_liked_by_user ? styles.liked : ''}`}
            onClick={handleToggleLike}
          >
            {comment.is_liked_by_user ? <HiHeart /> : <HiOutlineHeart />}
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>
          
          {level < 1 && (
            <button 
              className={styles.replyButton}
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Ответить
            </button>
          )}
        </div>

        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className={styles.replyForm}>
            <div className={styles.replyInputContainer}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Добавьте ответ..."
                className={styles.replyInput}
                rows={2}
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className={styles.sendButton}
              >
                <HiPaperAirplane />
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onAddReply={onAddReply}
                onToggleLike={onToggleLike}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSidebar({
  recipe,
  comments,
  loading,
  submitting,
  onAddComment,
  onToggleLike,
  onClose
}: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!recipe) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />
      
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.postInfo}>
            <div className={styles.postImage}>
              {recipe.has_image ? (
                <Image
                  src={`/api/recipes/${recipe.id}/image`}
                  alt={recipe.title}
                  width={48}
                  height={48}
                  className={styles.postThumbnail}
                />
              ) : (
                <div className={styles.placeholderThumbnail}>
                  📸
                </div>
              )}
            </div>
            <div className={styles.postDetails}>
              <h3 className={styles.postTitle}>{recipe.title}</h3>
              <p className={styles.postAuthor}>@{recipe.author_name}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <HiXMark />
          </button>
        </div>

        {/* Comments Count */}
        <div className={styles.commentsCount}>
          <HiChatBubbleLeft />
          <span>{comments.length} комментариев</span>
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className={styles.addCommentForm}>
          <div className={styles.inputContainer}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Добавьте комментарий..."
              className={styles.commentInput}
              rows={3}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className={styles.submitButton}
            >
              {submitting ? (
                <div className={styles.spinner} />
              ) : (
                <HiPaperAirplane />
              )}
            </button>
          </div>
          <div className={styles.inputFooter}>
            <span className={styles.charCount}>
              {newComment.length}/1000
            </span>
          </div>
        </form>

        {/* Comments List */}
        <div className={styles.commentsList}>
          {loading ? (
            <>
              {[...Array(3)].map((_, index) => (
                <div key={index} className={styles.commentSkeleton}>
                  <div className={styles.commentSkeletonAvatar}></div>
                  <div className={styles.commentSkeletonContent}>
                    <div className={styles.commentSkeletonHeader}>
                      <div className={styles.commentSkeletonName}></div>
                      <div className={styles.commentSkeletonTime}></div>
                    </div>
                    <div className={styles.commentSkeletonText}></div>
                    <div className={styles.commentSkeletonActions}>
                      <div className={styles.commentSkeletonAction}></div>
                      <div className={styles.commentSkeletonAction}></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onAddReply={onAddComment}
                onToggleLike={onToggleLike}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <HiChatBubbleLeft size={48} />
              <h4>Пока нет комментариев</h4>
              <p>Будьте первым, кто оставит комментарий к этому посту!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
