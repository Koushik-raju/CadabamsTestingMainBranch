export interface User {
  lead_id: string | number;
  sub?: string;
  phone_number?: string;
  caller_mobile?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  profile_image?: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: User | null;
  profileImage: string;
}
