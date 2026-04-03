'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { User } from '@/types';

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

interface AuthContextValue {
  user: User | null;
  profileImage: string;
  login: (userData: User) => Promise<User>;
  logout: () => void;
  updateProfileImage: (url: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profileImage: '/profile.png',
  login: async (u) => u,
  logout: () => {},
  updateProfileImage: () => {},
});

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState('/profile.png');

  const fetchProfileImage = useCallback(async (leadId: string | number): Promise<string> => {
    const cacheKey = `profile_image_${leadId}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();

    if (cached) {
      try {
        const { url, timestamp } = JSON.parse(cached);
        if (now - timestamp < CACHE_EXPIRATION) return url;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      const ref = storageRef(storage, `profile_images/${leadId}.jpg`);
      const url = await getDownloadURL(ref);
      localStorage.setItem(cacheKey, JSON.stringify({ url, timestamp: now }));
      return url;
    } catch {
      return '/profile.png';
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem('user');
        if (!raw) return;
        const parsed: User = JSON.parse(raw);
        setUser(parsed);
        if (parsed?.lead_id) {
          setProfileImage(await fetchProfileImage(parsed.lead_id));
        }
      } catch {
        localStorage.removeItem('user');
      }
    })();
  }, [fetchProfileImage]);

  const login = useCallback(async (userData: User): Promise<User> => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData?.lead_id) {
      setProfileImage(await fetchProfileImage(userData.lead_id));
    }
    return userData;
  }, [fetchProfileImage]);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    setProfileImage('/profile.png');
  }, []);

  const updateProfileImage = useCallback((url: string) => {
    setProfileImage(url);
    if (user?.lead_id) {
      localStorage.setItem(
        `profile_image_${user.lead_id}`,
        JSON.stringify({ url, timestamp: Date.now() })
      );
    }
  }, [user]);

  return { user, profileImage, login, logout, updateProfileImage };
}

export const useAuth = () => useContext(AuthContext);
