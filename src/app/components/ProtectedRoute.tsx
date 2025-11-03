'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !hasRedirected) {
      setHasRedirected(true);
      router.replace('/');
    }
  }, [isAuthenticated, loading, router, hasRedirected]);

  // Показываем children сразу, редирект происходит в фоне
  if (!isAuthenticated && !loading) {
    return null;
  }

  return <>{children}</>;
}
