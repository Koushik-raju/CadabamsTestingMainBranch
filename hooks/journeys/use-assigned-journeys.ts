/**
 * Doctor-assigned journeys from the same assigned-content payload as assessments.
 */
"use client";

import { useMemo } from "react";
import { usePatientAssignedContent } from "@/hooks/shared/use-patient-assigned-content";
import {
  getAssignedBucketItems,
  getAssignmentMetadata,
} from "@/lib/patient-assigned-content-buckets";

export interface AssignedJourneyItem {
  id: string;
  documentId: string;
  title: string;
  description: string | null;
  assignedAt: string | null;
  status: string | null;
}

function mapAssignedJourney(raw: unknown): AssignedJourneyItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const meta = getAssignmentMetadata(obj);
  const documentId =
    (typeof meta?.documentId === "string" && meta.documentId.trim()) ||
    (typeof obj.cmsJourneyId === "string" && obj.cmsJourneyId.trim()) ||
    "";
  if (!documentId) return null;

  const titleRaw = obj.title;
  const title = typeof titleRaw === "string" ? titleRaw : "Journey";
  const description = typeof obj.description === "string" ? obj.description : null;

  return {
    id: documentId,
    documentId,
    title,
    description,
    assignedAt: typeof obj.assignedAt === "string" ? obj.assignedAt : null,
    status: typeof obj.status === "string" ? obj.status : null,
  };
}

export function useAssignedJourneys(leadId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = usePatientAssignedContent(leadId);

  const mapped = useMemo(() => {
    if (!data) return [];
    const list = getAssignedBucketItems(data, "journeys");
    const seen = new Set<string>();
    const out: AssignedJourneyItem[] = [];
    for (const it of list) {
      const m = mapAssignedJourney(it);
      if (!m) continue;
      if (seen.has(m.documentId)) continue;
      seen.add(m.documentId);
      out.push(m);
    }
    return out;
  }, [data]);

  return { data: mapped, error, isLoading, isValidating, mutate };
}
