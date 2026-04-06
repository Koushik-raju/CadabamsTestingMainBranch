"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-toastify";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { getPatientsMe } from "@/sdk/auth-and-crm/sdk.gen";

// SWR fetcher — calls SDK directly from client
async function fetchProfile() {
  const { data, error } = await getPatientsMe();
  if (error) throw error;
  return data;
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const { data: profile, isLoading } = useSWR("patients/me", fetchProfile, {
    onError: () => toast.error("Failed to load profile"),
  });

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const displayName = profile?.contact_name || profile?.partner_name || "—";

  if (isLoading) {
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
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted flex items-center justify-center">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 px-4 pb-8 flex flex-col gap-5 max-w-sm mx-auto w-full">
        <div className="flex flex-col gap-1.5">
          <Label>Full Name</Label>
          <Input value={displayName} disabled />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Mobile Number</Label>
          <Input value={profile?.caller_mobile ?? "—"} disabled />
        </div>

        {profile?.caller_email && (
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={profile.caller_email} disabled />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent. All your data will be removed and
                  cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() =>
                    toast.info("Please contact support to delete your account.")
                  }
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
