import { supabase } from './supabase';

export const cancelRequest = async (requestId: string, reason: string) => {
    const { error } = await supabase.rpc('cancel_request', {
        request_id: requestId,
        reason: reason
    });
    if (error) throw error;
};
