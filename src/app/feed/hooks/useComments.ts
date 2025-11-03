import { useState, useCallback } from 'react';
import { Comment } from '../types';

interface User {
  id: number;
  name: string;
  avatarUrl?: string | null;
}

export function useComments(currentUser?: User | null) {
  const [comments, setComments] = useState<{ [recipeId: number]: Comment[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [recipeId: number]: boolean }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [recipeId: number]: boolean }>({});

  // Загрузка комментариев для рецепта
  const fetchComments = useCallback(async (recipeId: number) => {
    try {
      setLoadingComments(prev => ({ ...prev, [recipeId]: true }));
      
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Группируем комментарии по parent_id для создания структуры ответов
        const commentsMap = new Map<number, Comment>();
        const rootComments: Comment[] = [];
        
        // Сначала создаем все комментарии
        data.comments.forEach((comment: Comment) => {
          commentsMap.set(comment.id, { 
            ...comment, 
            replies: [],
            is_liked_by_user: comment.is_liked_by_user || false
          });
        });
        
        // Затем группируем их
        data.comments.forEach((comment: Comment) => {
          const commentWithReplies = commentsMap.get(comment.id)!;
          
          if (comment.parent_id) {
            const parent = commentsMap.get(comment.parent_id);
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(commentWithReplies);
            }
          } else {
            rootComments.push(commentWithReplies);
          }
        });
        
        setComments(prev => ({ ...prev, [recipeId]: rootComments }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [recipeId]: false }));
    }
  }, []);

  // Добавление нового комментария
  const addComment = useCallback(async (recipeId: number, content: string, parentId?: number) => {
    try {
      setSubmittingComment(prev => ({ ...prev, [recipeId]: true }));
      
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          parent_id: parentId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newComment: Comment = { 
          ...data.comment,
          author_id: currentUser?.id || data.comment.author_id,
          author_name: currentUser?.name || data.comment.author_name,
          author_avatar: currentUser?.avatarUrl || data.comment.author_avatar,
          replies: [],
          is_liked_by_user: false
        };
        
        setComments(prev => {
          const currentComments = prev[recipeId] || [];
          
          if (parentId) {
            // Добавляем ответ к существующему комментарию
            const updateComments = (comments: Comment[]): Comment[] => {
              return comments.map(comment => {
                if (comment.id === parentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newComment]
                  };
                }
                if (comment.replies) {
                  return {
                    ...comment,
                    replies: updateComments(comment.replies)
                  };
                }
                return comment;
              });
            };
            
            return { ...prev, [recipeId]: updateComments(currentComments) };
          } else {
            // Добавляем новый корневой комментарий
            return { ...prev, [recipeId]: [...currentComments, newComment] };
          }
        });
        
        return data.comment;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при добавлении комментария');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    } finally {
      setSubmittingComment(prev => ({ ...prev, [recipeId]: false }));
    }
  }, [currentUser]);

  // Лайк комментария
  const toggleCommentLike = useCallback(async (recipeId: number, commentId: number) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Обновляем количество лайков и состояние лайка в комментарии
        setComments(prev => {
          const currentComments = prev[recipeId] || [];
          
          const updateCommentLikes = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment.id === commentId) {
                return { 
                  ...comment, 
                  likes_count: data.likesCount,
                  is_liked_by_user: data.isLiked
                };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: updateCommentLikes(comment.replies)
                };
              }
              return comment;
            });
          };
          
          return { ...prev, [recipeId]: updateCommentLikes(currentComments) };
        });
        
        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при изменении лайка');
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      throw error;
    }
  }, []);

  return {
    comments,
    loadingComments,
    submittingComment,
    fetchComments,
    addComment,
    toggleCommentLike
  };
}
