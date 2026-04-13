'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import {
  useAssessments,
  useAssignedAssessments,
  useFilteredAssessments,
  categorizeAssessments,
  mapStrapiAssessment,
  type AssessmentItem,
  type AssignedAssessmentItem,
} from '@/hooks/use-assessments';
import {
  AssessmentCard,
  RecommendedAssessmentCard,
} from '@/components/assessment/assessment-card';
import {
  BrowseSkeleton,
  AssignmentsSkeleton,
} from '@/components/assessment/assessment-skeletons';
import { AssessmentEmptyState } from '@/components/assessment/assessment-empty-state';
import { AssignmentsList } from '@/components/assessment/assignments-list';
import {
  ASSESSMENT_CATEGORIES,
  categoryMap,
} from '@/components/assessment/assessment-category';
export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('browse');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const mainRef = useRef<HTMLDivElement>(null);

  const getUserId = useCallback(() => {
    if (!user) return null;
    const candidate = user.lead_id as string | number | undefined;
    return candidate ? String(candidate) : null;
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const leadId = getUserId();
  const { data: assignedAssessments, isLoading: isLoadingAssignments } =
    useAssignedAssessments(leadId);

  const {
    data: assessmentPages,
    setSize,
    isLoading: isLoadingBrowse,
  } = useAssessments({ limit: 10, status: 'PUBLISHED' });

  const searchQuery = activeFilter !== 'All' ? activeFilter : debouncedSearch;

  const { data: filteredData, isLoading: isLoadingFiltered } =
    useFilteredAssessments(searchQuery || null);

  const allAssessments: AssessmentItem[] = (assessmentPages ?? []).flatMap((page) => {
    if (!page) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (page.items || [])
      .filter((item: { status?: string }) => item.status === 'PUBLISHED')
      .map((item: any) => mapStrapiAssessment(item));
  });

  const hasMore = (() => {
    if (!assessmentPages || assessmentPages.length === 0) return false;
    const lastPage = assessmentPages[assessmentPages.length - 1];
    if (!lastPage?.pagination) return false;
    return lastPage.pagination.offset + lastPage.pagination.limit < lastPage.pagination.total;
  })();

  const { recommendedAssessment, popularScreenings, personalGrowth } =
    categorizeAssessments(allAssessments);

  const filteredAssessments = searchQuery ? (filteredData || []) : [];

  const categories = ASSESSMENT_CATEGORIES;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 500;
    if (isAtBottom && !isLoadingBrowse && hasMore) {
      setSize((s) => s + 1);
    }
  };

  const handleOpenAssessment = (item: AssignedAssessmentItem) => {
    router.push(`/assessments/${item.documentId || item.id}`);
  };

  const handleBrowseAssessment = (assessment: AssessmentItem) => {
    router.push(`/assessments/${assessment.id}/details`);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'browse' | 'assessments')}
      className="flex flex-col"
    >
      <header className="px-5 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Assessments
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Understand yourself better with clinical tools.
        </p>
        <TabsList className="grid w-full grid-cols-2 gap-2">
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
      </header>

      <main
        ref={mainRef}
        className="flex-1 px-5 pb-28 overflow-y-auto"
        onScroll={handleScroll}
      >
        <TabsContent value="browse" className="mt-0 space-y-5">
          <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-3 shadow-sm mt-4 border border-input">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assessments..."
              className="flex-1 bg-transparent border-0 shadow-none text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = cat === activeFilter;
              const catInfo = categoryMap[cat];
              const Icon = catInfo?.icon || LayoutGrid;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-muted-foreground border border-input hover:bg-accent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-7">
            {isLoadingBrowse && allAssessments.length === 0 ? (
              <BrowseSkeleton />
            ) : (
              <>
                {searchQuery ? (
                  <>
                    {isLoadingFiltered ? (
                      <BrowseSkeleton />
                    ) : filteredAssessments.length > 0 ? (
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-foreground">
                          Results ({filteredAssessments.length})
                        </h2>
                        <div className="flex flex-col gap-2">
                          {filteredAssessments.map((assessment, index) => (
                            <div key={assessment.id}>
                              <AssessmentCard
                                assessment={assessment}
                                onClick={handleBrowseAssessment}
                              />
                              {index < filteredAssessments.length - 1 && (
                                <div className="h-px bg-border mx-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <AssessmentEmptyState variant="no-results" />
                    )}
                  </>
                ) : (
                  <>
                    {recommendedAssessment && (
                      <RecommendedAssessmentCard
                        assessment={recommendedAssessment}
                        onClick={handleBrowseAssessment}
                      />
                    )}

                    {popularScreenings.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-foreground">
                          Popular Screenings
                        </h2>
                        <div className="flex flex-col gap-2">
                          {popularScreenings.map((assessment, index) => (
                            <div key={assessment.id}>
                              <AssessmentCard
                                assessment={assessment}
                                onClick={handleBrowseAssessment}
                              />
                              {index < popularScreenings.length - 1 && (
                                <div className="h-px bg-border mx-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {personalGrowth.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-lg font-bold text-foreground">
                          Personal Growth
                        </h2>
                        <div className="flex flex-col gap-2">
                          {personalGrowth.map((assessment, index) => (
                            <div key={assessment.id}>
                              <AssessmentCard
                                assessment={assessment}
                                onClick={handleBrowseAssessment}
                              />
                              {index < personalGrowth.length - 1 && (
                                <div className="h-px bg-border mx-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isLoadingBrowse && allAssessments.length > 0 && (
                  <div className="text-center py-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-0">
          <p className="text-sm text-muted-foreground my-4">
            Your assigned assessments from your clinician.
          </p>
          {isLoadingAssignments ? (
            <AssignmentsSkeleton />
          ) : assignedAssessments && assignedAssessments.length > 0 ? (
            <AssignmentsList
              items={assignedAssessments}
              onItemClick={handleOpenAssessment}
            />
          ) : (
            <AssessmentEmptyState variant="no-assignments" />
          )}
        </TabsContent>
      </main>
    </Tabs>
  );
}
