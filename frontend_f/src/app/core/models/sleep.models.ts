export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
}

export interface SleepRecord {
  id: number;
  date: string;           // 'YYYY-MM-DD'
  sleep_time: string;     // 'HH:MM'
  wake_time: string;      // 'HH:MM'
  quality: number;        // 1–5
  quality_display: string;
  notes: string;
  duration_minutes: number;
  duration_hours: string;
  category: number | null;
  category_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SleepRecordPayload {
  date: string;
  sleep_time: string;
  wake_time: string;
  quality: number;
  notes?: string;
  category?: number | null;
}

export interface SleepStats {
  total_records: number;
  avg_duration_minutes: number;
  avg_quality: number;
  best_quality: number | null;
  worst_quality: number | null;
  longest_sleep_minutes: number | null;
  shortest_sleep_minutes: number | null;
  week_avg_duration_minutes: number;
  week_avg_quality: number;
}

export interface SleepCategory {
  id: number;
  name: string;
  color: string;
  record_count: number;
  created_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  bio: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SleepGoal {
  id: number;
  target_duration_minutes: number;
  target_duration_hours: string;
  target_quality: number;
  target_bedtime: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  profile: UserProfile;
  goal: SleepGoal;
  user: any;
}
