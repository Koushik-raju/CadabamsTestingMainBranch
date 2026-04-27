/**
 * FILE: app/(auth)/assessments/page.tsx
 *
 * PURPOSE:
 *   Assessments listing page with two tabs: "Explore" (browse CMS assessments)
 *   and "My Assessments" (patient's completed assessments via useAssignedAssessments).
 *
 * LOGIC OVERVIEW:
 *   1. Renders a two-tab layout — "Explore" and "My Assessments".
 *   2. Explore tab: fetches paginated CMS assessments via useAssessments() with
 *      infinite scroll; supports keyword search (debounced 400 ms) and a
 *      horizontal-scrollable category pill row below the search bar.
 *      When category ≠ "All" or search is active, delegates to useFilteredAssessments
 *      which passes search and category to the backend. First item in the unfiltered
 *      list is rendered as a RecommendedAssessmentCard; the rest as AssessmentGridCards.
 *   3. My Assessments tab: fetches the patient's doctor-assigned assessments via
 *      useAssignedAssessments(leadId), which reads the LeadContentAssignment row
 *      via /patient/assigned-content. Shows a count badge on the tab trigger.
 *      Delegates rendering to AssignmentsList; shows AssignmentsSkeleton while
 *      loading and AssessmentEmptyState on empty results.
 *   4. Navigation: tapping a browse card or an assigned assessment routes to
 *      /assessments/:documentId/details (the assessment landing page).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   activeTab            — controlled Tabs value ('browse' | 'assessments')
 *   searchTerm           — raw search input value
 *   debouncedSearch      — 400 ms debounced version used for API calls
 *   activeCategory       — selected category pill (string, "All" = no filter)
 *   allAssessments       — flattened SWR pages from useAssessments()
 *   browseItems          — allAssessments[1..] (unfiltered infinite-scroll list)
 *   filteredItems        — server-filtered results (search/category via API)
 *   assignedAssessments  — doctor-assigned assessments from useAssignedAssessments (AssignedAssessmentItem[])
 *   dynamicCategories    — category pill list derived from loaded assessments
 *   AssessmentsPage      — default export, the full page component
 *
 * DEPENDENCIES:
 *   useAssessments()            — SWR infinite hook for paginated CMS assessments
 *   useAssignedAssessments(id)  — SWR hook for patient's completed assessments
 *   useFilteredAssessments()    — SWR hook for server-side search + category filtering
 *   getDynamicCategories()      — derives category list from loaded assessments
 *   useAuth()                   — provides authenticated user (lead_id)
 *   PageHeader                  — shared navigation header component
 *   AssessmentGridCard / RecommendedAssessmentCard — CMS assessment card components
 *   AssignmentsList             — renders list of completed assessments
 *   BrowseSkeleton / AssignmentsSkeleton — loading skeletons
 *   AssessmentEmptyState        — empty-state display
 *   categoryMap                 — maps category string to icon + metadata
 *
 * LAST UPDATED: 2026-04-28 — My Assessments tab now shows doctor-assigned
 *   assessments (LeadContentAssignment) instead of completions, matching the
 *   reference frontned "Assigned Assessments" tab.
 */
"use client";

