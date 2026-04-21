// Re-exports from new feature-scoped locations — consumers should update imports
export {
  useAssessments,
  useFilteredAssessments,
  useAssignedAssessments,
  getDynamicCategories,
  mapAssessment,
  mapStrapiAssessment,
  type AssessmentItem,
} from '@/hooks/assessments/use-assessments-page';

export {
  useAssessmentById,
  useAssessmentSubmissions,
  useAssessmentScoreSummary,
  submitAssessment,
} from '@/hooks/assessments/use-assessment-detail';
