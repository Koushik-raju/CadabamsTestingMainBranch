// Re-exports from feature-scoped locations — consumers should update imports.
export { useJourneys } from '@/hooks/journeys/use-journeys-page';
export {
  useJourneyDetail,
  useJourneyProgress,
  useEnrolledJourneys,
  useGamification,
  subscribeToJourney,
  tickJourney,
  updateNodeProgress,
  type JourneyProgress,
} from '@/hooks/journeys/use-journey-detail';
