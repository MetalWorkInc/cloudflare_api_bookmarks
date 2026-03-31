export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type CalendarEventVisibility = 'private' | 'public';

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  description: string;
  location: string;
  start_at_utc: string;
  end_at_utc: string;
  is_all_day: number;
  is_exclusive: number;
  status: CalendarEventStatus;
  visibility: CalendarEventVisibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventInput {
  calendar_id: string;
  title: string;
  description?: string;
  location?: string;
  start_at_utc: string;
  end_at_utc: string;
  is_all_day?: number;
  is_exclusive?: number;
  status?: CalendarEventStatus;
  visibility?: CalendarEventVisibility;
  created_by: string;
}
