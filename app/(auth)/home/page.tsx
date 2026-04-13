'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeHeader } from '@/components/home/home-header';
import { SupportSection } from '@/components/home/support-section';
import { QuickActions } from '@/components/home/quick-actions';
import { UpcomingSession } from '@/components/home/upcoming-session';
import { JourneySection } from '@/components/home/journey-section';
import { useAuth } from '@/hooks/use-auth';
import { getAppointments } from '@/sdk/auth-and-crm';
import type { AppointmentDetail } from '@/sdk/auth-and-crm';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);

  useEffect(() => {
    if (!user) return;
    getAppointments({ query: { start_datetime: new Date().toISOString() } })
      .then((res) => setAppointments(res.data ?? []))
      .catch(console.error);
  }, [user]);

  const handleAction = (type: string, subtype?: string) => {
    switch (type) {
      case 'quick_action':
        switch (subtype) {
          case 'therapist':
            router.push('/consult/find-therapist');
            break;
          case 'match':
            router.push('/consult/find-therapist');
            break;
          case 'assessment':
            router.push('/assessments');
            break;
          case 'journey':
            router.push('/journeys');
            break;
          case 'journal':
            router.push('/self-journaling');
            break;
          case 'breathe':
            router.push('/wellness/resources');
            break;
          case 'packages':
            router.push('/packages');
            break;
          case 'mindful-minutes':
            router.push('/wellness/mindful-minutes');
            break;
          case 'chat':
            router.push('/chat');
            break;
          case 'videos':
            router.push('/wellness/videos');
            break;
          case 'documents':
            router.push('/documents');
            break;
        }
        break;
      case 'join_session':
        router.push('/consult/appointments');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader
        onMoodClick={() => router.push('/assessment/avym73d4x6258t3ligurl56r')}
      />

      {/* Main content — overlaps header by pulling up with negative margin */}
      <div className="relative mt-[-20px] pt-8 pb-20 bg-background rounded-t-2xl z-10 flex flex-col gap-0">
        <UpcomingSession
          appointments={appointments}
          onJoin={() => handleAction('join_session')}
        />

        <SupportSection
          onTalk={() => handleAction('quick_action', 'therapist')}
          onMatch={() => handleAction('quick_action', 'match')}
        />

        <QuickActions
          onActionClick={(type) => handleAction('quick_action', type)}
        />

        <JourneySection />
      </div>
    </div>
  );
}
