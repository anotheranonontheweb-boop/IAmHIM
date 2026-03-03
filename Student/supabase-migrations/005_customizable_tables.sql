-- Create a customizable settings table for Supabase
-- This table allows admins to store custom key-value pairs and lists

-- Main settings table for key-value pairs
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for custom lists (like sections, subjects, etc.)
CREATE TABLE IF NOT EXISTS custom_lists (
  id SERIAL PRIMARY KEY,
  list_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_value TEXT,
  item_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_name, item_name)
);

-- Table for school information
CREATE TABLE IF NOT EXISTS school_info (
  id SERIAL PRIMARY KEY,
  key_name TEXT UNIQUE NOT NULL,
  key_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sections if not exist
INSERT INTO custom_lists (list_name, item_name, item_value, item_order) 
VALUES 
  ('sections', '10-A', 'Grade 10 - Section A', 1),
  ('sections', '10-B', 'Grade 10 - Section B', 2),
  ('sections', '11-A', 'Grade 11 - Section A', 3),
  ('sections', '11-B', 'Grade 11 - Section B', 4),
  ('sections', '12-A', 'Grade 12 - Section A', 5)
ON CONFLICT (list_name, item_name) DO NOTHING;

-- Insert default school info
INSERT INTO school_info (key_name, key_value)
VALUES 
  ('school_name', 'My School'),
  ('school_year', '2024-2025'),
  ('semester', '1st Semester')
ON CONFLICT (key_name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key_name, key_value, description)
VALUES 
  ('attendance_start_time', '07:30', 'Daily attendance start time (24hr format)'),
  ('attendance_end_time', '08:00', 'Late cutoff time (24hr format)'),
  ('points_present', '10', 'Points for being present'),
  ('points_late', '5', 'Points for being late')
ON CONFLICT (key_name) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow read access" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON custom_lists FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON school_info FOR SELECT USING (true);

-- Allow authenticated users to update
CREATE POLICY "Allow update" ON system_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow update" ON custom_lists FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow update" ON school_info FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "Allow insert" ON system_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow insert" ON custom_lists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow insert" ON school_info FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow delete" ON system_settings FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete" ON custom_lists FOR DELETE USING (auth.role() = 'authenticated');
