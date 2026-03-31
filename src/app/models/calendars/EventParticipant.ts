export interface EventParticipant {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  age: number | null;
  phone: string;
  company: string;
  role_label: string;
  notes: string;
  raw_payload: string;
  created_at: string;
  updated_at: string;
}

export interface EventParticipantInput {
  event_id: string;
  full_name: string;
  email?: string;
  age?: number | null;
  phone?: string;
  company?: string;
  role_label?: string;
  notes?: string;
  raw_payload?: string;
}
