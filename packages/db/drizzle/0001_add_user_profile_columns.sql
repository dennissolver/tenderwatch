-- Add centralised profile columns to the users table
-- These columns store business details needed by tender portal registrations

ALTER TABLE users ADD COLUMN IF NOT EXISTS acn TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Australia';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_position TEXT;
