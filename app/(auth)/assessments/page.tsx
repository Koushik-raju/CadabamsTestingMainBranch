'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/shared/auth/use-auth';
import {
  useAssessments,
  useAssignedAssessments,
  useFilteredAssessments,
  getDynamicCategories,
  type AssessmentItem,
  type AssignedAssessmentItem,
} from '@/hooks/assessments/use-assessments-page';
import {
  AssessmentGridCard,
  RecommendedAssessmentCard,
} from '@/components/assessment/assessment-card';
import {
  BrowseSkeleton,
  AssignmentsSkeleton,
} from '@/components/assessment/assessment-skeletons';
import { AssessmentEmptyState } from '@/components/assessment/assessment-empty-state';
import { AssignmentsList } from '@/components/assessment/assignments-list';
import { categoryMap } from '@/components/assessment/assessment-category';
import { BackButton } from '@/components/shared/navigation/back-button';

type SortBy = 'default' | 'alpha' | 'quick';
type Duration = 'all' | 'short' | 'medium' | 'long';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'default', label: 'Featured' },
  { value: 'alpha',   label: 'A – Z' },
  { value: 'quick',   label: 'Quickest first' },
];

const DURATION_OPTIONS: { value: Duration; label: string; sub: string }[] = [
  { value: 'all',    label: 'Any',    sub: '' },
  { value: 'short',  label: 'Quick',  sub: '< 5 min' },
  { value: 'medium', label: 'Medium', sub: '5 – 10 min' },
  { value: 'long',   label: 'Long',   sub: '> 10 min' },
];

function hasValidDescription(a: AssessmentItem): boolean {
  if (a.citationText == null) return false;
  const desc = (a.description || a.landingTitle?.landingDescription || '').trimStart();
  if (!desc) return false;
  if (desc[0] === '(') return false;
  if (desc.includes('Gratitude Question')) return false;
  if (desc.includes('Reflection Question')) return false;
  return true;
}

function applySort(items: AssessmentItem[], sort: SortBy): AssessmentItem[] {
  if (sort === 'alpha')
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'quick')
    return [...items].sort(
      (a, b) => (a.landingTitle?.minutes ?? 9999) - (b.landingTitle?.minutes ?? 9999)
    );
  return items;
}

