-- Add foreign key relationship for community_votes.created_by
ALTER TABLE community_votes 
ADD CONSTRAINT community_votes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;