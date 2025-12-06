-- Rename table to match new terminology
ALTER TABLE requests RENAME TO missions;

-- Add new columns (some might exist, checking/adding as needed)
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  -- runner_id exists
  -- proof_url exists
  -- payment_proof_url exists
  -- payment_ref exists
  ADD COLUMN IF NOT EXISTS applied_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS runner_selected_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS active_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS proof_submitted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

-- Update status constraint to new canonical list
ALTER TABLE missions DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE missions ADD CONSTRAINT missions_status_check CHECK (status IN (
  'requested',
  'pending_runner_confirmation',
  'runner_selected',
  'awaiting_payment',
  'payment_submitted',
  'payment_verified',
  'active_mission',
  'proof_submitted',
  'awaiting_student_confirmation',
  'completed',
  'disputed',
  'cancelled'
));

-- Create applicants table
CREATE TABLE IF NOT EXISTS mission_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  runner_id uuid NOT NULL, -- Assuming references users(id) but enforcing strictly via application logic if FK issues arise
  applied_at timestamptz NOT NULL DEFAULT now(),
  message text
);