function applyDuration(items: AssessmentItem[], duration: Duration): AssessmentItem[] {
  if (duration === 'all') return items;
  return items.filter((a) => {
    const m = a.landingTitle?.minutes ?? null;
    if (m === null) return false;
    if (duration === 'short')  return m < 5;
    if (duration === 'medium') return m >= 5 && m <= 10;
    if (duration === 'long')   return m > 10;
    return true;
  });
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ─── Search ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ─── Active (applied) filters ─────────────────────────────────────────────
  const [sortBy,         setSortBy]         = useState<SortBy>('default');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDuration, setActiveDuration] = useState<Duration>('all');

  // ─── Pending filters (inside sheet before Apply) ──────────────────────────
  const [sheetOpen,       setSheetOpen]       = useState(false);
  const [pendingSort,     setPendingSort]     = useState<SortBy>('default');
  const [pendingCategory, setPendingCategory] = useState('All');
  const [pendingDuration, setPendingDuration] = useState<Duration>('all');

  const openSheet = () => {
    setPendingSort(sortBy);
    setPendingCategory(activeCategory);
    setPendingDuration(activeDuration);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setSortBy(pendingSort);
    setActiveCategory(pendingCategory);
    setActiveDuration(pendingDuration);
    setSheetOpen(false);
  };

  const resetFilters = () => {
    setPendingSort('default');
    setPendingCategory('All');
    setPendingDuration('all');
  };

  const activeFilterCount = [
    sortBy !== 'default',
    activeCategory !== 'All',
    activeDuration !== 'all',
  ].filter(Boolean).length;

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('browse');

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

  const serverCategory = activeCategory !== 'All' ? activeCategory : null;
  const { data: filteredData, isLoading: isLoadingFiltered } = useFilteredAssessments({
    search: debouncedSearch || null,
    category: serverCategory,
  });

  const allAssessments: AssessmentItem[] = useMemo(
    () => (assessmentPages ?? []).flatMap((p) => p?.items ?? []),
    [assessmentPages]
  );

  const hasMore = (() => {
    if (!assessmentPages?.length) return false;
    const last = assessmentPages[assessmentPages.length - 1];
    if (!last?.pagination) return false;
    return last.pagination.offset + last.pagination.limit < last.pagination.total;
  })();

  const dynamicCategories = getDynamicCategories(allAssessments);

  // ─── Processed browse list (sort + duration, client-side) ─────────────────
  const isFiltering = !!(serverCategory || debouncedSearch);

  const browseItems = useMemo(() => {
    console.log('[PAGE:1] allAssessments total', allAssessments.length, 'isLoadingBrowse', isLoadingBrowse);
    const withDesc = allAssessments.slice(1).filter(hasValidDescription);
    console.log('[PAGE:2] after hasValidDescription', withDesc.length, '(dropped', allAssessments.length - 1 - withDesc.length, ')');
    return applyDuration(applySort(withDesc, sortBy), activeDuration);
  }, [allAssessments, sortBy, activeDuration, isLoadingBrowse]);

  const filteredItems = useMemo(
    () => applyDuration(applySort((isFiltering ? filteredData ?? [] : []).filter(hasValidDescription), sortBy), activeDuration),
    [filteredData, isFiltering, sortBy, activeDuration]
  );

  // ─── Infinite scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'browse') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        const dist =
          document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
        if (dist < 500 && !isLoadingBrowse && hasMore) setSize((s) => s + 1);
      }, 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [activeTab, isLoadingBrowse, hasMore, setSize]);

  const handleOpenAssessment = (item: AssignedAssessmentItem) =>
    router.push(`/assessments/${item.documentId || item.id}`);

  const handleBrowseAssessment = (assessment: AssessmentItem) =>
    router.push(`/assessments/${assessment.id}/details`);

  // ─── Active filter pills (shown below search bar) ─────────────────────────
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (activeCategory !== 'All')
    activeChips.push({ label: activeCategory, onRemove: () => setActiveCategory('All') });
  if (activeDuration !== 'all') {
    const d = DURATION_OPTIONS.find((o) => o.value === activeDuration);
    activeChips.push({ label: d?.sub || activeDuration, onRemove: () => setActiveDuration('all') });
  }
  if (sortBy !== 'default') {
    const s = SORT_OPTIONS.find((o) => o.value === sortBy);
    activeChips.push({ label: s?.label || sortBy, onRemove: () => setSortBy('default') });
  }

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'browse' | 'assessments')}
        className="flex flex-col min-h-screen bg-background"
      >
        {/* Header */}
        <header>
          <div className="flex items-center gap-2 px-4 pt-5 pb-3">
            <BackButton fallback="/home" />
            <h1 className="flex-1 text-lg font-bold text-foreground">Assessments</h1>
          </div>
          <div className="px-4 pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Explore</TabsTrigger>
              <TabsTrigger value="assessments" className="relative">
                My Assessments
                {assignedAssessments && assignedAssessments.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                  >
                    {assignedAssessments.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24">
          {/* ── Browse tab ──────────────────────────────────────────────────── */}
          <TabsContent value="browse" className="mt-0 space-y-3">

            {/* Search + Filter button */}
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
                  <button onClick={() => setSearchTerm('')}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                onClick={openSheet}
                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border shadow-sm transition-colors flex-shrink-0 ${
                  activeFilterCount > 0
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-input text-muted-foreground hover:bg-accent'
                }`}
                aria-label="Filters"
              >
                <SlidersHorizontal style={{ width: 18, height: 18 }} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {activeChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                  >
                    {chip.label}
                    <button onClick={chip.onRemove} aria-label={`Remove ${chip.label}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => { setActiveCategory('All'); setActiveDuration('all'); setSortBy('default'); }}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}

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
                          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-col gap-3">
                          {filteredItems.map((a) => (
                            <AssessmentGridCard key={a.id} assessment={a} onClick={handleBrowseAssessment} />
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
                            <AssessmentGridCard key={a.id} assessment={a} onClick={handleBrowseAssessment} />
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
            <p className="text-sm text-muted-foreground my-4">
              Your assigned assessments from your clinician.
            </p>
            {isLoadingAssignments ? (
              <AssignmentsSkeleton />
            ) : assignedAssessments && assignedAssessments.length > 0 ? (
              <AssignmentsList items={assignedAssessments} onItemClick={handleOpenAssessment} />
            ) : (
              <AssessmentEmptyState variant="no-assignments" />
            )}
          </TabsContent>
        </main>
      </Tabs>

      {/* ── Filter & Sort bottom sheet ────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-0 max-h-[85vh] flex flex-col">
          {/* Header — fixed */}
          <SheetHeader className="px-5 pt-5 pb-4 flex-shrink-0">
            <SheetTitle className="text-base font-bold text-left">Filter & Sort</SheetTitle>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-4">
            {/* Sort */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Sort by</p>
              <div className="flex flex-col gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPendingSort(opt.value)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      pendingSort === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      pendingSort === opt.value ? 'border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {pendingSort === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Duration */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Duration</p>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPendingDuration(opt.value)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors ${
                      pendingDuration === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <span className={`text-sm font-medium ${pendingDuration === opt.value ? 'text-primary' : 'text-foreground'}`}>
                      {opt.label}
                    </span>
                    {opt.sub && (
                      <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Category */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Category</p>
              <div className="flex flex-wrap gap-2">
                {dynamicCategories.map((cat) => {
                  const catInfo = categoryMap[cat];
                  const Icon = catInfo?.icon || LayoutGrid;
                  const isActive = pendingCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setPendingCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions — sticky bottom */}
          <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-border bg-background">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={resetFilters}
            >
              Reset
            </Button>
            <Button
              className="flex-[2] rounded-xl"
              onClick={applyFilters}
            >
              Apply
              {(pendingSort !== 'default' || pendingCategory !== 'All' || pendingDuration !== 'all') && (
                <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {[pendingSort !== 'default', pendingCategory !== 'All', pendingDuration !== 'all'].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
