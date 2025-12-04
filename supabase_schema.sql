-- Add new columns to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lat FLOAT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS pickup_lng FLOAT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dropoff_lat FLOAT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dropoff_lng FLOAT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS runner_rating FLOAT; -- Rating given to runner
ALTER TABLE requests ADD COLUMN IF NOT EXISTS student_rating FLOAT; -- Rating given to student
ALTER TABLE requests ADD COLUMN IF NOT EXISTS runner_comment TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS student_comment TEXT;

-- Update status check constraint if it exists (Supabase/Postgres enum handling depends on setup, often just text check)
-- If status is an enum type:
-- ALTER TYPE request_status ADD VALUE 'delivered';
-- ALTER TYPE request_status ADD VALUE 'disputed';
-- If status is text with check constraint:
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (status IN ('requested', 'accepted', 'purchasing', 'delivering', 'delivered', 'completed', 'cancelled', 'disputed'));

-- Add columns to users table for aggregated ratings if you want to store them
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0; -- Overall average
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_rating FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS runner_rating FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Function to update user rating on request update could be added here as a trigger
