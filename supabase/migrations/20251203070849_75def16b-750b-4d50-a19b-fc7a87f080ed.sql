-- Create storage bucket for seller verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-documents', 'seller-documents', false);

-- Create storage bucket for pet images and videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-media', 'pet-media', true);

-- Create storage bucket for pet documents (vaccination, certificates)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pet-documents', 'pet-documents', false);

-- RLS policies for seller-documents bucket
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'seller-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'seller-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own verification documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'seller-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'seller-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for pet-media bucket (public read, owner write)
CREATE POLICY "Anyone can view pet media"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-media');

CREATE POLICY "Users can upload pet media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pet-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their pet media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pet-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their pet media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pet-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for pet-documents bucket
CREATE POLICY "Owners can manage pet documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'pet-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'pet-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);