'use client';

import { analyticsService } from '@/services/analytics.service';

export function useAnalytics() {
  return {
    trackEvent: (name: string, params?: Record<string, unknown>) =>
      analyticsService.trackEvent(name, params),
    trackPageView: (path: string, title?: string) =>
      analyticsService.trackPageView(path, title),
    trackLogin: (method: string) => analyticsService.trackLogin(method),
    trackSignup: () => analyticsService.trackSignup(),
    trackAppointmentBooked: (doctorId: string, specialty: string) =>
      analyticsService.trackAppointmentBooked(doctorId, specialty),
    trackPaymentCompleted: (amount: number, currency: string) =>
      analyticsService.trackPaymentCompleted(amount, currency),
    trackJourneyStarted: (journeyId: string, journeyName: string) =>
      analyticsService.trackJourneyStarted(journeyId, journeyName),
    trackAssessmentCompleted: (assessmentId: string, score?: number) =>
      analyticsService.trackAssessmentCompleted(assessmentId, score),
    trackChatMessage: (isAI: boolean) => analyticsService.trackChatMessage(isAI),
    trackScreenView: (screenName: string) => analyticsService.trackScreenView(screenName),
    identifyUser: (userId: string, traits?: Record<string, unknown>) =>
      analyticsService.identifyUser(userId, traits),
  };
}
