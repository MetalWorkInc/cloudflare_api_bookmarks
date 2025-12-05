
export interface PartnersEnv {
  id: string;
  key: string; // Encrypted text key
  fullName: string;
  email: string;
  phone?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnersEnvInput {
  key: string;
  fullName: string;
  email: string;
  phone?: string;
  summary?: string;
}
