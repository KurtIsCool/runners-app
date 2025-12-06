export type UserRole = 'student' | 'runner';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  rating?: number;
  total_reviews?: number;
  student_rating?: number;
  runner_rating?: number;
  bio?: string;
  school_id_url?: string;
  gov_id_url?: string;
  is_verified?: boolean;
  payment_qr_url?: string;
  payment_number?: string;
  history?: string[];
}

// Strict canonical list of statuses
export type MissionStatus =
  | 'requested'
  | 'pending_runner_confirmation'
  | 'runner_selected'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_verified'
  | 'active_mission'
  | 'proof_submitted'
  | 'awaiting_student_confirmation'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'submitted' | 'verified';

export interface Mission {
  id: string;
  student_id: string;
  runner_id?: string;
  type: string; // 'food', 'print', etc.
  pickup_address: string;
  dropoff_address: string;
  details: string;
  price_estimate: number;
  item_cost?: number; // Cost of items
  status: MissionStatus;
  payment_status: PaymentStatus;
  created_at: string;

  // Timestamps
  applied_at?: string;
  runner_selected_at?: string;
  payment_submitted_at?: string;
  payment_verified_at?: string;
  active_at?: string;
  proof_submitted_at?: string;
  delivery_confirmed_at?: string;
  completed_at?: string;

  // Proofs & Meta
  proof_url?: string;
  payment_proof_url?: string;
  payment_ref?: string;

  // Geolocation
  lat?: number;
  lng?: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;

  // Ratings
  rating?: number; // Legacy/Fallback
  student_rating?: number;
  runner_rating?: number;
  student_comment?: string;
  runner_comment?: string;
}

export interface MissionApplicant {
  id: string;
  mission_id: string;
  runner_id: string;
  applied_at: string;
  message?: string;
  // Joined fields
  runner?: {
      name: string;
      rating: number;
      avatar_url?: string;
  }
}

export interface Message {
  id: string;
  mission_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
