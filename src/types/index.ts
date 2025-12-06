export type UserRole = 'student' | 'runner';
// Added 'delivered' and 'disputed' to statuses
export type RequestStatus = 'requested' | 'pending_runner' | 'awaiting_payment' | 'payment_review' | 'accepted' | 'purchasing' | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'disputed';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  rating?: number; // Overall rating
  is_verified?: boolean;
  school_id_url?: string;
  payment_qr_url?: string;
  payment_number?: string; // GCash Number
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
  price_estimate: number; // This can now represent the Total or just the Fee?
                          // Recommendation: Keep as Total (Fee + Item Cost) for backward compat or ease of display,
                          // OR strictly Fee (49).
                          // Given the user said "49 is fixed", let's make `price_estimate` the FEE (49) and add `item_cost`.
                          // But wait, existing code sums `price_estimate` for earnings.
                          // If `price_estimate` becomes Fee (49), then logic holds.
                          // We add `item_cost` for the extra amount.

  item_cost?: number; // New field

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

  // Payment
  payment_proof_url?: string;
  payment_ref?: string;
  is_paid?: boolean;
  payment_method?: 'gcash' | 'cash';

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
