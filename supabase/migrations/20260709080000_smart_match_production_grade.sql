-- Migration: Make Smart Match Production Grade
-- Added: July 09, 2026

-- 1. Add geographic coordinates to addresses table for distance calculation if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addresses') THEN
        ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    END IF;
END $$;

-- 2. Add geographic coordinates to vet_profiles table for distance calculation if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vet_profiles') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    END IF;
END $$;

-- 3. Create a unique index on active vet appointments to prevent double-booking at DB level
-- First, clean up any existing duplicate active appointments (marking all but the latest one as cancelled)
-- This allows cancelled/completed appointments to be released while keeping active ones safe.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vet_appointments') THEN
        WITH duplicates AS (
            SELECT id,
                   row_number() OVER (
                       PARTITION BY vet_id, appointment_date, appointment_time 
                       ORDER BY created_at DESC, id
                   ) as rn
            FROM public.vet_appointments
            WHERE status NOT IN ('cancelled', 'completed', 'rejected', 'done', 'Canceled', 'Cancelled', 'Completed')
        )
        UPDATE public.vet_appointments
        SET status = 'cancelled'
        WHERE id IN (
            SELECT id 
            FROM duplicates 
            WHERE rn > 1
        );
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_vet_appointments 
ON public.vet_appointments (vet_id, appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'completed', 'rejected', 'done', 'Canceled', 'Cancelled', 'Completed');
