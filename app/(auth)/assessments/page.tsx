'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { AssessmentCard } from '@/components/assessment/assessment-card';
import { WorksheetCard } from '@/components/worksheet/worksheet-card';
import { useAuth } from '@/hooks/use-auth';
import {
  getAssignedAssessments,
  getAssignedWorksheets,
  type AssignedAssessmentItem,
  type AssignedWorksheetItem,
} from '@/services/assessment.service';

function AssessmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssignedAssessmentItem[]>([]);
  const [worksheets, setWorksheets] = useState<AssignedWorksheetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user?.lead_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const leadId = String(user.lead_id);
        const [a, w] = await Promise.all([
          getAssignedAssessments(leadId),
          getAssignedWorksheets(leadId),
        ]);
        setAssessments(a);
        setWorksheets(w);
      } catch (err) {
        console.error('Error loading assignments:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.lead_id]);

  const handleOpenAssessment = (item: AssignedAssessmentItem) => {
    router.push(`/assessment/form?id=${item.documentId || item.id}`);
  };

  const handleOpenWorksheet = (item: AssignedWorksheetItem) => {
    router.push(`/worksheet/form?id=${item.documentId || item.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border bg-card">
        <BackButton fallback="/home" />
        <h1 className="text-base sm:text-lg font-semibold text-foreground">Assignments</h1>
      </div>

      <div className="flex-1 p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="assessments" className="w-full">
          <TabsList className="w-full mb-4 sm:mb-6">
            <TabsTrigger value="assessments" className="flex-1 flex items-center gap-1.5">
              Assessments
              {assessments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[18px]">
                  {assessments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="worksheets" className="flex-1 flex items-center gap-1.5">
              Worksheets
              {worksheets.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 min-w-[18px]">
                  {worksheets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessments">
            {isLoading ? (
              <AssessmentsSkeleton />
            ) : assessments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {assessments.map((item) => (
                  <AssessmentCard
                    key={item.documentId || String(item.id)}
                    item={item}
                    onOpen={handleOpenAssessment}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No Assigned Assessments"
                description="You don't have any assigned assessments yet."
              />
            )}
          </TabsContent>

          <TabsContent value="worksheets">
            {isLoading ? (
              <AssessmentsSkeleton />
            ) : worksheets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {worksheets.map((item) => (
                  <WorksheetCard
                    key={item.documentId || String(item.id)}
                    item={item}
                    onOpen={handleOpenWorksheet}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Assigned Worksheets"
                description="You don't have any assigned worksheets yet."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
