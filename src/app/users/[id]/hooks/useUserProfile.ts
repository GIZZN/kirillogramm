'use client';

import { useState, useEffect } from 'react';
import { UserProfileData } from '../types';

export function useUserProfile(userId: string) {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Пользователь не найден');
          } else {
            setError('Ошибка при загрузке профиля');
          }
          return;
        }

        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Ошибка при загрузке профиля');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  return { profileData, loading, error };
}
