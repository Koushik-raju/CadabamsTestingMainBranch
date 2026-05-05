"use client";

import { LayoutGrid, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/hooks/shared/auth/use-auth";
import {
  type AssignedWorksheetItem,
  type WorksheetItem,
  getWorksheetCategories,
  useAssignedWorksheets,
  useFilteredWorksheets,
  useWorksheets,
} from "@/hooks/use-worksheets";

export default function WorksheetsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("browse");

  const getUserId = useCallback(() => {
    if (!user) return null;
    const candidate = user.lead_id as string | number | undefined;
    return candidate ? String(candidate) : null;
  }, [user]);
  const leadId = getUserId();

  const { data: assignedWorksheets, isLoading: isLoadingAssignments } =
    useAssignedWorksheets(leadId);

  const { data: worksheetPages, setSize, isLoading: isLoadingBrowse } = useWorksheets();

  const isFiltering = !!(activeCategory !== "All" || debouncedSearch);

  const { data: filteredData, isLoading: isLoadingFiltered } = useFilteredWorksheets({
    search: debouncedSearch || null,
    category: activeCategory !== "All" ? activeCategory : null,
  });

  const allWorksheets: WorksheetItem[] = useMemo(
    () =>
      (worksheetPages ?? []).flatMap((p: { items?: WorksheetItem[] }) => p?.items ?? []),
    [worksheetPages],
  );

  const hasMore = (() => {
    if (!worksheetPages?.length) return false;
    const last = worksheetPages[worksheetPages.length - 1];
    if (!last?.pagination) return false;
    return last.pagination.offset + last.pagination.limit < last.pagination.total;
  })();

  const dynamicCategories = getWorksheetCategories(allWorksheets);

  const browseItems = allWorksheets.slice(1);
  const filteredItems = isFiltering ? (filteredData ?? []) : [];

  useEffect(() => {
    if (activeTab !== "browse") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const dist = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
        if (dist < 500 && !isLoadingBrowse && hasMore) setSize((s: number) => s + 1);
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [activeTab, isLoadingBrowse, hasMore, setSize]);

  const handleOpenAssigned = (item: AssignedWorksheetItem) =>
    router.push(`/worksheets/${item.documentId}/details`);

  const handleBrowseWorksheet = (worksheet: WorksheetItem) =>
    router.push(`/worksheets/${worksheet.id}/details`);

  const footerLink = (id: string) => ({
    href: `/worksheets/${id}/details`,
    label: "Open",
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "browse" | "worksheets")}
      className="flex flex-col min-h-screen bg-background"
    >
      <header>
        <PageHeader title="Worksheets" hardBack="/home" />
        <div className="px-4 pb-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Explore</TabsTrigger>
            <TabsTrigger value="worksheets" className="relative">
              My worksheets
              {(assignedWorksheets?.length ?? 0) > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {assignedWorksheets!.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        <TabsContent value="browse" className="mt-0 space-y-3">
          <div className="flex gap-2 mt-4 items-stretch">
            <div className="flex-1 flex items-center gap-2 bg-card rounded-2xl px-4 h-12 shadow-[var(--sh-2)] border border-input">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search worksheets..."
                className="flex-1 bg-transparent border-0 shadow-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 p-0 h-full"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {dynamicCategories.map((cat: string) => {
              const catInfo = categoryMap[cat];
              const Icon = catInfo?.icon || LayoutGrid;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
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

          <div className="space-y-4">
            {isLoadingBrowse && allWorksheets.length === 0 ? (
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
                        {filteredItems.map((w: WorksheetItem) => (
                          <AssessmentGridCard
                            key={w.id}
                            assessment={w}
                            onClick={handleBrowseWorksheet}
                            browseFooterLink={footerLink(w.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AssessmentEmptyState variant="no-results" kind="worksheet" />
                  )
                ) : (
                  <>
                    {allWorksheets[0] && (
                      <RecommendedAssessmentCard
                        assessment={allWorksheets[0]}
                        onClick={handleBrowseWorksheet}
                      />
                    )}
                    {browseItems.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {browseItems.map((w: WorksheetItem) => (
                          <AssessmentGridCard
                            key={w.id}
                            assessment={w}
                            onClick={handleBrowseWorksheet}
                            browseFooterLink={footerLink(w.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {isLoadingBrowse && allWorksheets.length > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="worksheets" className="mt-0">
          <p className="text-sm text-muted-foreground my-4">Worksheets assigned to you.</p>
          {isLoadingAssignments ? (
            <AssignmentsSkeleton />
          ) : (assignedWorksheets?.length ?? 0) > 0 ? (
            <AssignmentsList items={assignedWorksheets!} onItemClick={handleOpenAssigned} />
          ) : (
            <AssessmentEmptyState variant="no-assignments" kind="worksheet" />
          )}
        </TabsContent>
      </main>
    </Tabs>
  );
}
