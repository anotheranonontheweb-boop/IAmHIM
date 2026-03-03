-- Migration: Add absent_reason and absence_type columns to attendance_records
-- Run this in Supabase SQL Editor

-- Add columns for tracking absent reasons
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS absent_reason TEXT,
ADD COLUMN IF NOT EXISTS absence_type TEXT CHECK (absence_type IN ('excused', 'unexcused'));

-- Create index for faster queries on absence_type
CREATE INDEX IF NOT EXISTS idx_attendance_records_absence_type ON attendance_records(absence_type);

-- Add comment to explain the columns
COMMENT ON COLUMN attendance_records.absent_reason IS 'Reason for absence provided by teacher';
COMMENT ON COLUMN attendance_records.absence_type IS 'Type of absence: excused or unexcused';
