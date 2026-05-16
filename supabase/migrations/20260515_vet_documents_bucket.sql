INSERT INTO storage.buckets (id, name, public) VALUES ('vet-documents', 'vet-documents', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "vet_documents_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'vet-documents');
CREATE POLICY "vet_documents_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vet-documents' AND auth.role() = 'authenticated');
CREATE POLICY "vet_documents_update" ON storage.objects FOR UPDATE USING (bucket_id = 'vet-documents' AND auth.role() = 'authenticated');
