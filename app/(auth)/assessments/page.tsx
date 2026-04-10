'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  CalendarClock,
  Clock3,
  Search,
  Cloud,
  Heart,
  Moon,
  Sparkles,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useAssignedAssessments } from '@/hooks/use-assigned-assessments';
import { useAssessments, mapStrapiAssessment, type AssessmentItem } from '@/hooks/use-assessments';
import type { AssignedAssessmentItem } from '@/services/assessment.service';

const getIconForAssessment = (assessment: AssessmentItem): React.ElementType => {
  const title = assessment.title.toLowerCase();
  const description = assessment.description?.toLowerCase() || '';
  
  if (title.includes('anxiety') || title.includes('gad') || description.includes('anxiety')) return Cloud;
  if (title.includes('depression') || title.includes('phq') || description.includes('depression')) return Heart;
  if (title.includes('sleep') || description.includes('sleep')) return Moon;
  if (title.includes('stress') || description.includes('stress')) return Sparkles;
  if (title.includes('relationship') || description.includes('relationship')) return Users;
  
  return BarChart3;
};

function BrowseSkeleton() {
  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-2xl bg-white/50 h-40 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-white/50 h-20 animate-pulse" />
      ))}
    </div>
  );
}

function AssignmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl animate-pulse bg-white/50" />
      ))}
    </div>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('browse');
  const mainRef = useRef<HTMLDivElement>(null);

  const getUserId = useCallback(() => {
    if (!user) return null;
    const candidate = user.lead_id as string | number | undefined;
    return candidate ? String(candidate) : null;
  }, [user]);

  const leadId = getUserId();
  const { data: assignedAssessments, isLoading: isLoadingAssignments } = useAssignedAssessments(leadId);

  const {
    data: assessmentPages,
    size,
    setSize,
    isLoading: isLoadingBrowse,
  } = useAssessments({ limit: 10, status: 'PUBLISHED' });

  console.log('[assessments-page] assessmentPages:', assessmentPages);
  console.log('[assessments-page] isLoadingBrowse:', isLoadingBrowse);

  const allAssessments = useMemo(() => {
    if (!assessmentPages) return [];
    return assessmentPages.flatMap((page) =>
      (page?.items || []).filter((item: { status?: string }) => item.status === 'PUBLISHED').map(mapStrapiAssessment)
    );
  }, [assessmentPages]);

  const hasMore = useMemo(() => {
    if (!assessmentPages || assessmentPages.length === 0) return true;
    const lastPage = assessmentPages[assessmentPages.length - 1];
    if (!lastPage?.pagination) return false;
    return lastPage.pagination.offset + lastPage.pagination.limit < lastPage.pagination.total;
  }, [assessmentPages]);

  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    allAssessments.forEach((a) => {
      (a.category || []).forEach((c: string) => {
        if (c && c.trim()) {
          cats.add(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
        }
      });
    });
    return Array.from(cats);
  }, [allAssessments]);

  const { recommendedAssessment, popularScreenings, personalGrowth } = useMemo(() => {
    if (allAssessments.length === 0) {
      return { recommendedAssessment: null, popularScreenings: [] as AssessmentItem[], personalGrowth: [] as AssessmentItem[] };
    }
    const published = allAssessments.filter((a) => a.status === 'PUBLISHED');
    const first = published[0] || null;
    const popular = published.slice(1).filter((a) => {
      const cats = (a.category || []).map((c: string) => c.toLowerCase());
      return cats.includes('anxiety') || cats.includes('depression') || cats.includes('sleep');
    });
    const growth = published.slice(1).filter((a) => {
      const cats = (a.category || []).map((c: string) => c.toLowerCase());
      return !cats.includes('anxiety') && !cats.includes('depression') && !cats.includes('sleep') && cats.length > 0;
    });
    return { recommendedAssessment: first, popularScreenings: popular, personalGrowth: growth };
  }, [allAssessments]);

  const filteredAssessments = useMemo(() => {
    const grouped = [...popularScreenings, ...personalGrowth];
    const filterLower = activeFilter.toLowerCase();
    if (activeFilter === 'All') {
      return grouped.filter(
        (assessment) =>
          assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assessment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    return grouped.filter(
      (assessment) =>
        ((assessment.category || [])?.map((c: string) => c.toLowerCase()).includes(filterLower)) &&
        (assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assessment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false))
    );
  }, [popularScreenings, personalGrowth, searchTerm, activeFilter]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 500;
    if (isAtBottom && !isLoadingBrowse && hasMore) {
      setSize((s) => s + 1);
    }
  };

  const handleOpenAssessment = (item: AssignedAssessmentItem) => {
    router.push(`/assessment/${item.documentId || item.id}`);
  };

  const handleBrowseAssessment = (assessment: AssessmentItem) => {
    router.push(`/assessment/details?id=${assessment.id}`);
  };

  return (
    <div
      ref={mainRef}
      className="h-screen max-h-screen overflow-y-auto bg-[#F6F3EC] text-slate-900 flex flex-col"
      onScroll={handleScroll}
    >
      <header className="px-5 pt-5 pb-4 bg-[#F6F3EC] sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">Understand yourself better with clinical tools.</p>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-2">
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Explore
            </TabsTrigger>
            <TabsTrigger
              value="assessments"
              className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-full px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              My Assessments
              {assignedAssessments && assignedAssessments.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0 min-w-[18px]">
                  {assignedAssessments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <main className="flex-1 px-5 pb-28">
        <TabsContent value="browse" className="mt-0 space-y-6">
          <div className="flex items-center gap-2 rounded-xl bg-white shadow-sm px-4 py-3 border border-slate-100 mt-4">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assessments..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
            {categories.map((cat) => {
              const isActive = cat === activeFilter;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-8">
            {isLoadingBrowse && allAssessments.length === 0 ? (
              <BrowseSkeleton />
            ) : (
              <>
                {recommendedAssessment && (
                  <Card
                    className="bg-slate-900 text-white rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleBrowseAssessment(recommendedAssessment)}
                  >
                    <CardContent className="p-5">
                      <Badge className="bg-white/10 text-white hover:bg-white/20 mb-3">
                        Recommended
                      </Badge>
                      <h3 className="text-xl font-bold">{recommendedAssessment.title}</h3>
                      <p className="text-slate-300 text-sm mt-1 mb-4">
                        {recommendedAssessment.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="w-4 h-4" />
                          {recommendedAssessment.landingTitle?.minutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="w-4 h-4" />
                          {recommendedAssessment.landingTitle?.numberOfQuestion} Questions
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {popularScreenings.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Popular Screenings</h2>
                    <div className="space-y-3">
                      {popularScreenings.map((assessment) => {
                        const Icon = getIconForAssessment(assessment);
                        return (
                          <Card
                            key={assessment.id}
                            className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl"
                            onClick={() => handleBrowseAssessment(assessment)}
                          >
                            <CardContent className="p-3 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {assessment.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {(assessment.category || []).map((c: string) => (
                                    <Badge
                                      key={c}
                                      className="text-[10px] lowercase font-normal bg-slate-100 text-slate-600"
                                    >
                                      {c}
                                    </Badge>
                                  ))}
                                  {assessment.landingTitle?.minutes && (
                                    <span className="text-xs text-slate-500">
                                      {assessment.landingTitle.minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {personalGrowth.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Personal Growth</h2>
                    <div className="space-y-3">
                      {personalGrowth.map((assessment) => {
                        const Icon = getIconForAssessment(assessment);
                        return (
                          <Card
                            key={assessment.id}
                            className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl"
                            onClick={() => handleBrowseAssessment(assessment)}
                          >
                            <CardContent className="p-3 flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">
                                  {assessment.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {(assessment.category || []).map((c: string) => (
                                    <Badge
                                      key={c}
                                      className="text-[10px] lowercase font-normal bg-slate-100 text-slate-600"
                                    >
                                      {c}
                                    </Badge>
                                  ))}
                                  {assessment.landingTitle?.minutes && (
                                    <span className="text-xs text-slate-500">
                                      {assessment.landingTitle.minutes} min
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredAssessments.length === 0 && allAssessments.length > 0 && (
                  <Card className="border-dashed border-slate-200 bg-transparent shadow-none">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <Search className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 mb-1">
                        No assessments found
                      </h3>
                      <p className="text-sm text-slate-500 max-w-xs">
                        Try a different search term or filter.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {isLoadingBrowse && allAssessments.length > 0 && (
                  <div className="text-center py-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="mt-0">
          <p className="text-sm text-slate-500 my-4">
            Your assigned assessments from your clinician.
          </p>
          {isLoadingAssignments ? (
            <AssignmentsSkeleton />
          ) : assignedAssessments && assignedAssessments.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {assignedAssessments.map((item) => (
                <Card
                  key={item.documentId || String(item.id)}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl"
                  onClick={() => handleOpenAssessment(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.label}
                        </p>
                        {item.status && (
                          <Badge
                            className={`mt-1 text-[10px] ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-transparent shadow-none">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  No Assigned Assessments
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  You don&apos;t have any assigned assessments yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </main>
    </div>
  );
}
