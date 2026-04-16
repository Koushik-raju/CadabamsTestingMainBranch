export type { PackageResponseDto, BookedPackageDto, PackageProductLineDto } from '@/sdk/backend-v2';

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

export type BookedPackageProductLine = {
  id: number;
  line_id?: number;
  product_id: [number | string, number | string];
  sequence_no: number;
  price_subtotal: number;
  price_unit?: number;
  discount?: number;
  status: 'open' | 'scheduled' | 'done' | 'cancelled';
  speciality_id?: [number | string, number | string];
};