import {
  AssessmentGridCard,
  RecommendedAssessmentCard,
} from "@/components/assessment/assessment-card";
import { categoryMap } from "@/components/assessment/assessment-category";
import { AssessmentEmptyState } from "@/components/assessment/assessment-empty-state";
import { AssignmentsSkeleton, BrowseSkeleton } from "@/components/assessment/assessment-skeletons";
import { AssignmentsList } from "@/components/assessment/assignments-list";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AssessmentItem,
  type AssignedAssessmentItem,
  getDynamicCategories,
  useAssessments,
  useAssignedAssessments,
  useFilteredAssessments,
} from "@/hooks/assessments/use-assessments-page";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { LayoutGrid, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ─── Search ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ─── Category filter ──────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("All");

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("browse");

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const getUserId = useCallback(() => {
    if (!user) return null;
    const candidate = user.lead_id as string | number | undefined;
    return candidate ? String(candidate) : null;
  }, [user]);
  const leadId = getUserId();

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: assignedAssessments, isLoading: isLoadingAssignments } =
    useAssignedAssessments(leadId);

  const { data: assessmentPages, setSize, isLoading: isLoadingBrowse } = useAssessments();

  const isFiltering = !!(activeCategory !== "All" || debouncedSearch);

  const { data: filteredData, isLoading: isLoadingFiltered } = useFilteredAssessments({
    search: debouncedSearch || null,
    category: activeCategory !== "All" ? activeCategory : null,
  });

  const allAssessments: AssessmentItem[] = useMemo(
    () => (assessmentPages ?? []).flatMap((p) => p?.items ?? []),
    [assessmentPages],
  );

  const hasMore = (() => {
    if (!assessmentPages?.length) return false;
    const last = assessmentPages[assessmentPages.length - 1];
    if (!last?.pagination) return false;
    return last.pagination.offset + last.pagination.limit < last.pagination.total;
  })();

  const dynamicCategories = getDynamicCategories(allAssessments);

  // Browse list for non-filtered state — first item is the featured card
  const browseItems = allAssessments.slice(1);
  // Filtered results come pre-sorted and pre-filtered from the server
  const filteredItems = isFiltering ? (filteredData ?? []) : [];

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "browse") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const dist = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
        if (dist < 500 && !isLoadingBrowse && hasMore) setSize((s) => s + 1);
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [activeTab, isLoadingBrowse, hasMore, setSize]);

  // Tapping an assigned assessment takes the patient to the assessment landing
  // page (where they can start it), matching the reference frontned flow which
  // routes to /assessment/form?id={documentId}. Here the equivalent landing
  // page is /assessments/{documentId}/details.
  const handleOpenAssessment = (item: AssignedAssessmentItem) =>
    router.push(`/assessments/${item.documentId}/details`);

  const handleBrowseAssessment = (assessment: AssessmentItem) =>
    router.push(`/assessments/${assessment.id}/details`);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "browse" | "assessments")}
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header */}
      <header>
        <PageHeader title="Assessments" hardBack="/home" />
        <div className="px-4 pb-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Explore</TabsTrigger>
            <TabsTrigger value="assessments" className="relative">
              My Assessments
              {(assignedAssessments?.length ?? 0) > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {assignedAssessments!.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        {/* ── Browse tab ──────────────────────────────────────────────────── */}
        <TabsContent value="browse" className="mt-0 space-y-3">
          {/* Search bar */}
          <div className="flex gap-2 mt-4 items-stretch">
            <div className="flex-1 flex items-center gap-2 bg-card rounded-2xl px-4 h-12 shadow-sm border border-input">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assessments..."
                className="flex-1 bg-transparent border-0 shadow-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 p-0 h-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}>
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Horizontal scrollable category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {dynamicCategories.map((cat) => {
              const catInfo = categoryMap[cat];
              const Icon = catInfo?.icon || LayoutGrid;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors flex-shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {cat !== "All" && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-4">
            {isLoadingBrowse && allAssessments.length === 0 ? (
              <BrowseSkeleton />
            ) : (
              <>
                {isFiltering ? (
                  isLoadingFiltered ? (
                    <BrowseSkeleton />
                  ) : filteredItems.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-col gap-3">
                        {filteredItems.map((a) => (
                          <AssessmentGridCard
                            key={a.id}
                            assessment={a}
                            onClick={handleBrowseAssessment}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AssessmentEmptyState variant="no-results" />
                  )
                ) : (
                  <>
                    {allAssessments[0] && (
                      <RecommendedAssessmentCard
                        assessment={allAssessments[0]}
                        onClick={handleBrowseAssessment}
                      />
                    )}
                    {browseItems.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {browseItems.map((a) => (
                          <AssessmentGridCard
                            key={a.id}
                            assessment={a}
                            onClick={handleBrowseAssessment}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {isLoadingBrowse && allAssessments.length > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* ── My Assessments tab ──────────────────────────────────────────── */}
        <TabsContent value="assessments" className="mt-0">
          <p className="text-sm text-muted-foreground my-4">Assessments assigned to you.</p>
          {isLoadingAssignments ? (
            <AssignmentsSkeleton />
          ) : (assignedAssessments?.length ?? 0) > 0 ? (
            <AssignmentsList items={assignedAssessments!} onItemClick={handleOpenAssessment} />
          ) : (
            <AssessmentEmptyState variant="no-assignments" />
          )}
        </TabsContent>
      </main>
    </Tabs>
  );
}
