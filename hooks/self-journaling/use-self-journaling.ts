import { selfJournalingKey } from "@/lib/swr-keys";
import {
  journalingControllerCreateEntry,
  journalingControllerDeleteEntry,
  journalingControllerListMine,
  journalingControllerUpdateEntry,
} from "@/sdk/backend-v2";
import type {
  CreateJournalEntryDto,
  JournalEntryResponseDto,
  UpdateJournalEntryDto,
} from "@/sdk/backend-v2";
import useSWR from "swr";

export type { JournalEntryResponseDto };

export interface JournalPrompt {
  heading: string;
  text: string;
}

export interface JournalEntry {
  id: string;
  entry?: string;
  prompts?: JournalPrompt[];
  createdAt: string;
  journaledAt: string;
}

function extractString(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    for (const k of ["en", "value", "text", "content"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return "";
}

function mapPrompts(raw: Array<Array<unknown>>): JournalPrompt[] {
  return raw
    .map((item) => {
      // Each item may be an object { heading, text } or array [heading, text]
      if (Array.isArray(item)) {
        return { heading: String(item[0] ?? ""), text: String(item[1] ?? "") };
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        return { heading: extractString(o.heading), text: extractString(o.text) };
      }
      return null;
    })
    .filter((p): p is JournalPrompt => p !== null && (!!p.heading || !!p.text));
}

export function mapDtoToEntry(dto: JournalEntryResponseDto): JournalEntry {
  const prompts = mapPrompts(dto.prompts ?? []);
  const entry =
    extractString(dto.entryText) ||
    prompts.map((p) => `${p.heading}\n${p.text}`).join("\n\n") ||
    undefined;
  return {
    id: dto.id,
    entry,
    prompts: prompts.length > 0 ? prompts : undefined,
    createdAt: dto.createdAt,
    journaledAt: dto.journaledAt,
  };
}

export function useSelfJournaling() {
  const { data, error, isLoading, mutate } = useSWR<JournalEntry[]>(
    selfJournalingKey(),
    async () => {
      const res = await journalingControllerListMine({ path: { campus: "cadabams" } });
      const entries = (res.data ?? []) as JournalEntryResponseDto[];
      return entries
        .map(mapDtoToEntry)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  );

  return { entries: data ?? [], isLoading, error, mutate };
}

export async function createEntry(
  body: CreateJournalEntryDto,
): Promise<JournalEntryResponseDto | null> {
  const res = await journalingControllerCreateEntry({ path: { campus: "cadabams" }, body });
  return (res.data as JournalEntryResponseDto | undefined) ?? null;
}

export async function updateEntry(
  id: string,
  body: UpdateJournalEntryDto,
): Promise<JournalEntryResponseDto | null> {
  const res = await journalingControllerUpdateEntry({ path: { campus: "cadabams", id }, body });
  return (res.data as JournalEntryResponseDto | undefined) ?? null;
}

export async function deleteEntry(id: string): Promise<void> {
  await journalingControllerDeleteEntry({ path: { campus: "cadabams", id } });
}
