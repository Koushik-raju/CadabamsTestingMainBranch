/**
 * FILE: hooks/use-worksheets.ts
 *
 * PURPOSE:
 *   Top-level barrel that re-exports the worksheet hooks and mutation helpers
 *   from `hooks/worksheets/`, so consumer pages and components can import from
 *   a single, stable path (`@/hooks/use-worksheets`).
 *
 * LOGIC OVERVIEW:
 *   Pure re-exports — no logic. Detail/submission hooks come from
 *   `./worksheets/use-worksheet-detail`; CMS browse + assigned hooks come from
 *   `./worksheets/use-worksheets-page`.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   analyzeWorksheet           — mutation: run LLM analysis on a submission
 *   submitWorksheet            — mutation: create a new submission
 *   presignWorksheetUpload     — mutation: presign S3 PUT for a worksheet file
 *   summarizeWorksheetUpload   — mutation: short LLM ack after upload
 *   useWorksheetById           — SWR: load a single CMS worksheet template
 *   useWorksheetSubmissionById — SWR: load a single patient submission
 *   useWorksheetSubmissions    — SWR: list patient submissions for a worksheet
 *   useWorksheets              — SWR: paginated CMS worksheets list
 *   useFilteredWorksheets      — SWR: filtered worksheets list (search/category)
 *   useAssignedWorksheets      — SWR: doctor-assigned worksheets bucket
 *   getWorksheetCategories     — derive unique category list from worksheets
 *   mapWorksheet               — map raw SDK DTO to flat WorksheetItem
 *   AssignedWorksheetItem      — type for an assigned worksheet row
 *   WorksheetItem              — type for a flattened worksheet
 *
 * DEPENDENCIES:
 *   ./worksheets/use-worksheet-detail
 *   ./worksheets/use-worksheets-page
 *
 * LAST UPDATED: 2026-05-06 — added presign/summarize upload mutation re-exports.
 */
export {
  analyzeWorksheet,
  presignWorksheetUpload,
  submitWorksheet,
  summarizeWorksheetUpload,
  useWorksheetById,
  useWorksheetSubmissionById,
  useWorksheetSubmissions,
  type WorksheetSubmissionResponseDto,
} from "./worksheets/use-worksheet-detail";
export {
  type AssignedWorksheetItem,
  getWorksheetCategories,
  mapWorksheet,
  useAssignedWorksheets,
  useFilteredWorksheets,
  useWorksheets,
  type WorksheetItem,
} from "./worksheets/use-worksheets-page";
