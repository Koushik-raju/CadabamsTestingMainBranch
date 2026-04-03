export interface Package {
  id: string | number;
  name?: string;
  price?: number;
  sessions?: number;
  [key: string]: unknown;
}

export interface PackageBooking {
  package_id: string | number;
  lead_id: string | number;
  [key: string]: unknown;
}

// Available package (from book-package listing)
export interface AvailablePackage {
  id: number;
  package_name: string;
  amount_total: number;
  package_product_ids: number[];
  service_id?: number[];
  journey_id?: string | number | null;
  journey_document_id?: string | null;
  duration?: number;
  package_duration?: number;
}

// Booked/managed package (user's own packages)
export interface BookedPackage {
  booked_package_id: number;
  package_id: [number, string];
  package_cost: number;
  package_stage: 'booked' | 'confirm' | 'in_progress' | string;
  date: string;
  campus_id: [number, string];
  lead_id: number;
  journey_id?: string | number | null;
  lines?: Array<{ product_id: [number, string] }>;
}

// Prescription / medicine line item from hospital API
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

export interface PackageProductLine {
  id: number;
  product_id: [number, string];
}
