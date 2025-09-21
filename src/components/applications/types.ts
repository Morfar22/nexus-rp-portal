// Application-related TypeScript types and interfaces

export interface Application {
  id: string;
  user_id: string;
  application_type_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  form_data: Record<string, any>;
  discord_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  closed: boolean;
  closed_at?: string;
  closed_by?: string;
  required_permissions?: string[];
  application_types?: ApplicationType;
  profiles?: UserProfile;
}

export interface ApplicationType {
  id: string;
  name: string;
  description?: string;
  form_fields: FormField[];
  required_permissions?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface FormField {
  id: string;
  key?: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  system?: boolean;
}

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface ApplicationSettings {
  accept_applications?: boolean;
  multiple_applications_allowed?: boolean;
  auto_close_applications?: boolean;
  require_age_verification?: boolean;
  cooldown_days?: number;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
  recentCount: number;
  approvalRate: number;
}

export type ApplicationStatus = Application['status'];

export interface ApplicationFilters {
  status?: ApplicationStatus | 'all';
  search?: string;
  dateRange?: 'all' | '7days' | '30days' | '90days';
}