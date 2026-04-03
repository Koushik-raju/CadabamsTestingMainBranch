'use client';

import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  id: string | number;
  name: string;
}

interface FilterSheetProps {
  specialties: FilterOption[];
  languages: FilterOption[];
  selectedSpecialty: string | null;
  selectedLanguage: string | null;
  selectedMode: string | null;
  onSpecialtyChange: (id: string | null) => void;
  onLanguageChange: (id: string | null) => void;
  onModeChange: (mode: string | null) => void;
  onReset: () => void;
  activeCount: number;
}

const MODE_OPTIONS = [
  { id: 'online', label: 'Online' },
  { id: 'in-person', label: 'In-person' },
];

export function FilterSheet({
  specialties,
  languages,
  selectedSpecialty,
  selectedLanguage,
  selectedMode,
  onSpecialtyChange,
  onLanguageChange,
  onModeChange,
  onReset,
  activeCount,
}: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filter Doctors</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 py-4 space-y-6">
          {/* Mode */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Consultation mode</p>
            <div className="flex gap-2 flex-wrap">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onModeChange(selectedMode === opt.id ? null : opt.id)
                  }
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    selectedMode === opt.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Specialty */}
          {specialties.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Specialty</p>
              <div className="flex gap-2 flex-wrap">
                {specialties.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onSpecialtyChange(
                        selectedSpecialty === String(s.id) ? null : String(s.id)
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      selectedSpecialty === String(s.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Language</p>
                <div className="flex gap-2 flex-wrap">
                  {languages.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() =>
                        onLanguageChange(
                          selectedLanguage === String(l.id) ? null : String(l.id)
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        selectedLanguage === String(l.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            Reset all
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
