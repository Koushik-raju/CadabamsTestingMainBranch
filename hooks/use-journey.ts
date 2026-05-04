// Re-exports from feature-scoped locations — consumers should update imports.

export {
  type JourneyProgress,
  subscribeToJourney,
  tickJourney,
  updateNodeProgress,
  useEnrolledJourneys,
  useGamification,
  useJourneyDetail,
  useJourneyProgress,
} from "@/hooks/journeys/use-journey-detail";
export { useJourneys } from "@/hooks/journeys/use-journeys-page";
