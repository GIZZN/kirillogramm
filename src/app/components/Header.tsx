"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import { HiCamera, HiUser, HiChatBubbleLeft } from 'react-icons/hi2';

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface HeaderProps {
  logoText?: string;
  onProfileClick?: () => void;
  isAuthenticated?: boolean;
  user?: User | null;
}

export default function Header({ 
  logoText = "PhotoVerse",
  onProfileClick = () => console.log('Profile clicked'),
  isAuthenticated = false,
  user = null
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo Section */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <HiCamera 
              size={24}
              className={styles.logoImage}
            />
          </div>
          <span className={styles.logoText}>{logoText}</span>
        </Link>

        {/* Navigation */}
        <div className={styles.navigation}>
          {isAuthenticated && (
            <>
              <Link href="/messages" className={styles.navLink}>
                <HiChatBubbleLeft size={20} />
              </Link>
              <Link href="/profile" className={styles.navLink}>
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl} 
                    alt={user.name}
                    width={28}
                    height={28}
                    className={styles.headerAvatar}
                  />
                ) : (
                  <HiUser size={20} />
                )}
              </Link>
            </>
          )}
          
          {!isAuthenticated && (
            <button 
              className={styles.profileIcon}
              onClick={onProfileClick}
              aria-label="Profile"
              title="Войти в аккаунт"
            >
              <HiUser size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
