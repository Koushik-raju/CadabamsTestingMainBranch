// Re-exports from new feature-scoped locations — consumers should update imports

export {
  submitAssessment,
  useAssessmentById,
  useAssessmentScoreSummary,
  useAssessmentSubmissions,
} from "@/hooks/assessments/use-assessment-detail";
export {
  type AssessmentItem,
  getDynamicCategories,
  mapAssessment,
  mapStrapiAssessment,
  useAssessments,
  useAssignedAssessments,
  useFilteredAssessments,
} from "@/hooks/assessments/use-assessments-page";
