/**
 * FILE: app/(auth)/home/page.tsx
 *
 * PURPOSE:
 *   Root home screen shown after authentication. Composes all home section
 *   components and routes quick-action taps to their respective pages.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches upcoming appointments via useHomePage().
 *   2. Fetches user's enrolled journeys (useEnrolledJourneys) and gamification
 *      streak (useGamification) to feed real data into JourneySection.
 *   3. handleAction dispatches router.push based on action type + subtype.
 *   4. Renders HomeHeader (gradient), then main content pulled up over the
 *      header with a negative top margin and rounded corners.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   appointments        — upcoming appointment list from useHomePage
 *   homeEnrollments     — enriched enrolled journeys for JourneySection
 *   handleAction        — central router dispatcher for all home interactions
 *
 * DEPENDENCIES:
 *   useHomePage            — provides upcoming appointments
 *   useEnrolledJourneys    — lists user's active journey enrollments
 *   useGamification        — provides daily streak count
 *   HomeHeader             — gradient hero header with mood CTA
 *   UpcomingSession        — next appointment card
 *   SupportSection         — talk-to-therapist / match-me CTAs
 *   QuickActions           — 2-column grid of feature shortcuts
 *   JourneySection         — active enrolled journey list with progress
 *
 * LAST UPDATED: 2026-04-22 — pass real enrolled journeys and streak to JourneySection
 */

"use client";

import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/home/home-header";
import { SupportSection } from "@/components/home/support-section";
import { QuickActions } from "@/components/home/quick-actions";
import { UpcomingSession } from "@/components/home/upcoming-session";
import { JourneySection } from "@/components/home/journey-section";
import { useHomePage } from "@/hooks/home/use-home-page";
import { useEnrolledJourneys, useGamification } from "@/hooks/journeys/use-journey-detail";
import { useMemo } from "react";

export default function HomePage() {
  const router = useRouter();
  const { upcoming: appointments } = useHomePage();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrolledJourneys();
  const { gamification } = useGamification();

  const homeEnrollments = useMemo(
    () =>
      enrollments.map((e) => ({
        enrollmentId: e.id,
        journeyId: e.journeyId,
        name: e.name ?? '',
        currentDay: e.currentDay ?? 1,
        totalDays: e.totalDays ?? 0,
      })),
    [enrollments]
  );

  const handleAction = (type: string, subtype?: string) => {
    switch (type) {
      case "quick_action":
        switch (subtype) {
          case "appointments":
            router.push("/consult/appointments");
            break;
          case "therapist":
            router.push("/consult/find-therapist");
            break;
          case "match":
            router.push("/consult/find-therapist");
            break;
          case "assessment":
            router.push("/assessments");
            break;
          case "journey":
            router.push("/journeys");
            break;
          case "journal":
            router.push("/self-journaling");
            break;
          case "breathe":
            router.push("/wellness/resources");
            break;
          case "packages":
            router.push("/packages");
            break;
          case "mindful-minutes":
            router.push("/wellness/mindful-minutes");
            break;
          case "chat":
            router.push("/chat");
            break;
          case "videos":
            router.push("/wellness/video");
            break;
          case "documents":
            router.push("/documents");
            break;
          case "prescriptions":
            router.push("/prescriptions");
            break;
        }
        break;
      case "join_session":
        router.push("/consult/appointments");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader
        onMoodClick={() => router.push("/assessment/avym73d4x6258t3ligurl56r")}
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

        <JourneySection
          enrollments={homeEnrollments}
          streak={gamification?.streakCount ?? 0}
          isLoading={enrollmentsLoading}
        />
      </div>
    </div>
  );
}
