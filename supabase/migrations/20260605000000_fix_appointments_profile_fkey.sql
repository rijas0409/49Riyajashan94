ALTER TABLE public.vet_appointments
  ADD CONSTRAINT vet_appointments_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.vet_appointments
  ADD CONSTRAINT vet_appointments_vet_profile_fkey FOREIGN KEY (vet_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
