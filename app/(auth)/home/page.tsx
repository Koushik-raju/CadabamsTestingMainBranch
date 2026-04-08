"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/home/home-header";
import { SupportSection } from "@/components/home/support-section";
import { QuickActions } from "@/components/home/quick-actions";
import { Recommendations } from "@/components/home/recommendations";
import { UpcomingSession } from "@/components/home/upcoming-session";
import { JourneySection } from "@/components/home/journey-section";
import { useAuth } from "@/hooks/use-auth";
import { getAppointments } from "@/sdk/auth-and-crm";
import type { AppointmentDetail } from "@/sdk/auth-and-crm";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const profileImage = user?.profile_image as string | undefined;
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);

  useEffect(() => {
    if (!user) return;
    getAppointments({ query: { start_datetime: new Date().toISOString() } })
      .then((res) => setAppointments(res.data ?? []))
      .catch(console.error);
  }, [user]);

  const handleAction = (type: string, subtype?: string) => {
    switch (type) {
      case "quick_action":
        switch (subtype) {
          case "therapist":
            router.push("/find-therapist");
            break;
          case "match":
            router.push("/find-therapist");
            break;
          case "assessment":
            router.push("/assessments");
            break;
          case "journey":
            router.push("/journey");
            break;
          case "journal":
            router.push("/self-journaling");
            break;
          case "breathe":
            router.push("/wellness-resources");
            break;
        }
        break;
      case "recommendation":
        router.push(`/wellness-resources/${subtype}`);
        break;
      case "join_session":
        router.push("/appointments");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Notification bell — top-right overlay */}
      <div className="absolute top-4 right-16 z-30">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => router.push("/notifications")}
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      <HomeHeader
        userName={(user?.caller_name as string | undefined) ?? "There"}
        profileImage={profileImage}
        onMoodClick={() =>
          router.push("/assessment/form?id=avym73d4x6258t3ligurl56r")
        }
      />

      {/* Main content — overlaps header by pulling up with negative margin */}
      <div className="relative mt-[-20px] pt-8 pb-20 bg-background rounded-t-2xl z-10 flex flex-col gap-0">
        <UpcomingSession
          appointments={appointments}
          onJoin={() => handleAction("join_session")}
        />

        <SupportSection
          onTalk={() => handleAction("quick_action", "therapist")}
          onMatch={() => handleAction("quick_action", "match")}
        />

        <QuickActions
          onActionClick={(type) => handleAction("quick_action", type)}
        />

        <JourneySection />

        <Recommendations
          onRecommendClick={(id) => handleAction("recommendation", id)}
        />
      </div>
    </div>
  );
}
