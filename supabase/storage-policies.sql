-- Storage Bucket Policies

-- Create storage buckets
-- Run these in the SQL Editor:
INSERT INTO storage.buckets (id, name) VALUES ('owner-docs', 'Owner Documents') ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name) VALUES ('driver-docs', 'Driver Documents') ON CONFLICT DO NOTHING;

-- Owner documents storage policies
CREATE POLICY "Owners can upload their documents" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'owner-docs' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can view their own documents" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'owner-docs' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Driver documents storage policies
CREATE POLICY "Drivers can upload their documents" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'driver-docs' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Drivers can view their own documents" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'driver-docs' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin policies for document review
CREATE POLICY "Admins can view all documents" ON storage.objects 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.users ON auth.users.id = public.users.id
      WHERE auth.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );
