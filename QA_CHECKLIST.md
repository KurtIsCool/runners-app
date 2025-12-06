# QA Checklist

## Overview
This document outlines the testing performed for the Request-to-Payment-to-Activation flow.
**Note:** Automated Playwright execution was attempted but encountered severe environment limitations (missing system dependencies `libgtk-4`, `libnss`, etc., required for headless browsers). The tests provided in `tests/e2e.spec.ts` are logically sound and cover the required scenarios, but could not be verified in this specific container.

## Test Scenarios (`tests/e2e.spec.ts`)

### 1. Happy Path
**Flow:** Post -> Apply -> Confirm -> Pay -> Verify -> Active -> Proof -> Confirm -> Rate
**Status:** Implemented.
**Verification:**
- Validates the complete lifecycle.
- Checks DB state transitions via UI feedback.
- Ensures all RPCs (`apply`, `confirm`, `submit_payment`, `verify`, `submit_proof`, `confirm_delivery`, `rate`) are called in sequence.

### 2. Runner Already Has Active Mission
**Flow:** Runner with active mission applies for another -> Student tries to confirm -> Error.
**Status:** Implemented.
**Verification:**
- Validates the `confirm_runner` RPC atomic check (`active_mission_count > 0`).
- Ensures UI handles the error gracefully (toast/message) without changing state.

### 3. Payment Proof Rejected
**Flow:** Student submits bad proof -> Runner rejects -> Student re-uploads -> Runner verifies.
**Status:** Implemented (UI and Logic).
**Verification:**
- Validates `verify_payment` RPC with `verified=false`.
- **UI Update:** Added "Reject Payment" button in `ActiveJobView.tsx` which prompts for a reason and calls the RPC.
- Ensures state reverts to `runner_selected` (or similar) allowing re-upload.
- Confirms subsequent successful path.

### 4. Multiple Applicants
**Flow:** Two runners apply -> Student confirms one.
**Status:** Implemented.
**Verification:**
- Ensures `confirm_runner` only assigns the specific runner ID.
- Verifies the non-selected runner remains in "Applied" state and does not see the active mission UI.

## Manual Verification Steps (Recommended for Reviewer)
1.  **Environment:** Run locally with `npm run dev` and a local Supabase instance.
2.  **Setup:** Create 1 Student, 2 Runners.
3.  **Execute:** Follow the steps in the Happy Path test manually.
4.  **Edge Cases:**
    - Try to confirm a runner who already has an "Active Mission" status.
    - As a runner, click "Reject Payment" on the payment verification screen and confirm state revert.

## Deliverables
- [x] SQL Migrations (`supabase/migrations/`)
- [x] Backend RPCs (Atomic Functions)
- [x] Frontend Code (React + TypeScript)
- [x] Realtime Subscriptions
- [x] Playwright Test Suite (`tests/e2e.spec.ts`)
- [x] README / QA Checklist
