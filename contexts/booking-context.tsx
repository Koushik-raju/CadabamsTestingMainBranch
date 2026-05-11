"use client";

import { createContext, useContext, useState } from "react";

type BookingState = {
  slotId: number | null;
  doctorId: number | null;
  campusId: number | null;
  subCampusId: number | null;
  consultationTypeId: 1 | 2 | 3;
  startDatetime: string | null;
  /** Set when booking from a package line item (future package-paid checkout). */
  bookedPackageId: number | null;
  specialityId: number | null;
};

type BookingContextValue = BookingState & {
  setBooking: (state: BookingState) => void;
  clearBooking: () => void;
};

const defaultState: BookingState = {
  slotId: null,
  doctorId: null,
  campusId: null,
  subCampusId: null,
  consultationTypeId: 2,
  startDatetime: null,
  bookedPackageId: null,
  specialityId: null,
};

const BookingContext = createContext<BookingContextValue>({
  ...defaultState,
  setBooking: () => {},
  clearBooking: () => {},
});

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(defaultState);

  return (
    <BookingContext.Provider
      value={{
        ...state,
        setBooking: (s) => setState(s),
        clearBooking: () => setState(defaultState),
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
