'use client';

import { FindTherapistProvider, useFindTherapist } from '@/components/find-therapist/context';
import { ListView } from '@/components/find-therapist/list-view';
import { WizardView } from '@/components/find-therapist/wizard-view';

function FindTherapistInner() {
  const { view } = useFindTherapist();
  return view === 'wizard' ? <WizardView /> : <ListView />;
}

export default function FindTherapistPage() {
  return (
    <FindTherapistProvider>
      <FindTherapistInner />
    </FindTherapistProvider>
  );
}
