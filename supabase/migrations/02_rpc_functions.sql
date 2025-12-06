-- apply_to_request
CREATE OR REPLACE FUNCTION apply_to_request(_runner_id uuid, _mission_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status text;
BEGIN
  -- Validate mission status
  SELECT status INTO current_status FROM missions WHERE id = _mission_id;
  IF current_status NOT IN ('requested', 'pending_runner_confirmation', 'runner_selected') THEN
    RETURN json_build_object('success', false, 'message', 'Mission is not accepting applications');
  END IF;

  -- Insert applicant
  INSERT INTO mission_applicants (mission_id, runner_id)
  VALUES (_mission_id, _runner_id)
  ON CONFLICT DO NOTHING; -- Handle duplicate apply gracefully

  -- Update status if it was 'requested' to 'pending_runner_confirmation'
  -- Prompt says: "Runner applies... -> mission status becomes: pending_runner_confirmation"
  -- But check if we should overwrite 'runner_selected' if explicitly allowed.
  -- Logic: If status is requested, move to pending.
  IF current_status = 'requested' THEN
    UPDATE missions SET status = 'pending_runner_confirmation' WHERE id = _mission_id;
    current_status := 'pending_runner_confirmation';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Application submitted', 'new_status', current_status);
END;
$$;

-- confirm_runner
CREATE OR REPLACE FUNCTION confirm_runner(_student_id uuid, _mission_id uuid, _runner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mission_record record;
  active_mission_count int;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  -- Validate caller (student)
  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Validate status
  IF mission_record.status NOT IN ('requested', 'pending_runner_confirmation') THEN
    RETURN json_build_object('success', false, 'message', 'Mission not in selectable state');
  END IF;

  -- Validate runner applied
  PERFORM 1 FROM mission_applicants WHERE mission_id = _mission_id AND runner_id = _runner_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Runner has not applied');
  END IF;

  -- Atomic check: ensure runner has NO active mission
  SELECT COUNT(*) INTO active_mission_count
  FROM missions
  WHERE runner_id = _runner_id
    AND status IN ('runner_selected', 'awaiting_payment', 'payment_submitted', 'payment_verified', 'active_mission', 'proof_submitted');

  IF active_mission_count > 0 THEN
    RETURN json_build_object('success', false, 'message', 'Runner already has an active mission');
  END IF;

  -- Update mission
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
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mission_record record;
BEGIN
  SELECT * INTO mission_record FROM missions WHERE id = _mission_id;

  IF mission_record.student_id != _student_id THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  IF mission_record.status != 'runner_selected' AND mission_record.status != 'awaiting_payment' THEN
     -- awaiting_payment is optional synonym, supporting both
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
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        status = 'active_mission', -- Transition directly to active as per prompt 5 -> active
        active_at = now()
    WHERE id = _mission_id;
    RETURN json_build_object('success', true, 'message', 'Payment verified, mission active', 'new_status', 'active_mission');
  ELSE
    -- Revert to awaiting payment or just stay submitted but mark as rejected?
    -- Prompt says: "allow runner to set payment_status='unpaid' or keep as payment_submitted"
    -- "Student re-uploads proof" -> implies we should go back to a state where they can upload.
    UPDATE missions
    SET payment_status = 'unpaid',
        status = 'runner_selected' -- Go back to step before payment
        -- reason?
    WHERE id = _mission_id;
    RETURN json_build_object('success', true, 'message', 'Payment rejected', 'new_status', 'runner_selected');
  END IF;
END;
$$;

-- submit_proof_of_delivery
CREATE OR REPLACE FUNCTION submit_proof_of_delivery(_runner_id uuid, _mission_id uuid, proof_url text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Updates status to awaiting_student_confirmation or completed?
  -- Prompt: "Set delivery_confirmed_at=now(), show Rating UI... after rating ... status='completed'"
  -- So here we probably just set confirmation time and return success. Status transition happens after rating OR we use an intermediate status.
  -- Prompt says: "awaiting_student_confirmation (optional visible stage between proof and completed)"
  -- Let's set it to that to trigger UI.
  UPDATE missions
  SET delivery_confirmed_at = now(),
      status = 'awaiting_student_confirmation'
  WHERE id = _mission_id;

  RETURN json_build_object('success', true, 'message', 'Delivery confirmed', 'new_status', 'awaiting_student_confirmation');
END;
$$;

-- rate_runner
CREATE OR REPLACE FUNCTION rate_runner(_student_id uuid, _mission_id uuid, rating int, comment text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Ideally update aggregate rating on users table here too
  -- UPDATE users SET ...

  RETURN json_build_object('success', true, 'message', 'Rating submitted', 'new_status', 'completed');
END;
$$;
