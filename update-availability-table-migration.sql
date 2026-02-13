-- ============================================
-- MIGRATION: Update Availability Table Structure
-- ============================================
-- Run this migration to fix weekly/monthly slot generation
-- This changes from confusing day_of_week/specific_date to clear start_date/end_date
-- Step 1: Drop old columns and add new ones
ALTER TABLE public.availability DROP COLUMN IF EXISTS day_of_week,
    DROP COLUMN IF EXISTS specific_date,
    ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT CURRENT_DATE;
-- Step 2: Update the constraint to use new date fields
ALTER TABLE public.availability DROP CONSTRAINT IF EXISTS valid_date_range,
    ADD CONSTRAINT valid_date_range CHECK (end_date >= start_date);
-- Step 3: Drop old index and create new one
DROP INDEX IF EXISTS idx_availability_day;
CREATE INDEX IF NOT EXISTS idx_availability_dates ON public.availability(start_date, end_date);
-- Step 4: Add comments to explain the new structure
COMMENT ON COLUMN public.availability.start_date IS 'Starting date for availability range';
COMMENT ON COLUMN public.availability.end_date IS 'Ending date for availability range';
COMMENT ON COLUMN public.availability.recurrence_type IS 'daily = single day, weekly = rest of week, monthly = rest of month';
-- Step 5: Update the trigger function to include business fields (if not already updated)
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
-- Step 6: Update the admin_profiles view to include business fields
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
-- Verify the changes
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