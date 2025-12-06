
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('student', 'runner')),
  is_verified BOOLEAN DEFAULT FALSE,
  school_id_url TEXT,
  payment_qr_url TEXT,
  payment_number TEXT,
  avatar_url TEXT,
  rating NUMERIC DEFAULT 0,
  student_rating NUMERIC DEFAULT 0,
  runner_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table (Missions)
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) NOT NULL,
  runner_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  details TEXT,
  price_estimate NUMERIC NOT NULL,
  item_cost NUMERIC,
  service_fee NUMERIC DEFAULT 49,
  additional_cost NUMERIC,
  additional_cost_reason TEXT,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  dropoff_lat NUMERIC,
  dropoff_lng NUMERIC,
  proof_url TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  payment_ref TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_method TEXT DEFAULT 'cash',
  rating NUMERIC,
  runner_rating NUMERIC,
  student_rating NUMERIC,
  runner_comment TEXT,
  student_comment TEXT,
  cancellation_reason TEXT
);

-- Add status check constraint
ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (status IN ('requested', 'pending_runner', 'awaiting_payment', 'payment_review', 'accepted', 'purchasing', 'delivering', 'delivered', 'completed', 'cancelled', 'disputed'));

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (simplified for this context)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile and others" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view requests" ON requests FOR SELECT USING (true);
CREATE POLICY "Students can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own requests" ON requests FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Runners can update requests they are assigned to" ON requests FOR UPDATE USING (auth.uid() = runner_id);
-- Allow runners to 'apply' by updating runner_id if null (this might need a function for stricter control)
CREATE POLICY "Runners can apply to requests" ON requests FOR UPDATE USING (runner_id IS NULL);

CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (auth.uid() IN (SELECT student_id FROM requests WHERE id = request_id) OR auth.uid() IN (SELECT runner_id FROM requests WHERE id = request_id));
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() IN (SELECT student_id FROM requests WHERE id = request_id) OR auth.uid() IN (SELECT runner_id FROM requests WHERE id = request_id));

-- Functions

-- RPC: Cancel Request
CREATE OR REPLACE FUNCTION cancel_request(request_id UUID, reason TEXT)
RETURNS VOID AS $$
DECLARE
  req_status text;
  req_student_id UUID;
  req_runner_id UUID;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();

  SELECT status, student_id, runner_id INTO req_status, req_student_id, req_runner_id
  FROM requests
  WHERE id = request_id;

  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF caller_id != req_student_id AND (req_runner_id IS NULL OR caller_id != req_runner_id) THEN
    RAISE EXCEPTION 'Not authorized to cancel this request';
  END IF;

  IF req_status NOT IN ('requested', 'pending_runner', 'awaiting_payment', 'payment_review') THEN
    RAISE EXCEPTION 'Cancellation not allowed at this stage (%)', req_status;
  END IF;

  UPDATE requests
  SET status = 'cancelled',
      cancellation_reason = reason
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
