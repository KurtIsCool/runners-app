-- Rename request_id to mission_id in messages table
ALTER TABLE messages RENAME COLUMN request_id TO mission_id;

-- Update foreign key if necessary (assuming it references requests/missions)
-- ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_request_id_fkey;
-- ALTER TABLE messages ADD CONSTRAINT messages_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
