// Type definitions for the application

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface Env {
  BOOKMARKS_KV: KVNamespace;
  datastoraged01: D1Database;
}
