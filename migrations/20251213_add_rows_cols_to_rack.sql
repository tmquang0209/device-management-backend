-- Migration: Add rows and cols columns to rack table
-- Date: 2025-12-13

-- Add rows column
ALTER TABLE rack ADD COLUMN IF NOT EXISTS rows INTEGER NOT NULL DEFAULT 1;

-- Add cols column
ALTER TABLE rack ADD COLUMN IF NOT EXISTS cols INTEGER NOT NULL DEFAULT 1;

-- Update code column to allow it to be auto-generated
ALTER TABLE rack ALTER COLUMN code DROP NOT NULL;
ALTER TABLE rack ALTER COLUMN code SET DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN rack.rows IS 'Number of rows in the rack';
COMMENT ON COLUMN rack.cols IS 'Number of columns in the rack';
COMMENT ON COLUMN rack.code IS 'Auto-generated rack code in format DDMMYY_XX';
