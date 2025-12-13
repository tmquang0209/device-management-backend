-- Migration: Create equipment_return_slip and equipment_return_slip_detail tables
-- Date: 2025-12-13

-- Create equipment_return_slip table
CREATE TABLE IF NOT EXISTS equipment_return_slip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    equipment_loan_slip_id UUID NOT NULL REFERENCES equipment_loan_slip(id),
    returner_id UUID NOT NULL REFERENCES partner(id),
    return_date TIMESTAMP NOT NULL,
    status INTEGER NOT NULL DEFAULT 1, -- 1: RETURNED, 2: CANCELLED
    note TEXT,
    created_by UUID REFERENCES "user"(id),
    modified_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create equipment_return_slip_detail table
CREATE TABLE IF NOT EXISTS equipment_return_slip_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_return_slip_id UUID NOT NULL REFERENCES equipment_return_slip(id),
    device_id UUID NOT NULL REFERENCES device(id),
    note TEXT,
    created_by UUID REFERENCES "user"(id),
    modified_by UUID REFERENCES "user"(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_loan_slip_id ON equipment_return_slip(equipment_loan_slip_id);
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_returner_id ON equipment_return_slip(returner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_status ON equipment_return_slip(status);
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_return_date ON equipment_return_slip(return_date);
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_code ON equipment_return_slip(code);

CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_detail_return_slip_id ON equipment_return_slip_detail(equipment_return_slip_id);
CREATE INDEX IF NOT EXISTS idx_equipment_return_slip_detail_device_id ON equipment_return_slip_detail(device_id);

-- Add comment for documentation
COMMENT ON TABLE equipment_return_slip IS 'Stores equipment return transactions';
COMMENT ON COLUMN equipment_return_slip.code IS 'Return slip code format: GDNT_ddmmyy_XXX';
COMMENT ON COLUMN equipment_return_slip.status IS '1: RETURNED (Đã nhập kho), 2: CANCELLED (Đã hủy)';

COMMENT ON TABLE equipment_return_slip_detail IS 'Stores devices returned in each return slip';
