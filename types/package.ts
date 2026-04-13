import type {
  Package as SdkPackage,
  ManagedPackage as SdkManagedPackage,
  PackageProductLine as SdkPackageProductLine,
  BookedPackageProductLine as SdkBookedPackageProductLine,
} from '@/sdk/auth-and-crm';

// Extends the SDK Package with fields present in the API response but not typed in the spec
export type AvailablePackage = SdkPackage & {
  journey_id?: string | number | null;
  journey_document_id?: string | null;
  duration?: number;
  package_duration?: number;
};

// Extends the SDK ManagedPackage with fields present in the API response but not typed in the spec
export type BookedPackage = SdkManagedPackage & {
  journey_id?: string | number | null;
};

export type { SdkPackageProductLine as PackageProductLine };
export type { SdkBookedPackageProductLine as BookedPackageProductLine };

// Legacy types kept for compatibility
export interface PackageBooking {
  package_id: string | number;
  lead_id: string | number;
}

export interface Prescription {
  id: number;
  display_name?: string;
  name?: string;
  date?: string;
  state?: string;
  doctor?: [number, string];
  prescription_line?: number[];
}

export interface MedicineLineItem {
  id: number;
  name?: string;
  display_name?: string;
  medicine_id?: [number, string];
  dose?: string;
  dose_unit?: string;
  qty?: number;
  frequency?: string;
  duration?: string;
  note?: string;
  prescription_id?: [number, string];
}
