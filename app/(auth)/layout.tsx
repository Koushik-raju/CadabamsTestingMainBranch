'use client';

import { SWRConfig } from 'swr';
import { BookingProvider } from '@/contexts/booking-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false }}>
      <BookingProvider>
        <div style={{ paddingTop: 'var(--safe-area-inset-top)', paddingBottom: 'var(--safe-area-inset-bottom)' }}>
          {children}
        </div>
      </BookingProvider>
    </SWRConfig>
  );
}
