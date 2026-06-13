import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body;
  const passportId = payload.passportId;
  const record = payload.record;

  if (!passportId) {
    return res.status(400).json({ error: 'passportId is required' });
  }
  if (!record) {
    return res.status(400).json({ error: 'record is required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

  let supabaseUrlClean = supabaseUrl.trim();
  try {
    const urlObj = new URL(supabaseUrlClean);
    supabaseUrlClean = urlObj.origin;
  } catch (e) {
    supabaseUrlClean = supabaseUrlClean.replace(/\/$/, "");
  }

  const supabase = createClient(supabaseUrlClean, supabaseKey.trim());

  try {
    // Get pet_passport rows ID
    const { data: pet, error: petErr } = await supabase
      .from("pet_passports")
      .select("id")
      .eq("passport_id", passportId)
      .maybeSingle();

    if (petErr) {
      return res.status(500).json({ error: "Error searching passport: " + petErr.message });
    }
    if (!pet) {
      return res.status(404).json({ error: "Passport not found" });
    }

    // First upload the document if exists
    let fileUrl = null;
    let filePath = null;
    const bucket = "pet-documents";
    
    if (record.documentBase64 && record.documentBase64.startsWith("data:")) {
       try {
           const matches = record.documentBase64.match(/^data:(.+?);base64,(.+)$/);
           if (matches && matches.length === 3) {
               const mimeType = matches[1];
               const base64Data = matches[2];
               
               let ext = 'bin';
               if (mimeType.includes('pdf')) ext = 'pdf';
               else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
               else if (mimeType.includes('png')) ext = 'png';
               
               filePath = `${passportId}/records/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
               
               const buffer = Buffer.from(base64Data, 'base64');
               
               const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, buffer, {
                   contentType: mimeType,
                   upsert: true
               });
               
               if (!uploadErr) {
                   const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
                   fileUrl = publicUrlData.publicUrl;
               } else {
                   console.error("Storage upload error:", uploadErr);
               }
           }
       } catch (err) {
           console.error("Failed to upload document to storage:", err);
       }
    }

    // Insert into pet_health_records_documents
    const { data, error } = await supabase
      .from("pet_health_records_documents")
      .insert({
        pet_passport_id: pet.id,
        record_type: record.type,
        vaccine_name: record.vaccineName,
        specify_vaccine: record.specifyVaccine,
        date_administered: record.dateAdministered || null,
        next_due_date: record.nextDueDate || null,
        diagnosis: record.diagnosis,
        prescribed_by: record.prescribedBy,
        issue_date: record.issueDate || null,
        test_name: record.testName,
        test_date: record.testDate || null,
        procedure_name: record.procedureName,
        surgery_date: record.surgeryDate || null,
        condition_name: record.conditionName,
        certificate_title: record.certificateTitle,
        record_description: record.recordDescription,
        document_base64: record.documentBase64,
        file_url: fileUrl,
        file_path: filePath,
        storage_bucket: bucket
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to insert health record: " + error.message });
    }

    return res.json({ success: true, record: data });
  } catch (err: any) {
    console.error("Error adding single health record:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
