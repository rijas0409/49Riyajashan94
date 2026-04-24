
-- Add 'vet' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'vet';

-- Create vet_profiles table for professional details
CREATE TABLE public.vet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL DEFAULT 'BVSc',
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  consultation_type TEXT NOT NULL DEFAULT 'both', -- online, offline, both
  vet_degree_file TEXT,
  registration_number TEXT,
  govt_id_file TEXT,
  clinic_registration_file TEXT,
  profile_photo TEXT,
  clinic_address TEXT,
  available_days TEXT[] NOT NULL DEFAULT '{}',
  morning_slots BOOLEAN DEFAULT true,
  evening_slots BOOLEAN DEFAULT true,
  online_fee NUMERIC NOT NULL DEFAULT 500,
  offline_fee NUMERIC NOT NULL DEFAULT 800,
  bank_account_name TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  preferred_language TEXT DEFAULT 'English',
  is_active BOOLEAN DEFAULT true,
  verification_status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
  total_consultations INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  wallet_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can view own profile" ON public.vet_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vets can update own profile" ON public.vet_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vets can insert own profile" ON public.vet_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can view all vet profiles" ON public.vet_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admin can update any vet profile" ON public.vet_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Anyone can view verified active vets" ON public.vet_profiles FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- Create vet_appointments table
CREATE TABLE public.vet_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL REFERENCES auth.users(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pet_name TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  pet_breed TEXT,
  appointment_type TEXT NOT NULL DEFAULT 'online', -- online, offline
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled, rescheduled
  reschedule_count INTEGER DEFAULT 0,
  consultation_notes TEXT,
  diagnosis TEXT,
  medicines TEXT,
  care_instructions TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  call_duration INTEGER, -- seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can view own appointments" ON public.vet_appointments FOR SELECT USING (auth.uid() = vet_id);
CREATE POLICY "Users can view own appointments" ON public.vet_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create appointments" ON public.vet_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vets can update own appointments" ON public.vet_appointments FOR UPDATE USING (auth.uid() = vet_id);
CREATE POLICY "Admin can view all appointments" ON public.vet_appointments FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_appointments;

-- Create vet_earnings table
CREATE TABLE public.vet_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.vet_appointments(id),
  amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  payout_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets can view own earnings" ON public.vet_earnings FOR SELECT USING (auth.uid() = vet_id);
CREATE POLICY "Admin can view all earnings" ON public.vet_earnings FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

-- Create vet_reviews table
CREATE TABLE public.vet_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vet_id UUID NOT NULL REFERENCES auth.users(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  appointment_id UUID REFERENCES public.vet_appointments(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vet_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vet reviews" ON public.vet_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.vet_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create vet-documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('vet-documents', 'vet-documents', false);

CREATE POLICY "Vets can upload own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Vets can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'vet-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admin can view all vet documents" ON storage.objects FOR SELECT USING (bucket_id = 'vet-documents' AND has_role(auth.uid(), 'admin'::user_role));

-- Trigger for updated_at
CREATE TRIGGER update_vet_profiles_updated_at BEFORE UPDATE ON public.vet_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vet_appointments_updated_at BEFORE UPDATE ON public.vet_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
