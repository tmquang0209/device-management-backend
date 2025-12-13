-- Migration: Update maintenance_slip table and create maintenance_slip_detail table
-- Date: 2024-12-13
-- Description: Restructure maintenance slip to support multiple devices like loan slip

-- First, backup the existing data if needed
-- CREATE TABLE maintenance_slip_backup AS SELECT * FROM maintenance_slip;

-- Add new columns to maintenance_slip
ALTER TABLE maintenance_slip ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_slip_code ON maintenance_slip(code);

-- Create maintenance_slip_detail table
CREATE TABLE IF NOT EXISTS maintenance_slip_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_slip_id UUID NOT NULL REFERENCES maintenance_slip(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES device(id) ON DELETE RESTRICT,
    status INTEGER NOT NULL DEFAULT 1, -- 1: SENT, 2: RETURNED, 3: BROKEN
    return_date TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for maintenance_slip_detail
CREATE INDEX IF NOT EXISTS idx_maintenance_slip_detail_slip_id ON maintenance_slip_detail(maintenance_slip_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_slip_detail_device_id ON maintenance_slip_detail(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_slip_detail_status ON maintenance_slip_detail(status);

-- Comment on table
COMMENT ON TABLE maintenance_slip_detail IS 'Stores individual device details for maintenance slips';
COMMENT ON COLUMN maintenance_slip_detail.status IS '1: SENT - Device sent for maintenance, 2: RETURNED - Device returned working, 3: BROKEN - Device cannot be repaired';

-- Migrate existing data from maintenance_slip to maintenance_slip_detail
-- Note: Only run this if there's existing data and the device_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'maintenance_slip' AND column_name = 'device_id'
    ) THEN
        INSERT INTO maintenance_slip_detail (
            maintenance_slip_id,
            device_id,
            status,
            created_by,
            created_at,
            updated_at
        )
        SELECT
            id as maintenance_slip_id,
            device_id,
            CASE
                WHEN status = 0 THEN 2  -- Inactive -> RETURNED
                ELSE 1  -- Active -> SENT
            END as status,
            created_by,
            created_at,
            updated_at
        FROM maintenance_slip
        WHERE device_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Remove old columns that are no longer needed (optional, only after verifying data migration)
-- ALTER TABLE maintenance_slip DROP COLUMN IF EXISTS device_id;
-- ALTER TABLE maintenance_slip DROP COLUMN IF EXISTS transfer_status;

-- Update existing maintenance_slip.status values to new enum
-- Old: 1=Active, 0=Inactive
-- New: 1=SENDING, 2=CLOSED, 3=CANCELLED, 4=PARTIAL_RETURNED
UPDATE maintenance_slip SET status = 1 WHERE status = 1; -- Keep SENDING
UPDATE maintenance_slip SET status = 2 WHERE status = 0; -- Inactive -> CLOSED
