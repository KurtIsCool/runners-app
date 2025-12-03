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
ALTER TABLE requests ADD COLUMN IF NOT EXISTS item_cost FLOAT DEFAULT 0; -- Cost of items to be purchased

-- Add columns to users table for aggregated ratings if you want to store them
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0; -- Overall average
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_rating FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS runner_rating FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
