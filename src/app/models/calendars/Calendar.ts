export interface Calendar {
  id: string;
  owner_user_id: string;
  name: string;
  timezone: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarInput {
  owner_user_id: string;
  name: string;
  timezone: string;
  color?: string;
}
