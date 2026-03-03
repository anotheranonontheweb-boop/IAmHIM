-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL,
  reward_name VARCHAR(255) NOT NULL,
  points_cost INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add status check constraint
ALTER TABLE reward_redemptions 
ADD CONSTRAINT reward_redemptions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));
