
export interface PartnersEnv {
  id: string;
  key: string; // Encrypted text key
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  active: number;
}

export interface PartnersEnvInput {
  key: string;
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  active?: number;
}