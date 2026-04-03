import { logFirebaseEvent } from '@/lib/firebase/analytics';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function pushGtag(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

export const analyticsService = {
  trackPageView(path: string, title?: string): void {
    try {
      pushGtag('page_view', { page_path: path, page_title: title });
      void logFirebaseEvent('page_view', { page_path: path, page_title: title });
    } catch {
      // analytics must never crash the app
    }
  },

  trackEvent(name: string, params?: Record<string, unknown>): void {
    try {
      pushGtag(name, params);
      void logFirebaseEvent(name, params);
    } catch {
      // analytics must never crash the app
    }
  },

  identifyUser(userId: string, traits?: Record<string, unknown>): void {
    try {
      pushGtag('set', { user_id: userId, ...traits });
      void logFirebaseEvent('identify', { user_id: userId, ...traits });
    } catch {
      // analytics must never crash the app
    }
  },

  trackLogin(method: string): void {
    try {
      pushGtag('login', { method });
      void logFirebaseEvent('login', { method });
    } catch {
      // analytics must never crash the app
    }
  },

  trackSignup(): void {
    try {
      pushGtag('sign_up', {});
      void logFirebaseEvent('sign_up', {});
    } catch {
      // analytics must never crash the app
    }
  },

  trackAppointmentBooked(doctorId: string, specialty: string): void {
    try {
      const params = { doctor_id: doctorId, specialty };
      pushGtag('appointment_booked', params);
      void logFirebaseEvent('appointment_booked', params);
    } catch {
      // analytics must never crash the app
    }
  },

  trackPaymentCompleted(amount: number, currency: string): void {
    try {
      const params = { value: amount, currency };
      pushGtag('purchase', params);
      void logFirebaseEvent('purchase', params);
    } catch {
      // analytics must never crash the app
    }
  },

  trackJourneyStarted(journeyId: string, journeyName: string): void {
    try {
      const params = { journey_id: journeyId, journey_name: journeyName };
      pushGtag('journey_started', params);
      void logFirebaseEvent('journey_started', params);
    } catch {
      // analytics must never crash the app
    }
  },

  trackAssessmentCompleted(assessmentId: string, score?: number): void {
    try {
      const params: Record<string, unknown> = { assessment_id: assessmentId };
      if (score !== undefined) params.score = score;
      pushGtag('assessment_completed', params);
      void logFirebaseEvent('assessment_completed', params);
    } catch {
      // analytics must never crash the app
    }
  },

  trackChatMessage(isAI: boolean): void {
    try {
      const params = { is_ai: isAI };
      pushGtag('chat_message', params);
      void logFirebaseEvent('chat_message', params);
    } catch {
      // analytics must never crash the app
    }
  },

  trackScreenView(screenName: string): void {
    try {
      const params = { screen_name: screenName };
      pushGtag('screen_view', params);
      void logFirebaseEvent('screen_view', params);
    } catch {
      // analytics must never crash the app
    }
  },
};
