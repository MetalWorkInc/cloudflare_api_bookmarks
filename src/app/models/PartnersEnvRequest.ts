
export interface PartnersEnvRequest {
  key: string; // Encrypted text key
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  active: number; // 0 or 1
  observation?: string; // Optional observation field
}

export interface PartnersEnvRequestInput {
  key: string;
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  active?: number; // 0 or 1
}
