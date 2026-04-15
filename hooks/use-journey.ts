// Re-exports from new feature-scoped locations — consumers should update imports
export { useJourneys } from '@/hooks/journeys/use-journeys-page';
export {
  useJourneyDetail,
  useJourneyProgress,
  subscribeToJourney,
  advanceCurrentDay,
  updateNodeProgress,
  type JourneyProgress,
} from '@/hooks/journeys/use-journey-detail';
