'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/config/env';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
export { app };
