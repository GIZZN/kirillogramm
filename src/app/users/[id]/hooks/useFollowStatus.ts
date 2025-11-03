'use client';

import { useState, useEffect } from 'react';

export function useFollowStatus(userId: string, initialFollowingCount?: number) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount || 0);
  const [followingLoading, setFollowingLoading] = useState(false);

  // Update following count when initial value changes
  useEffect(() => {
    if (initialFollowingCount !== undefined) {
      setFollowingCount(initialFollowingCount);
    }
  }, [initialFollowingCount]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/follow`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          setFollowersCount(data.followersCount);
        }
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    if (userId) {
      fetchFollowStatus();
    }
  }, [userId]);

  const handleFollow = async () => {
    if (followingLoading) return;
    
    try {
      setFollowingLoading(true);
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при изменении подписки');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Ошибка при изменении подписки');
    } finally {
      setFollowingLoading(false);
    }
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    followingLoading,
    handleFollow
  };
}
