-- Migration to change user.role_type from ENUM to VARCHAR
-- This allows dynamic user roles stored in the param table

-- Step 1: Add a temporary column to store the current enum values
ALTER TABLE "user" ADD COLUMN role_type_temp VARCHAR(50);

-- Step 2: Copy data from the enum column to the temporary column
UPDATE "user" SET role_type_temp = role_type::text;

-- Step 3: Drop the old enum column
ALTER TABLE "user" DROP COLUMN role_type;

-- Step 4: Rename the temporary column to role_type
ALTER TABLE "user" RENAME COLUMN role_type_temp TO role_type;

-- Step 5: Set NOT NULL constraint and default value
ALTER TABLE "user" ALTER COLUMN role_type SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN role_type SET DEFAULT 'STAFF';

-- Step 6: Drop the old enum type if it exists and is not used by other tables
DROP TYPE IF EXISTS "enum_user_role_type" CASCADE;

-- Optional: Add comment to explain the column
COMMENT ON COLUMN "user".role_type IS 'User role code, references param table with type=user_role';
