-- Allow viewing vaccination certificates in pet-documents for visible pet listings
CREATE POLICY "Public can view vaccination certificates for visible pets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'pet-documents'
  AND EXISTS (
    SELECT 1
    FROM public.pet_vaccinations pv
    JOIN public.pets p ON p.id = pv.pet_id
    WHERE pv.certificate_url = name
      AND (
        (p.is_available = true AND p.verification_status = 'verified')
        OR p.owner_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

-- Improve lookup speed when resolving certificate file paths
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_certificate_url
ON public.pet_vaccinations (certificate_url);