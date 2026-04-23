export interface UserInfo {
  id: string;
  email: string | null;
  display_name?: string | null;
  photo_url?: string | null;
  isAdmin?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  cover_image?: string | null;
  cover_image_path?: string | null;
  reward_amount: number;
  status: 'Open' | 'Pending' | 'Closed';
  creator_id: string;
  created_at: string;
  updated_at: string;
  participants_count: number;
  initial_participants_count?: number;
  display_participants_count?: number;
  winner_url?: string;
}

export interface Submission {
  id: number;
  task_id: number;
  submitter_id: string;
  submitter_name?: string;
  submitter_avatar?: string;
  project_url: string;
  social_media_url?: string;
  submission_status: 'submitted' | 'not_awarded' | 'awarded';
  submitted_at: string;
  notes?: string;
  task_title?: string;
  reward_amount?: number;
  task_status?: 'Open' | 'Pending' | 'Closed';
}

export interface Comment {
  id: number;
  task_id: number;
  commenter_id: string;
  commenter_name?: string;
  commenter_avatar?: string;
  content: string;
  created_at: string;
  parent_id?: number;
  likes_count?: number;
  replies?: Comment[];
}
