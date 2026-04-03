import { doc, getDoc } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { firestore, database } from '@/lib/firebase';

export interface AssignedAssessmentRaw {
  id?: string | number;
  documentId?: string;
  title?: string;
  description?: string;
  category?: string | string[];
  assignedAt?: string;
  status?: string;
  forJourney?: boolean;
  hint?: string | null;
}

export interface AssignedAssessmentItem {
  documentId: string;
  id: string | number | undefined;
  label: string;
  description: string;
  category: string[];
  assignedAt: string | undefined;
  status: string;
  isCompleted: boolean;
  lastUsed: string;
  forJourney: boolean;
}

export interface AssignedWorksheetRaw {
  id?: string | number;
  documentId?: string;
  title?: string;
  label?: string;
  description?: string;
  category?: string | string[];
  assignedAt?: string;
  status?: string;
  image?: string | null;
}

export interface AssignedWorksheetItem {
  documentId: string;
  id: string | number | undefined;
  label: string;
  description: string;
  category: string[];
  assignedAt: string | undefined;
  status: string;
  isCompleted: boolean;
  lastUsed: string;
  image: string | null;
}

async function checkAssessmentCompletion(leadId: string, assessmentId: string): Promise<string | null> {
  try {
    const dbPath = `assessments/${leadId}/${assessmentId}`;
    const snap = await get(ref(database, dbPath));
    if (!snap.exists()) return null;
    const values = Object.values(snap.val() as Record<string, { date?: string }>);
    const dates = values.map((v) => v.date).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  } catch {
    return null;
  }
}

async function checkWorksheetCompletion(leadId: string, worksheetId: string): Promise<string | null> {
  try {
    const snap = await get(ref(database, `worksheets/${leadId}/${worksheetId}`));
    if (!snap.exists()) return null;
    const values = Object.values(snap.val() as Record<string, { date?: string; completedAt?: string; timestamp?: string }>);
    const dates = values
      .map((v) => v.date || v.completedAt || v.timestamp)
      .filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  } catch {
    return null;
  }
}

export async function getAssignedAssessments(leadId: string): Promise<AssignedAssessmentItem[]> {
  try {
    const docRef = doc(firestore, 'patient_assignments', leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];

    const data = docSnap.data();
    const assignments: AssignedAssessmentRaw[] = data.assessments || [];

    return Promise.all(
      assignments.map(async (assigned) => {
        const documentId = String(assigned.id || assigned.documentId || '');
        const lastCompletion = documentId ? await checkAssessmentCompletion(leadId, documentId) : null;
        return {
          documentId,
          id: assigned.id,
          label: assigned.title || 'Untitled Assessment',
          description: assigned.description || '',
          category: assigned.category
            ? Array.isArray(assigned.category)
              ? assigned.category
              : [assigned.category]
            : [],
          assignedAt: assigned.assignedAt,
          status: assigned.status || 'assigned',
          forJourney: assigned.forJourney || false,
          isCompleted: !!lastCompletion,
          lastUsed: lastCompletion || '1970-01-01T00:00:00Z',
        };
      })
    );
  } catch {
    return [];
  }
}

export async function getAssignedWorksheets(leadId: string): Promise<AssignedWorksheetItem[]> {
  try {
    const docRef = doc(firestore, 'patient_assignments', leadId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];

    const data = docSnap.data();
    const worksheets: AssignedWorksheetRaw[] = data.worksheets || [];

    return Promise.all(
      worksheets.map(async (assigned) => {
        const documentId = String(assigned.id || assigned.documentId || '');
        const lastCompletion = documentId ? await checkWorksheetCompletion(leadId, documentId) : null;
        return {
          documentId,
          id: assigned.id,
          label: assigned.title || assigned.label || 'Untitled Worksheet',
          description: assigned.description || '',
          category: assigned.category
            ? Array.isArray(assigned.category)
              ? assigned.category
              : [assigned.category]
            : [],
          assignedAt: assigned.assignedAt,
          status: assigned.status || 'assigned',
          isCompleted: !!lastCompletion,
          lastUsed: lastCompletion || '1970-01-01T00:00:00Z',
          image: assigned.image || null,
        };
      })
    );
  } catch {
    return [];
  }
}
