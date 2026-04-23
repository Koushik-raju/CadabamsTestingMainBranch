"use client";

import { useAppointments } from "@/hooks/appointments/use-appointments-page";
import { useAvailablePackages } from "@/hooks/packages/use-packages";

export function useHomePage() {
  const {
    upcoming,
    past,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments();
  const { packages, isLoading: packagesLoading, error: packagesError } = useAvailablePackages();

  return {
    upcoming,
    past,
    packages,
    isLoading: appointmentsLoading || packagesLoading,
    appointmentsLoading,
    packagesLoading,
    appointmentsError,
    packagesError,
  };
}
