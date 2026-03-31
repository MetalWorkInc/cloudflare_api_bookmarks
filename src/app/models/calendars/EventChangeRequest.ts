export type EventChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface EventChangeRequest {
  id: string;
  event_id: string;
  requested_by: string;
  requested_at: string;
  status: EventChangeRequestStatus;
  reviewed_by: string;
  reviewed_at: string;
  review_note: string;
  original_title: string;
  original_description: string;
  original_location: string;
  original_start_at_utc: string;
  original_end_at_utc: string;
  original_is_all_day: number;
  original_is_exclusive: number;
  desired_title: string;
  desired_description: string;
  desired_location: string;
  desired_start_at_utc: string;
  desired_end_at_utc: string;
  desired_is_all_day: number;
  desired_is_exclusive: number;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface EventChangeRequestInput {
  event_id: string;
  requested_by: string;
  requested_at?: string;
  status?: EventChangeRequestStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  original_title?: string;
  original_description?: string;
  original_location?: string;
  original_start_at_utc: string;
  original_end_at_utc: string;
  original_is_all_day?: number;
  original_is_exclusive?: number;
  desired_title?: string;
  desired_description?: string;
  desired_location?: string;
  desired_start_at_utc: string;
  desired_end_at_utc: string;
  desired_is_all_day?: number;
  desired_is_exclusive?: number;
  reason?: string;
}
