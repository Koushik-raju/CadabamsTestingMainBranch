'use client';


import { ChevronLeft, ChevronRight, MapPin, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
type CampusItem = {
  id: number;
  name: string;
  display_name?: string;
  book_appointment?: boolean;
  city?: [string | number, string | number];
  area?: Array<[string | number, string | number]>;
  [key: string]: unknown;
};

function CheckDot() {
  return (
    <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export interface CampusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: 'campus' | 'sub-campus';
  onStepChange: (step: 'campus' | 'sub-campus') => void;
  pendingCampusId: number | null;
  onPendingCampusChange: (id: number | null) => void;
  confirmedCampusId: number | null;
  onConfirmedCampusChange: (id: number | null) => void;
  confirmedSubId: number | null;
  onConfirmedSubChange: (id: number | null) => void;
  campuses: CampusItem[];
  isOnline: boolean;
  loading: boolean;
}

export function CampusSheet({
  open,
  onOpenChange,
  step,
  onStepChange,
  pendingCampusId,
  onPendingCampusChange,
  confirmedCampusId,
  onConfirmedCampusChange,
  confirmedSubId,
  onConfirmedSubChange,
  campuses,
  isOnline,
  loading,
}: CampusSheetProps) {

  const getSubCampusOptions = (campusId: number) => {
    const master = campuses.find(c => c.id === campusId);
    return (master?.area ?? []).map(([id, name]) => ({ id: Number(id), name: String(name) }));
  };

  const subCampusesForPending = pendingCampusId !== null ? getSubCampusOptions(pendingCampusId) : [];

  const handleCampusPick = (campusId: number) => {
    onPendingCampusChange(campusId);
    if (isOnline) {
      onConfirmedCampusChange(campusId);
      onConfirmedSubChange(null);
      onOpenChange(false);
    } else {
      const subs = getSubCampusOptions(campusId);
      if (subs.length === 0) {
        onConfirmedCampusChange(campusId);
        onConfirmedSubChange(null);
        onOpenChange(false);
      } else {
        onStepChange('sub-campus');
      }
    }
  };

  const handleSubCampusPick = (subId: number) => {
    onConfirmedCampusChange(pendingCampusId);
    onConfirmedSubChange(subId);
    onOpenChange(false);
  };

  const pendingCampus = campuses.find(c => c.id === pendingCampusId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-8">

        {step === 'campus' && (
          <>
            <SheetHeader className="pb-2">
              <SheetTitle>Select a campus</SheetTitle>
              <p className="text-sm text-muted-foreground">Choose where you&apos;d like your session</p>
            </SheetHeader>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : campuses.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-6 text-center">No campuses available.</p>
            ) : (
              <div className="flex flex-col gap-2 px-4 pt-2">
                {campuses.map(campus => {
                  const doctorAvailable = true;
                  const isSelected = pendingCampusId === campus.id;
                  return (
                    <button
                      key={campus.id}
                      type="button"
                      disabled={!doctorAvailable}
                      onClick={() => handleCampusPick(campus.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        !doctorAvailable && 'opacity-40 cursor-not-allowed',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : doctorAvailable
                            ? 'border-border bg-background hover:bg-muted/40'
                            : 'border-border bg-background',
                      )}
                    >
                      <Building2 className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-primary' : 'text-muted-foreground',
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}>
                          {campus.display_name || campus.name}
                        </p>
                        {campus.city?.[1] && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {String(campus.city[1])}
                          </p>
                        )}
                        {!doctorAvailable && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">Not available at this campus</p>
                        )}
                      </div>
                      {isSelected
                        ? <CheckDot />
                        : !isOnline && doctorAvailable && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === 'sub-campus' && (
          <>
            <SheetHeader className="pb-2">
              <button
                type="button"
                onClick={() => onStepChange('campus')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 -ml-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <SheetTitle>Select a center</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {pendingCampus?.display_name || pendingCampus?.name}
              </p>
            </SheetHeader>

            <div className="flex flex-col gap-2 px-4 pt-2">
              {subCampusesForPending.map(sub => {
                const isSelected = confirmedSubId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSubCampusPick(sub.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:bg-muted/40',
                    )}
                  >
                    <Building2 className={cn(
                      'h-4 w-4 shrink-0',
                      isSelected ? 'text-primary' : 'text-muted-foreground',
                    )} />
                    <span className={cn(
                      'flex-1 text-sm font-medium truncate',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}>
                      {sub.name}
                    </span>
                    {isSelected && <CheckDot />}
                  </button>
                );
              })}
            </div>
          </>
        )}

      </SheetContent>
    </Sheet>
  );
}
