export type UserRole = 'student' | 'runner';

// Updated Canonical Status List
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

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  rating?: number; // Overall rating
  is_verified?: boolean;
  school_id_url?: string;
  payment_qr_url?: string;
  payment_number?: string;
  avatar_url?: string;
  history?: string[];
  student_rating?: number;
  runner_rating?: number;
  total_reviews?: number;
}

export interface Mission {
  id: string;
  student_id: string;
  runner_id?: string;
  type: string;
  pickup_address: string;
  dropoff_address: string;
  details: string;

  // Costs
  price_estimate: number; // Total Price (Item Cost + Fee) or just Fee? Code seems to treat it as total.
  item_cost?: number; // User provided cost

  status: MissionStatus;
  payment_status: 'unpaid' | 'submitted' | 'verified';

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

  // Locations
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;

  // Proofs
  proof_url?: string;
  payment_proof_url?: string;
  payment_ref?: string;

  // Ratings
  rating?: number; // Legacy compatibility
  runner_rating?: number;
  student_rating?: number;
  runner_comment?: string;
  student_comment?: string;
}

export interface MissionApplicant {
  id: string;
  mission_id: string;
  runner_id: string;
  applied_at: string;
  message?: string;
  // Join fields usually fetched
  runner?: UserProfile;
}

export interface Message {
  id: string;
  mission_id: string; // Changed from request_id for consistency if we rename
  sender_id: string;
  text: string;
  created_at: string;
}
