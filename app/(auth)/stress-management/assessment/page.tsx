'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

const STRESS_LEVELS = [
  { value: 1, label: 'Very Low', emoji: '😌', color: 'border-green-300 bg-green-50 text-green-800' },
  { value: 2, label: 'Low', emoji: '🙂', color: 'border-lime-300 bg-lime-50 text-lime-800' },
  { value: 3, label: 'Moderate', emoji: '😐', color: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
  { value: 4, label: 'High', emoji: '😟', color: 'border-orange-300 bg-orange-50 text-orange-800' },
  { value: 5, label: 'Very High', emoji: '😰', color: 'border-red-300 bg-red-50 text-red-800' },
];

const REASONS = [
  'Work', 'Relationships', 'Health', 'Finance', 'Family', 'Sleep', 'Studies', 'Other',
];

const IMPACTS = [
  'Headache', 'Fatigue', 'Irritability', 'Difficulty concentrating', 'Muscle tension', 'Sleep issues', 'Appetite changes', 'Anxiety',
];

type Step = 'level' | 'reasons' | 'impacts' | 'done';

export default function AssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('level');
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const getUserId = useCallback(() => {
    if (!user) return null;
    return user.lead_id ? String(user.lead_id) : null;
  }, [user]);

  const handleSave = async () => {
    const userId = getUserId();
    if (!userId) return;

    setIsSaving(true);
    try {
      const { database } = await import('@/lib/firebase');
      const { ref, set } = await import('firebase/database');

      const timestamp = new Date().toISOString();
      const safeKey = timestamp.replace(/\./g, '_').replace(/:/g, '-');

      await set(ref(database, `stressManagement/user/${userId}/${safeKey}`), {
        stressLevel,
        stressReason: selectedReasons,
        stressImpact: selectedImpacts,
        createdAt: timestamp,
      });

      setStep('done');
    } catch (err) {
      console.error('Error saving stress assessment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLevel = STRESS_LEVELS.find((l) => l.value === stressLevel);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => (step === 'level' ? router.back() : setStep(step === 'impacts' ? 'reasons' : 'level'))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Stress Check</h1>
          <p className="text-sm text-muted-foreground">Record how you're feeling</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-2 flex flex-col gap-6">
        {step === 'level' && (
          <>
            <h2 className="text-lg font-semibold text-foreground">What's your stress level right now?</h2>

            <div className="flex flex-col gap-3">
              {STRESS_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => setStressLevel(lvl.value)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    stressLevel === lvl.value ? lvl.color + ' border-current' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-2xl">{lvl.emoji}</span>
                  <div>
                    <div className="font-semibold text-sm">{lvl.label}</div>
                    <div className="text-xs text-muted-foreground">Level {lvl.value}</div>
                  </div>
                  {stressLevel === lvl.value && (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-current" />
                  )}
                </button>
              ))}
            </div>

            <Button className="rounded-full" size="lg" onClick={() => setStep('reasons')}>
              Continue
            </Button>
          </>
        )}

        {step === 'reasons' && (
          <>
            <div className="flex items-center gap-2">
              {selectedLevel && (
                <Badge className={`${selectedLevel.color} border`}>
                  {selectedLevel.emoji} {selectedLevel.label}
                </Badge>
              )}
            </div>

            <h2 className="text-lg font-semibold text-foreground">What's causing your stress?</h2>
            <p className="text-sm text-muted-foreground -mt-4">Select all that apply</p>

            <div className="flex flex-wrap gap-2">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => toggleItem(reason, selectedReasons, setSelectedReasons)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedReasons.includes(reason)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-auto">
              <Button variant="outline" className="rounded-full flex-1" onClick={() => setStep('impacts')}>
                Skip
              </Button>
              <Button className="rounded-full flex-1" onClick={() => setStep('impacts')} disabled={selectedReasons.length === 0}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 'impacts' && (
          <>
            <h2 className="text-lg font-semibold text-foreground">How is stress affecting you?</h2>
            <p className="text-sm text-muted-foreground -mt-4">Select all that apply</p>

            <div className="flex flex-wrap gap-2">
              {IMPACTS.map((impact) => (
                <button
                  key={impact}
                  onClick={() => toggleItem(impact, selectedImpacts, setSelectedImpacts)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedImpacts.includes(impact)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {impact}
                </button>
              ))}
            </div>

            <Card className="bg-muted border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">Summary</h3>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>Level: <span className="font-medium text-foreground">{selectedLevel?.label}</span></p>
                  {selectedReasons.length > 0 && (
                    <p>Causes: <span className="font-medium text-foreground">{selectedReasons.join(', ')}</span></p>
                  )}
                  {selectedImpacts.length > 0 && (
                    <p>Impacts: <span className="font-medium text-foreground">{selectedImpacts.join(', ')}</span></p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save
              </Button>
              <Button className="rounded-full flex-1" onClick={handleSave} disabled={isSaving || selectedImpacts.length === 0}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save with impacts
              </Button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
            <h2 className="text-2xl font-bold text-foreground">Logged!</h2>
            <p className="text-muted-foreground max-w-xs">
              Your stress check has been saved. Consistent tracking helps you spot patterns and manage stress better over time.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button className="rounded-full" onClick={() => router.push('/stress-management/breathing')}>
                Try a breathing exercise
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => router.push('/stress-management')}>
                Back to overview
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
