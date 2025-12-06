-- Add cancellation_reason column
ALTER TABLE requests ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create cancel_request RPC function
CREATE OR REPLACE FUNCTION cancel_request(request_id UUID, reason TEXT)
RETURNS VOID AS $$
DECLARE
  req_status text;
  req_student_id UUID;
  req_runner_id UUID;
  caller_id UUID;
BEGIN
  -- Get current user ID
  caller_id := auth.uid();

  -- Get request details
  SELECT status, student_id, runner_id INTO req_status, req_student_id, req_runner_id
  FROM requests
  WHERE id = request_id;

  -- Check if request exists
  IF req_status IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Authorization Check: Must be student or assigned runner
  IF caller_id != req_student_id AND (req_runner_id IS NULL OR caller_id != req_runner_id) THEN
    RAISE EXCEPTION 'Not authorized to cancel this request';
  END IF;

  -- Status Check
  -- Allowed stages:
  -- 1. requested (Request Posted)
  -- 2. pending_runner (Runner applied)
  -- 3. awaiting_payment (Student accepted runner)
  -- 4. payment_review (Student paid, runner reviewing)
  -- NOT Allowed: accepted (Active mission started), purchasing, delivering, delivered, completed, cancelled, disputed
  IF req_status NOT IN ('requested', 'pending_runner', 'awaiting_payment', 'payment_review') THEN
    RAISE EXCEPTION 'Cancellation not allowed at this stage (%)', req_status;
  END IF;

  -- Update request
  UPDATE requests
  SET status = 'cancelled',
      cancellation_reason = reason
  WHERE id = request_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
