/**
 * FILE: app/(auth)/home/page.tsx
 *
 * PURPOSE:
 *   Root home screen shown after authentication. Composes all home section
 *   components and routes quick-action taps to their respective pages.
 *   Sets status bar color to match the orange gradient header.
 *
 * LOGIC OVERVIEW:
 *   1. useEffect on mount sets status bar to orange (#f97316) for home page visual cohesion.
 *   2. Cleanup restores default cream (#fffdf9) when navigating away.
 *   3. Fetches upcoming appointments via useHomePage().
 *   4. Fetches enrolled journeys (useEnrolledJourneys) and gamification streak (useGamification).
 *   5. handleAction dispatches router.push based on action type + subtype.
 *   6. Renders HomeHeader (gradient), then main content pulled up with negative margin + rounded corners.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   appointments        — upcoming appointment list from useHomePage
 *   homeEnrollments     — enriched enrolled journeys for JourneySection
 *   handleAction        — central router dispatcher for all home interactions
 *
 * DEPENDENCIES:
 *   useEffect, useMemo                — react
 *   useRouter                         — next/navigation
 *   setStatusBarColor                 — lib/capacitor/status-bar
 *   useHomePage                       — hooks/home/use-home-page
 *   useEnrolledJourneys, useGamification — hooks/journeys/use-journey-detail
 *   HomeHeader, UpcomingSession, SupportSection, QuickActions, JourneySection, TrackerBar, GrowthWidget — home components
 *
 * LAST UPDATED: 2026-05-05 — add status bar color override for orange header (Phase 3.5)
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { GrowthWidget } from "@/components/home/growth-widget";
import { HomeHeader } from "@/components/home/home-header";
import { JourneySection } from "@/components/home/journey-section";
import { QuickActions } from "@/components/home/quick-actions";
import { SupportSection } from "@/components/home/support-section";
import { TrackerBar } from "@/components/home/tracker-bar";
import { UpcomingSession } from "@/components/home/upcoming-session";
import { useHomePage } from "@/hooks/home/use-home-page";
import { useEnrolledJourneys, useGamification } from "@/hooks/journeys/use-journey-detail";
import { setStatusBarColor } from "@/lib/capacitor/status-bar";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    /*
     * Home page has a coral-orange gradient header.
     * Override the default cream status bar to orange on mount,
     * and restore cream when navigating away (cleanup).
     */
    setStatusBarColor("#f97316");
    return () => {
      setStatusBarColor("#fffdf9");
    };
  }, []);

  const { upcoming: appointments } = useHomePage();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrolledJourneys();
  const { gamification } = useGamification();

  /* Take only the most recent enrollment (last in the API response) to show a
     single active journey card on the home screen. */
  const homeEnrollments = useMemo(() => {
    const latest = enrollments[enrollments.length - 1];
    if (!latest) return [];
    return [
      {
        enrollmentId: latest.id,
        journeyId: latest.journeyId,
        name: latest.name ?? "",
        currentDay: latest.currentDay ?? 1,
        totalDays: latest.totalDays ?? 0,
        icon: latest.icon ?? null,
      },
    ];
  }, [enrollments]);

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
            router.push("/consult/find-therapist?start=wizard");
            break;
          case "assessment":
            router.push("/assessments");
            break;
          case "mood-tracker":
            router.push("/mood-tracker");
            break;
          case "stress-tracker":
            router.push("/stress-tracker");
            break;
          case "sleep-tracker":
            router.push("/sleep-tracker");
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
    <div className="min-h-screen">
      <HomeHeader />

      {/* Main content — overlaps header by pulling up with negative margin */}
      <div className="relative mt-[-20px] pt-8 pb-20 bg-background rounded-t-2xl z-10 flex flex-col gap-0">
        <UpcomingSession appointments={appointments} onJoin={() => handleAction("join_session")} />

        <SupportSection
          onTalk={() => handleAction("quick_action", "therapist")}
          onMatch={() => handleAction("quick_action", "match")}
        />

        <TrackerBar onTrackerClick={(key) => handleAction("quick_action", key)} />

        <QuickActions onActionClick={(type) => handleAction("quick_action", type)} />

        <JourneySection
          enrollments={homeEnrollments}
          streak={gamification?.streak ?? 0}
          isLoading={enrollmentsLoading}
        />

        <GrowthWidget />
      </div>
    </div>
  );
}
