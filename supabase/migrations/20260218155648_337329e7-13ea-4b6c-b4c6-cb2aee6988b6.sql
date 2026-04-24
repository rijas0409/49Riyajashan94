
-- Create pet_vaccinations table to store structured vaccination data
CREATE TABLE public.pet_vaccinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_type TEXT NOT NULL,
  dose_number TEXT NOT NULL,
  date_administered DATE NOT NULL,
  next_due_date DATE,
  certificate_url TEXT,
  certificate_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;

-- Pet owners can manage their pet's vaccinations
CREATE POLICY "Pet owners can insert vaccinations"
ON public.pet_vaccinations
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pets WHERE pets.id = pet_vaccinations.pet_id AND pets.owner_id = auth.uid()
));

CREATE POLICY "Pet owners can update vaccinations"
ON public.pet_vaccinations
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.pets WHERE pets.id = pet_vaccinations.pet_id AND pets.owner_id = auth.uid()
));

CREATE POLICY "Pet owners can delete vaccinations"
ON public.pet_vaccinations
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pets WHERE pets.id = pet_vaccinations.pet_id AND pets.owner_id = auth.uid()
));

-- Anyone can view vaccinations for available verified pets (same as pets policy)
CREATE POLICY "Anyone can view pet vaccinations"
ON public.pet_vaccinations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.pets WHERE pets.id = pet_vaccinations.pet_id 
  AND ((pets.is_available = true AND pets.verification_status = 'verified') OR pets.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role))
));
