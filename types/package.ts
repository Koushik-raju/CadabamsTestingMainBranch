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
