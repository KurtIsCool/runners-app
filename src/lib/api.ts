import { supabase } from './supabase';

// Wrapper for RPC calls to ensure type safety and centralized logic

export const api = {
  applyToMission: async (runnerId: string, missionId: string) => {
    return await supabase.rpc('apply_to_request', {
      _runner_id: runnerId,
      _mission_id: missionId
    });
  },

  confirmRunner: async (studentId: string, missionId: string, runnerId: string) => {
    return await supabase.rpc('confirm_runner', {
      _student_id: studentId,
      _mission_id: missionId,
      _runner_id: runnerId
    });
  },

  submitPaymentProof: async (studentId: string, missionId: string, paymentMeta: { payment_proof_url: string, payment_ref: string }) => {
    return await supabase.rpc('submit_payment_proof', {
      _student_id: studentId,
      _mission_id: missionId,
      payment_meta: paymentMeta
    });
  },

  verifyPayment: async (runnerId: string, missionId: string, verified: boolean, reason?: string) => {
    return await supabase.rpc('verify_payment', {
      _runner_id: runnerId,
      _mission_id: missionId,
      verified: verified,
      reason: reason
    });
  },

  submitProofOfDelivery: async (runnerId: string, missionId: string, proofUrl: string) => {
    return await supabase.rpc('submit_proof_of_delivery', {
      _runner_id: runnerId,
      _mission_id: missionId,
      proof_url: proofUrl
    });
  },

  confirmDelivery: async (studentId: string, missionId: string) => {
    return await supabase.rpc('confirm_delivery', {
      _student_id: studentId,
      _mission_id: missionId
    });
  },

  rateRunner: async (studentId: string, missionId: string, rating: number, comment: string) => {
    return await supabase.rpc('rate_runner', {
      _student_id: studentId,
      _mission_id: missionId,
      rating: rating,
      comment: comment
    });
  }
};
