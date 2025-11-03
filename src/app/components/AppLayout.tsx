'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import StaggeredMenu from '../menu/menu';
import AuthModal from './AuthModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const items = [
    { label: 'Главная', ariaLabel: 'Перейти на главную страницу', link: '/' },
    { label: 'Лента', ariaLabel: 'Посмотреть ленту постов', link: '/feed' },
    { label: 'Сохраненные', ariaLabel: 'Мои сохраненные посты', link: '/favorites' },
    { label: 'Профиль', ariaLabel: 'Мой профиль', link: '/profile' },
    { label: 'Сообщения', ariaLabel: 'Мои сообщения', link: '/messages' },
  ];

  const socialItems = [
    { label: 'Instagram', link: '#' },
    { label: 'Telegram', link: '#' },
    { label: 'VK', link: '#' }
  ];

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      router.push('/profile');
    }
  };

  return (
    <>
      <Header
        logoText="Kirillogramm"
        onProfileClick={handleProfileClick}
        isAuthenticated={isAuthenticated}
        user={user}
      />
      <StaggeredMenu
        items={items}
        socialItems={socialItems}
        position="right"
        displaySocials={true}
      />
      {children}
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
