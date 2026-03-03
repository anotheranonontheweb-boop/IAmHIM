-- Create settings table for customizable point values
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default point values
INSERT INTO settings (key, value, description) VALUES
  ('present_points', '10', 'Points awarded for present status'),
  ('late_points', '5', 'Points awarded for late status')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all
CREATE POLICY "Allow read access to settings" ON settings
  FOR SELECT USING (true);

-- Allow admin to update
CREATE POLICY "Allow admin to update settings" ON settings
  FOR UPDATE USING (true);

-- Allow insert for admin
CREATE POLICY "Allow admin to insert settings" ON settings
  FOR INSERT WITH CHECK (true);
