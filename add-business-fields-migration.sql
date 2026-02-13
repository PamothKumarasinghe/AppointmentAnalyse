-- ============================================
-- COMPLETE MIGRATION: Business Fields + Availability Table Update
-- ============================================
-- Run this migration if you already have an existing database
-- This adds business location fields AND fixes the availability table
-- ============================================
-- PART 1: Add business location fields to users table
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS business_name TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS zip_code TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'USA';
-- Add comments to explain the columns
COMMENT ON COLUMN public.users.business_name IS 'Business or clinic name (for admins)';
COMMENT ON COLUMN public.users.address IS 'Street address (for admins)';
COMMENT ON COLUMN public.users.city IS 'City (for admins)';
COMMENT ON COLUMN public.users.state IS 'State/Province (for admins)';
COMMENT ON COLUMN public.users.zip_code IS 'ZIP/Postal code (for admins)';
COMMENT ON COLUMN public.users.country IS 'Country (for admins)';
-- Create indexes on city, state, and business name for faster searches
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);
CREATE INDEX IF NOT EXISTS idx_users_state ON public.users(state);
CREATE INDEX IF NOT EXISTS idx_users_business_name ON public.users(business_name);
-- ============================================
-- PART 2: Update availability table structure
-- ============================================
-- Drop old confusing columns and add new date range columns
ALTER TABLE public.availability DROP COLUMN IF EXISTS day_of_week,
    DROP COLUMN IF EXISTS specific_date,
    ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT CURRENT_DATE;
-- Update the constraint to use new date fields
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS valid_date_range,
    ADD CONSTRAINT valid_date_range CHECK (end_date >= start_date);
-- Drop old index and create new one
DROP INDEX IF EXISTS idx_availability_day;
CREATE INDEX IF NOT EXISTS idx_availability_dates ON public.availability(start_date, end_date);
-- Add comments to explain the new structure
COMMENT ON COLUMN public.availability.start_date IS 'Starting date for availability range';
COMMENT ON COLUMN public.availability.end_date IS 'Ending date for availability range';
COMMENT ON COLUMN public.availability.recurrence_type IS 'daily = single day, weekly = rest of week, monthly = rest of month';
-- ============================================
-- PART 3: Update trigger function for user creation
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (
        id,
        email,
        role,
        full_name,
        specialty,
        phone,
        business_name,
        address,
        city,
        state,
        zip_code,
        country
    )
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'specialty',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'business_name',
        NEW.raw_user_meta_data->>'address',
        NEW.raw_user_meta_data->>'city',
        NEW.raw_user_meta_data->>'state',
        NEW.raw_user_meta_data->>'zip_code',
        COALESCE(NEW.raw_user_meta_data->>'country', 'USA')
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Error creating user profile: %',
SQLERRM;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- PART 4: Update admin_profiles view
-- ============================================
-- Drop the old view first before recreating
DROP VIEW IF EXISTS public.admin_profiles;
CREATE OR REPLACE VIEW public.admin_profiles AS
SELECT id,
    email,
    full_name,
    specialty,
    phone,
    business_name,
    address,
    city,
    state,
    zip_code,
    country,
    created_at
FROM public.users
WHERE role = 'admin';
-- Re-grant access to the view
GRANT SELECT ON public.admin_profiles TO authenticated,
    anon;
-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Verify user table changes
SELECT column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN (
        'business_name',
        'address',
        'city',
        'state',
        'zip_code',
        'country'
    );
-- Verify availability table changes
SELECT column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'availability'
    AND column_name IN (
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'recurrence_type'
    );