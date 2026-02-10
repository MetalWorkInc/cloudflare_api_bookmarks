
export interface PartnersEnv {
  id: string;
  key: string; // Encrypted text key
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  active: number; // 0 or 1
  bookmarks_favorites: string;
}

export interface PartnersEnvInput {
  key: string;
  full_name: string;
  email: string;
  phone?: string;
  summary?: string;
  active?: number; // 0 or 1
  bookmarks_favorites?: string;
}

export interface PartnersEnvSession extends Omit<PartnersEnv, 'id' | 'key' | 'created_at'> {
  expiration_date: number; // ISO 8601 format
  last_login?: string; // ISO 8601 format
}