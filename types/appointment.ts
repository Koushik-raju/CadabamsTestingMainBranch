export interface Appointment {
  id: string | number;
  doctor_name?: string;
  date?: string;
  time?: string;
  mode?: 'online' | 'offline';
  status?: string;
  [key: string]: unknown;
}

export interface TimeSlot {
  id: string | number;
  time: string;
  available?: boolean;
}

export interface Doctor {
  id: string | number;
  name: string;
  speciality?: string;
  image?: string;
  experience?: number;
  [key: string]: unknown;
}

export interface LocationCenter {
  id: string | number;
  name: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface SubCampus {
  id: string | number;
  name: string;
}
