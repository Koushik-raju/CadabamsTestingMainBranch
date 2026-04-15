// Re-exports from new feature-scoped locations — consumers should update imports
export {
  useAssessments,
  useFilteredAssessments,
  useAssignedAssessments,
  categorizeAssessments,
  getDynamicCategories,
  mapAssessment,
  mapStrapiAssessment,
  type AssessmentItem,
  type AssignedAssessmentItem,
  type AssessmentCategories,
  type StrapiPage,
} from '@/hooks/assessments/use-assessments-page';

export {
  useAssessmentById,
  useAssessmentSubmissions,
  useAssessmentScoreSummary,
  submitAssessment,
  type AssessmentSubmission,
} from '@/hooks/assessments/use-assessment-detail';
