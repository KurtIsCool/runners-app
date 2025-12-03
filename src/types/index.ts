export type UserRole = 'student' | 'runner';
// Added 'delivered' and 'disputed' to statuses
export type RequestStatus = 'requested' | 'accepted' | 'purchasing' | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'disputed';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  rating?: number; // Overall rating
  is_verified?: boolean;
  school_id_url?: string;
  payment_qr_url?: string;
  avatar_url?: string;
  // New fields
  history?: string[]; // Array of request IDs or simple summary (we might not store this in user row, but useful for frontend cache)
  student_rating?: number;
  runner_rating?: number;
  total_reviews?: number;
}

export interface Request {
  id: string;
  student_id: string;
  runner_id?: string;
  type: string;
  pickup_address: string;
  dropoff_address: string;
  details: string;
  price_estimate: number;
  status: RequestStatus;
  created_at: string;

  // Locations
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;

  // Deprecated but keeping for compatibility if needed, or mapped to pickup/dropoff
  lat?: number;
  lng?: number;

  // Proof & Completion
  proof_url?: string;
  confirmed_at?: string;

  // Ratings
  rating?: number; // keeping for backward compat, maybe alias to runner_rating
  runner_rating?: number; // Rating given TO the runner
  student_rating?: number; // Rating given TO the student
  runner_comment?: string;
  student_comment?: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}
