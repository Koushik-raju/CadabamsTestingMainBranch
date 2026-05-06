"use client";

import { Building2, ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { CampusMasterResponseDto, DoctorListingTestingCampusDto } from "@/sdk/backend-v2";

function CheckDot() {
  return (
    <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
        <path
          d="M2 6l3 3 5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function testingRowSelected(
  row: DoctorListingTestingCampusDto,
  confirmedCampusId: number | null,
  confirmedSubId: number | null,
): boolean {
  if (confirmedCampusId === null || row.campus_id !== confirmedCampusId) return false;
  if (typeof row.sub_campus_id === "number") {
    return confirmedSubId === row.sub_campus_id;
  }
  return confirmedSubId === null;
}

function uniqueCitiesFromRows(rows: DoctorListingTestingCampusDto[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const c = (r.city || "").trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

export interface CampusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: "campus" | "sub-campus";
  onStepChange: (step: "campus" | "sub-campus") => void;
  pendingCampusId: number | null;
  onPendingCampusChange: (id: number | null) => void;
  confirmedCampusId: number | null;
  onConfirmedCampusChange: (id: number | null) => void;
  confirmedSubId: number | null;
  onConfirmedSubChange: (id: number | null) => void;
  campuses: CampusMasterResponseDto[];
  isOnline: boolean;
  loading: boolean;
  /** In-person rows from CRM `/get/doctors/testing` — city list then campus list, same card UI */
  testingCampuses?: DoctorListingTestingCampusDto[];
  onTestingConfirm?: (row: DoctorListingTestingCampusDto) => void;
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
  testingCampuses,
  onTestingConfirm,
}: CampusSheetProps) {
  const useTestingList = Boolean(!isOnline && testingCampuses && testingCampuses.length > 0);

  const uniqueCities = useMemo(
    () => (testingCampuses?.length ? uniqueCitiesFromRows(testingCampuses) : []),
    [testingCampuses],
  );

  /** City step only when CRM returns more than one city; otherwise start on campus list. */
  const [testingPhase, setTestingPhase] = useState<"city" | "campus">("campus");
  const [testingLockedCity, setTestingLockedCity] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !useTestingList || !testingCampuses?.length) return;
    if (uniqueCities.length <= 1) {
      setTestingLockedCity(uniqueCities[0] ?? null);
      setTestingPhase("campus");
    } else {
      setTestingLockedCity(null);
      setTestingPhase("city");
    }
  }, [open, useTestingList, testingCampuses, uniqueCities]);

  const rowsForLockedCity = useMemo(() => {
    if (!testingCampuses?.length) return [];
    if (!testingLockedCity) return testingCampuses;
    return testingCampuses.filter((r) => r.city === testingLockedCity);
  }, [testingCampuses, testingLockedCity]);

  const getSubCampusOptions = (campusId: number) => {
    const master = campuses.find((c) => c.id === campusId) as
      | (CampusMasterResponseDto & {
          area?: Array<[string | number, string | number]>;
        })
      | undefined;
    return (master?.area ?? []).map(([id, name]) => ({ id: Number(id), name: String(name) }));
  };

  const subCampusesForPending =
    pendingCampusId !== null ? getSubCampusOptions(pendingCampusId) : [];

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
        onStepChange("sub-campus");
      }
    }
  };

  const handleSubCampusPick = (subId: number) => {
    onConfirmedCampusChange(pendingCampusId);
    onConfirmedSubChange(subId);
    onOpenChange(false);
  };

  const handleTestingRowPick = (row: DoctorListingTestingCampusDto) => {
    onTestingConfirm?.(row);
    onOpenChange(false);
  };

  const pendingCampus = campuses.find((c) => c.id === pendingCampusId);

  const campusCountByCity = useMemo(() => {
    const m = new Map<string, number>();
    if (!testingCampuses) return m;
    for (const r of testingCampuses) {
      const c = (r.city || "").trim();
      if (!c) continue;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [testingCampuses]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-8"
      >
        {useTestingList && testingCampuses ? (
          <>
            {testingPhase === "city" ? (
              <>
                <SheetHeader className="pb-2">
                  <SheetTitle>Select city</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose the city for your in-person visit
                  </p>
                </SheetHeader>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    {uniqueCities.map((city) => {
                      const count = campusCountByCity.get(city) ?? 0;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setTestingLockedCity(city);
                            setTestingPhase("campus");
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                            "border-border bg-background hover:bg-muted/40",
                          )}
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">{city}</p>
                            {count > 0 ? (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {count} location{count === 1 ? "" : "s"}
                              </p>
                            ) : null}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <SheetHeader className="pb-2">
                  {uniqueCities.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTestingPhase("city");
                        setTestingLockedCity(null);
                      }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 -ml-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  ) : null}
                  <SheetTitle>Select campus</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    {testingLockedCity
                      ? `Choose a centre in ${testingLockedCity}`
                      : "Choose where you'd like your session"}
                  </p>
                </SheetHeader>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : rowsForLockedCity.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-6 text-center">
                    No campuses for this city.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    {rowsForLockedCity.map((row) => {
                      const isSelected = testingRowSelected(row, confirmedCampusId, confirmedSubId);
                      return (
                        <button
                          key={`${row.campus_id}-${String(row.sub_campus_id)}-${row.name}`}
                          type="button"
                          onClick={() => handleTestingRowPick(row)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:bg-muted/40",
                          )}
                        >
                          <Building2
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                isSelected ? "text-primary" : "text-foreground",
                              )}
                            >
                              {row.name}
                            </p>
                            {row.city ? (
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {row.city}
                              </p>
                            ) : null}
                          </div>
                          {isSelected ? (
                            <CheckDot />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        ) : step === "campus" ? (
          <>
            <SheetHeader className="pb-2">
              <SheetTitle>Select a campus</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Choose where you&apos;d like your session
              </p>
            </SheetHeader>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : campuses.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 py-6 text-center">
                No campuses available.
              </p>
            ) : (
              <div className="flex flex-col gap-2 px-4 pt-2">
                {campuses.map((campus) => {
                  const doctorAvailable = true;
                  const isSelected = pendingCampusId === campus.id;
                  return (
                    <button
                      key={campus.id}
                      type="button"
                      disabled={!doctorAvailable}
                      onClick={() => handleCampusPick(campus.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        !doctorAvailable && "opacity-40 cursor-not-allowed",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : doctorAvailable
                            ? "border-border bg-background hover:bg-muted/40"
                            : "border-border bg-background",
                      )}
                    >
                      <Building2
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {campus.name}
                        </p>
                        {campus.city && Array.isArray(campus.city) && campus.city.length > 1 && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {String(campus.city[1])}
                          </p>
                        )}
                        {!doctorAvailable && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Not available at this campus
                          </p>
                        )}
                      </div>
                      {isSelected ? (
                        <CheckDot />
                      ) : (
                        !isOnline &&
                        doctorAvailable && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <SheetHeader className="pb-2">
              <button
                type="button"
                onClick={() => onStepChange("campus")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1 -ml-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <SheetTitle>Select a center</SheetTitle>
              <p className="text-sm text-muted-foreground">{pendingCampus?.name}</p>
            </SheetHeader>

            <div className="flex flex-col gap-2 px-4 pt-2">
              {subCampusesForPending.map((sub) => {
                const isSelected = confirmedSubId === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSubCampusPick(sub.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <Building2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm font-medium truncate",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
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
