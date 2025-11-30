export type UserRole = 'student' | 'runner';
export type RequestStatus = 'requested' | 'accepted' | 'purchasing' | 'delivering' | 'completed' | 'cancelled';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  rating?: number;
  is_verified?: boolean;
  school_id_url?: string;
  payment_qr_url?: string;
  avatar_url?: string;
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
  rating?: number;
  created_at: string;
  lat?: number;
  lng?: number;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}
