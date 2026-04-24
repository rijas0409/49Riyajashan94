
ALTER TABLE public.vet_profiles
  ADD COLUMN IF NOT EXISTS pan_card_file text,
  ADD COLUMN IF NOT EXISTS passport_photo_file text,
  ADD COLUMN IF NOT EXISTS clinic_shop_license_file text,
  ADD COLUMN IF NOT EXISTS gst_certificate_file text,
  ADD COLUMN IF NOT EXISTS clinic_address_proof_file text,
  ADD COLUMN IF NOT EXISTS cancelled_cheque_file text,
  ADD COLUMN IF NOT EXISTS vendor_agreement_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS telemedicine_consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS clinic_photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS awards_certifications text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education_details jsonb DEFAULT '[]';
