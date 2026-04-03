'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Camera, Pencil, Check, X, LogOut, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

async function getStorage() {
  const { storage } = await import('@/lib/firebase');
  return storage;
}

function compressImage(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 128;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profileImage, updateProfileImage, logout } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const callerName = user?.caller_name as string | undefined;
  const callerMobile = user?.caller_mobile as string | undefined;
  const callerEmail = user?.caller_email as string | undefined;

  useEffect(() => {
    if (callerName) setNameValue(callerName);
  }, [callerName]);

  const uploadProfileImage = async (blob: Blob) => {
    if (!user?.lead_id) return;
    setIsUploading(true);
    try {
      const storage = await getStorage();
      const ref = storageRef(storage, `profile_images/${user.lead_id}.jpg`);
      const task = uploadBytesResumable(ref, blob);

      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', null, reject, async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            updateProfileImage(`${url}?t=${Date.now()}`);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = async () => {
    const { Capacitor } = await import('@capacitor/core').catch(() => ({ Capacitor: null }));

    if (Capacitor?.isNativePlatform()) {
      try {
        const { ActionSheet, ActionSheetButtonStyle } = await import('@capacitor/action-sheet');
        const result = await ActionSheet.showActions({
          title: 'Change Profile Picture',
          message: 'Select an option',
          options: [
            { title: 'Take Photo' },
            { title: 'Choose from Gallery' },
            { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
          ],
        });
        if (result.index === 0 || result.index === 1) {
          const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
          const photo = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Uri,
            source: result.index === 0 ? CameraSource.Camera : CameraSource.Photos,
            width: 512,
            height: 512,
            correctOrientation: true,
          });
          if (photo.webPath) {
            const response = await fetch(photo.webPath);
            let blob = await response.blob();
            if (blob.size > 1_048_576) blob = await compressImage(blob);
            await uploadProfileImage(blob);
          }
        }
      } catch {
        toast.error('Camera error — please try again');
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        let blob: Blob = file;
        if (blob.size > 1_048_576) blob = await compressImage(blob);
        await uploadProfileImage(blob);
      };
      input.click();
    }
  };

  const handleSaveName = async () => {
    if (!user?.lead_id || nameValue.trim() === callerName) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await authService.updatePatientName(user.lead_id, nameValue.trim());
      const result = res?.result as { success?: boolean } | undefined;
      if (result?.success || (res as { success?: boolean })?.success) {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          u.caller_name = nameValue.trim();
          u.patient_name = nameValue.trim();
          u.partner_name = nameValue.trim();
          localStorage.setItem('user', JSON.stringify(u));
        }
        toast.success('Name updated');
        setIsEditingName(false);
      } else {
        throw new Error('Failed to update name');
      }
    } catch {
      toast.error('Could not update name');
      setNameValue(callerName ?? '');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.lead_id) return;
    setIsDeletingAccount(true);
    try {
      await authService.deleteAccount(user.lead_id);
      logout();
      router.replace('/login');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col gap-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="home-header-gradient px-4 pt-12 pb-16 text-white">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
      </div>

      {/* Avatar — overlaps gradient header */}
      <div className="flex justify-center mt-[-48px] mb-4 z-10 relative">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted">
            {profileImage && profileImage !== '/profile.png' ? (
              <Image src={profileImage} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <button
            onClick={handleImageSelect}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background disabled:opacity-60"
            aria-label={isUploading ? 'Uploading…' : 'Change profile picture'}
          >
            <Camera className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div className="flex-1 px-4 pb-8 flex flex-col gap-5 max-w-sm mx-auto w-full">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              disabled={!isEditingName || isSavingName}
            />
            {isEditingName ? (
              <>
                <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={isSavingName} aria-label="Save name">
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setIsEditingName(false); setNameValue(callerName ?? ''); }}
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} aria-label="Edit name">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Phone (read-only) */}
        <div className="flex flex-col gap-1.5">
          <Label>Mobile Number</Label>
          <Input value={callerMobile ?? ''} disabled />
        </div>

        {/* Email (read-only) */}
        {callerEmail && (
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={callerEmail} disabled />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {/* Logout */}
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          {/* Delete account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isDeletingAccount}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeletingAccount ? 'Deleting…' : 'Delete Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent. All your data will be removed and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
