-- Consolidated Migration: Rework Missions Lifecycle
-- Includes: Table Renames, Strict Status Enum, Applicants Table, and Atomic RPCs

BEGIN;

-- 1. Rename Table: requests -> missions
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requests') THEN
    ALTER TABLE requests RENAME TO missions;
  END IF;
END $$;

-- 2. Rename Column: messages.request_id -> mission_id
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'request_id') THEN
    ALTER TABLE messages RENAME COLUMN request_id TO mission_id;
  END IF;
END $$;

-- 3. Drop ALL Legacy Constraints (Force Cleanup)
ALTER TABLE missions DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_status_check;

-- 4. Normalize Data (Map old statuses to new strict enum)
UPDATE missions SET status = 'requested' WHERE status = 'pending';
UPDATE missions SET status = 'active_mission' WHERE status IN ('accepted', 'purchasing', 'delivering');
UPDATE missions SET status = 'completed' WHERE status = 'completed';
-- Default safety net
UPDATE missions SET status = 'requested' WHERE status NOT IN (
  'requested', 'pending_runner_confirmation', 'runner_selected', 'awaiting_payment',
  'payment_submitted', 'payment_verified', 'active_mission', 'proof_submitted',
  'awaiting_student_confirmation', 'completed', 'disputed', 'cancelled'
);

-- 5. Apply New Strict Constraint
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

-- 6. Add New Columns
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS applied_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS runner_selected_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS active_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS proof_submitted_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamptz NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;
-- Ensure legacy columns exist or are added if missing (runner_id, etc are usually standard)
ALTER TABLE missions ADD COLUMN IF NOT EXISTS runner_id uuid NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS proof_url text NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_proof_url text NULL;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS payment_ref text NULL;

-- 7. Create Applicants Table
CREATE TABLE IF NOT EXISTS mission_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  runner_id uuid NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  message text,
  UNIQUE(mission_id, runner_id)
);

-- 8. Define Atomic RPC Functions

-- apply_to_request
CREATE OR REPLACE FUNCTION apply_to_request(_runner_id uuid, _mission_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_status text;
BEGIN
  SELECT status INTO current_status FROM missions WHERE id = _mission_id;
  IF current_status NOT IN ('requested', 'pending_runner_confirmation', 'runner_selected') THEN
    RETURN json_build_object('success', false, 'message', 'Mission is not accepting applications');
  END IF;

  INSERT INTO mission_applicants (mission_id, runner_id)
  VALUES (_mission_id, _runner_id)
  ON CONFLICT DO NOTHING;

  IF current_status = 'requested' THEN
    UPDATE missions SET status = 'pending_runner_confirmation' WHERE id = _mission_id;
    current_status := 'pending_runner_confirmation';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Application submitted', 'new_status', current_status);
END;
$$;

-- confirm_runner
CREATE OR REPLACE FUNCTION confirm_runner(_student_id uuid, _mission_id uuid, _runner_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
  active_mission_count int;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status NOT IN ('requested', 'pending_runner_confirmation') THEN
    RETURN json_build_object('success', false, 'message', 'Mission not in selectable state');
  END IF;

  PERFORM 1 FROM mission_applicants WHERE mission_id = _mission_id AND runner_id = _runner_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Runner has not applied');
  END IF;

  -- Atomic check for active missions
  SELECT COUNT(*) INTO active_mission_count
  FROM missions
  WHERE runner_id = _runner_id
    AND status IN ('runner_selected', 'awaiting_payment', 'payment_submitted', 'payment_verified', 'active_mission', 'proof_submitted');

  IF active_mission_count > 0 THEN
    RETURN json_build_object('success', false, 'message', 'Runner already has an active mission');
  END IF;

  UPDATE missions
  SET runner_id = _runner_id,
      status = 'runner_selected',
      runner_selected_at = now()
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Runner confirmed', 'new_status', 'runner_selected');
END;
$$;

-- submit_payment_proof
CREATE OR REPLACE FUNCTION submit_payment_proof(_student_id uuid, _mission_id uuid, payment_meta json)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status != 'runner_selected' AND mission_record.status != 'awaiting_payment' THEN
    RETURN json_build_object('success', false, 'message', 'Invalid status for payment');
  END IF;

  UPDATE missions
  SET payment_proof_url = payment_meta->>'payment_proof_url',
      payment_ref = payment_meta->>'payment_ref',
      payment_status = 'submitted',
      payment_submitted_at = now(),
      status = 'payment_submitted'
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Payment proof submitted');
END;
$$;

-- verify_payment
CREATE OR REPLACE FUNCTION verify_payment(_runner_id uuid, _mission_id uuid, verified boolean, reason text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.runner_id != _runner_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status != 'payment_submitted' THEN
    RETURN json_build_object('success', false, 'message', 'Invalid status for verification');
  END IF;

  IF verified THEN
    UPDATE missions
    SET payment_status = 'verified',
        payment_verified_at = now(),
        status = 'active_mission',
        active_at = now()
    WHERE id = _mission_id;
    RETURN json_build_object('success', true, 'message', 'Payment verified, mission active', 'new_status', 'active_mission');
  ELSE
    UPDATE missions
    SET payment_status = 'unpaid',
        status = 'runner_selected'
    WHERE id = _mission_id;
    RETURN json_build_object('success', true, 'message', 'Payment rejected', 'new_status', 'runner_selected');
  END IF;
END;
$$;

-- submit_proof_of_delivery
CREATE OR REPLACE FUNCTION submit_proof_of_delivery(_runner_id uuid, _mission_id uuid, proof_url text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.runner_id != _runner_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status != 'active_mission' THEN
    RETURN json_build_object('success', false, 'message', 'Mission not active');
  END IF;

  UPDATE missions
  SET proof_url = submit_proof_of_delivery.proof_url,
      proof_submitted_at = now(),
      status = 'proof_submitted'
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Proof submitted', 'new_status', 'proof_submitted');
END;
$$;

-- confirm_delivery
CREATE OR REPLACE FUNCTION confirm_delivery(_student_id uuid, _mission_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status != 'proof_submitted' THEN
    RETURN json_build_object('success', false, 'message', 'Invalid status');
  END IF;

  UPDATE missions
  SET delivery_confirmed_at = now(),
      status = 'awaiting_student_confirmation'
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Delivery confirmed', 'new_status', 'awaiting_student_confirmation');
END;
$$;

-- rate_runner
CREATE OR REPLACE FUNCTION rate_runner(_student_id uuid, _mission_id uuid, rating int, comment text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status NOT IN ('proof_submitted', 'awaiting_student_confirmation') THEN
    RETURN json_build_object('success', false, 'message', 'Invalid status');
  END IF;

  UPDATE missions
  SET runner_rating = rate_runner.rating,
      student_comment = rate_runner.comment,
      completed_at = now(),
      status = 'completed'
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Rating submitted', 'new_status', 'completed');
END;
$$;

COMMIT;
