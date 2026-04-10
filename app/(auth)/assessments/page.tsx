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
import { useAuth } from '@/hooks/use-auth';
import { useAssignedAssessments } from '@/hooks/use-assigned-assessments';
import {
  useAssessments,
  mapStrapiAssessment,
  type AssessmentItem,
} from '@/hooks/use-assessments';
import type { AssignedAssessmentItem } from '@/services/assessment.service';

// FIX 4: Removed unused TabsList and TabsTrigger imports

type CategoryInfo = {
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
};

// Function to determine the visual properties of an assessment based on its category
const getCategoryInfo = (assessment: AssessmentItem): CategoryInfo => {
  // Get the first category or default to analyzing the title/description
  const cats = (assessment.category || []).map(c => String(c).toLowerCase());
  const title = assessment.title.toLowerCase();
  const description = (assessment.description || '').toLowerCase();
  
  // Anxiety - blue theme
  if (cats.some(c => c.includes('anxiety')) || 
      title.includes('anxiety') || 
      title.includes('gad') || 
      description.includes('anxiety')) {
    return { 
      icon: Cloud, 
      bgColor: 'bg-blue-50', 
      textColor: 'text-blue-600' 
    };
  }
  
  // Depression - green theme
  if (cats.some(c => c.includes('depression')) || 
      title.includes('depression') || 
      title.includes('phq') || 
      description.includes('depression')) {
    return { 
      icon: Heart, 
      bgColor: 'bg-green-50', 
      textColor: 'text-green-600' 
    };
  }
  
  // Sleep - indigo theme
  if (cats.some(c => c.includes('sleep')) || 
      title.includes('sleep') || 
      description.includes('sleep')) {
    return { 
      icon: Moon, 
      bgColor: 'bg-indigo-50', 
      textColor: 'text-indigo-600' 
    };
  }
  
  // Stress - amber theme
  if (cats.some(c => c.includes('stress')) || 
      title.includes('stress') || 
      description.includes('stress')) {
    return { 
      icon: Sparkles, 
      bgColor: 'bg-amber-50', 
      textColor: 'text-amber-600' 
    };
  }
  
  // Relationships - rose theme
  if (cats.some(c => c.includes('relationship') || c.includes('social')) || 
      title.includes('relationship') || 
      description.includes('relationship') ||
      title.includes('social') ||
      description.includes('social')) {
    return { 
      icon: Users, 
      bgColor: 'bg-rose-50', 
      textColor: 'text-rose-600' 
    };
  }
  
  // Mood/emotional - purple theme
  if (cats.some(c => c.includes('mood') || c.includes('emotion')) || 
      title.includes('mood') || 
      title.includes('emotion') ||
      description.includes('mood') ||
      description.includes('emotion')) {
    return { 
      icon: BarChart3, 
      bgColor: 'bg-purple-50', 
      textColor: 'text-purple-600' 
    };
  }
  
  // Default - gray theme
  return { 
    icon: BarChart3, 
    bgColor: 'bg-gray-50', 
    textColor: 'text-gray-600' 
  };
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
  const { data: assignedAssessments, isLoading: isLoadingAssignments } =
    useAssignedAssessments(leadId);

  const {
    data: assessmentPages,
    size,
    setSize,
    isLoading: isLoadingBrowse,
  } = useAssessments({ limit: 10, status: 'PUBLISHED' });

  const allAssessments = useMemo(() => {
    // Return empty array if no pages
    if (!assessmentPages) {
      console.log('No assessment pages received');
      return [];
    }
    
    console.log('Number of assessment pages:', assessmentPages.length);
    
    // Process each page to extract items
    const processedAssessments = assessmentPages.flatMap((page) => {
      // Handle potential null/undefined pages
      if (!page) {
        console.log('Found null/undefined page');
        return [];
      }
      
      // Extract items - assuming the fetcher returns the inner data object directly
      const items = page.items || [];
      console.log('Page has', items.length, 'items');
      
      return items
        .filter((item: { status?: string }) => item.status === 'PUBLISHED')
        .map(mapStrapiAssessment);
    });
    
    console.log('Total processed assessments:', processedAssessments.length);
    return processedAssessments;
  }, [assessmentPages]);

  const hasMore = useMemo(() => {
    // FIX 3: Return false (not true) when pages are empty/undefined to prevent
    // spurious extra fetches before any data has loaded
    if (!assessmentPages || assessmentPages.length === 0) return false;
    const lastPage = assessmentPages[assessmentPages.length - 1];
    if (!lastPage?.pagination) return false;
    return (
      lastPage.pagination.offset + lastPage.pagination.limit <
      lastPage.pagination.total
    );
  }, [assessmentPages]);

  const categories = useMemo(() => {
    // Always start with 'All' filter
    const cats = new Set<string>(['All']);
    
    // Extract categories only from the actual data
    allAssessments.forEach((a) => {
      // From explicit category array
      (a.category || []).forEach((c: string) => {
        if (c && c.trim()) {
          cats.add(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());
        }
      });
    });
    
    return Array.from(cats);
  }, [allAssessments]);

  const { recommendedAssessment, popularScreenings, personalGrowth } =
    useMemo(() => {
      console.log('Grouping assessments, total:', allAssessments.length);
      
      if (allAssessments.length === 0) {
        console.log('No assessments to group');
        return {
          recommendedAssessment: null,
          popularScreenings: [] as AssessmentItem[],
          personalGrowth: [] as AssessmentItem[],
        };
      }
      
      // Take the first as recommended regardless of content
      const first = allAssessments[0] || null;
      
      // Split the remaining items into two roughly equal groups
      // to ensure we have content in both sections
      const remaining = allAssessments.slice(1);
      
      // If we have categories, use them
      const hasCategories = remaining.some(a => (a.category || []).length > 0);
      
      let popular: AssessmentItem[] = [];
      let growth: AssessmentItem[] = [];
      
      if (hasCategories) {
        // Use categories when they exist
        popular = remaining.filter(a => {
          const cats = (a.category || []).map((c: string | unknown) => String(c).toLowerCase());
          // If any mental health related category is found
          return cats.some((c: string) => 
            c.includes('anxiety') || 
            c.includes('depression') || 
            c.includes('stress') || 
            c.includes('sleep') || 
            c.includes('mental')
          );
        });
        
        growth = remaining.filter(a => {
          const cats = (a.category || []).map((c: string | unknown) => String(c).toLowerCase());
          // If no mental health related category AND has at least one category
          return cats.length > 0 && !cats.some((c: string) => 
            c.includes('anxiety') || 
            c.includes('depression') || 
            c.includes('stress') || 
            c.includes('sleep') || 
            c.includes('mental')
          );
        });
        
        // If either group is empty, add assessments with no categories to it
        const uncategorized = remaining.filter(a => !(a.category || []).length);
        
        if (popular.length === 0 && growth.length === 0) {
          // Split evenly if both are empty
          const halfIndex = Math.ceil(uncategorized.length / 2);
          popular = uncategorized.slice(0, halfIndex);
          growth = uncategorized.slice(halfIndex);
        } else if (popular.length === 0) {
          // Add to popular if it's empty
          popular = uncategorized;
        } else if (growth.length === 0) {
          // Add to growth if it's empty
          growth = uncategorized;
        }
      } else {
        // No categories at all, split evenly by index
        const halfIndex = Math.ceil(remaining.length / 2);
        popular = remaining.slice(0, halfIndex);
        growth = remaining.slice(halfIndex);
      }
      
      console.log('Grouped assessments:', {
        hasRecommended: !!first,
        popularCount: popular.length,
        growthCount: growth.length
      });
      
      return {
        recommendedAssessment: first,
        popularScreenings: popular,
        personalGrowth: growth,
      };
    }, [allAssessments]);

  const filteredAssessments = useMemo(() => {
    // Normalize search term for comparison
    const termLower = searchTerm.toLowerCase().trim();
    
    // Function to check if an assessment matches search term
    const matchesTerm = (assessment: AssessmentItem) => {
      if (!termLower) return true; // If no search term, show all
      
      return (
        assessment.title.toLowerCase().includes(termLower) ||
        (assessment.description?.toLowerCase().includes(termLower) ?? false)
      );
    };

    // Include all assessments including recommended one for filtering
    const allVisible = [
      ...(recommendedAssessment ? [recommendedAssessment] : []),
      ...popularScreenings,
      ...personalGrowth,
    ];

    // If filter is "All", just filter by search term
    if (activeFilter === 'All') {
      return allVisible.filter(matchesTerm);
    }

    const filterLower = activeFilter.toLowerCase();
    
    // Filter by both category and search term
    return allVisible.filter(assessment => {
      // Check for explicit category match from API
      const categoryMatch = (assessment.category || [])
        .map((c: string) => c.toLowerCase())
        .includes(filterLower);
      
      // Return true if it matches category condition AND search term
      return categoryMatch && matchesTerm(assessment);
    });
  }, [
    recommendedAssessment,
    popularScreenings,
    personalGrowth,
    searchTerm,
    activeFilter,
  ]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 500;
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
        <p className="text-sm text-slate-500 mb-4">
          Understand yourself better with clinical tools.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'assessments'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            My Assessments
            {assignedAssessments && assignedAssessments.length > 0 && (
              <Badge
                className={`text-[10px] px-1.5 py-0 min-w-[18px] ${
                  activeTab === 'assessments'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {assignedAssessments.length}
              </Badge>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28">
        {activeTab === 'browse' && (
          // FIX 1: This closing </div> was missing, causing a malformed JSX tree
          // and a complete render failure of the component
          <div className="space-y-6">
            <div className="flex items-center gap-2 rounded-full bg-white shadow-sm px-4 py-2 border border-slate-200 mt-4">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assessments..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 mt-4">
              {categories.map((cat) => {
                const isActive = cat === activeFilter;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
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
                      className="bg-slate-900 text-white rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-[1.01]"
                      onClick={() =>
                        handleBrowseAssessment(recommendedAssessment)
                      }
                    >
                      <CardContent className="p-6">
                        <Badge className="bg-white/10 text-white hover:bg-white/20 mb-3">
                          Recommended
                        </Badge>
                        <h3 className="text-xl font-bold tracking-tight">
                          {recommendedAssessment.title}
                        </h3>
                        <p className="text-slate-300 text-sm mt-2 mb-4 line-clamp-2">
                          {recommendedAssessment.description || "Track your mood patterns and get personalized insights."}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="w-4 h-4" />
                            {recommendedAssessment.landingTitle?.minutes || 5} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4" />
                            {
                              recommendedAssessment.landingTitle
                                ?.numberOfQuestion || "12"
                            }{' '}
                            Questions
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {popularScreenings.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">
                        Popular Screenings
                      </h2>
                      <div className="space-y-3">
                        {popularScreenings.map((assessment) => {
                          const { icon: Icon, bgColor, textColor } = getCategoryInfo(assessment);
                          return (
                            <Card
                              key={assessment.id}
                              className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden"
                              onClick={() => handleBrowseAssessment(assessment)}
                            >
                              <CardContent className="p-0 flex items-stretch">
                                <div className={`w-16 ${bgColor} flex-shrink-0 flex items-center justify-center`}>
                                  <Icon className={`w-6 h-6 ${textColor}`} />
                                </div>
                                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">
                                    {assessment.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {(assessment.category && assessment.category.length > 0) ? (
                                      <Badge
                                        key={assessment.category[0]}
                                        className="text-[10px] capitalize font-normal bg-slate-100 text-slate-600"
                                      >
                                        {assessment.category[0]}
                                      </Badge>
                                    ) : null}
                                    {assessment.landingTitle?.minutes && (
                                      <span className="text-xs text-slate-500">
                                        {assessment.landingTitle.minutes} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center pr-4">
                                  <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
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
                          const { icon: Icon, bgColor, textColor } = getCategoryInfo(assessment);
                          return (
                            <Card
                              key={assessment.id}
                              className="cursor-pointer hover:shadow-md transition-shadow bg-white rounded-xl overflow-hidden"
                              onClick={() => handleBrowseAssessment(assessment)}
                            >
                              <CardContent className="p-0 flex items-stretch">
                                <div className={`w-16 ${bgColor} flex-shrink-0 flex items-center justify-center`}>
                                  <Icon className={`w-6 h-6 ${textColor}`} />
                                </div>
                                <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">
                                    {assessment.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {(assessment.category && assessment.category.length > 0) ? (
                                      <Badge
                                        key={assessment.category[0]}
                                        className="text-[10px] capitalize font-normal bg-slate-100 text-slate-600"
                                      >
                                        {assessment.category[0]}
                                      </Badge>
                                    ) : null}
                                    {assessment.landingTitle?.minutes && (
                                      <span className="text-xs text-slate-500">
                                        {assessment.landingTitle.minutes} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center pr-4">
                                  <ChevronRight className="w-5 h-5 text-slate-300" />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredAssessments.length === 0 &&
                    allAssessments.length > 0 && (
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
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {/* FIX 1: Restored missing closing tag for the browse tab wrapper */}

        {activeTab === 'assessments' && (
          <div>
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
          </div>
        )}
      </main>
    </div>
  );
}
