import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
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

  if (req.method === 'GET') {
    const passportId = req.query.id;
    const userId = req.query.userId;
    
    if (!passportId) {
      if (!userId) {
        return res.json([]);
      }
      try {
        const { data, error } = await supabase
          .from("pet_passports")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return res.json(data || []);
      } catch (err: any) {
        console.error("GET Passports Error:", err);
        return res.status(500).json({ error: err.message });
      }
    }

    try {
      const { data: pet, error: petErr } = await supabase
        .from("pet_passports")
        .select("*")
        .eq("passport_id", passportId)
        .single();

      if (petErr || !pet) {
        return res.status(404).json({ error: "Passport not found or permission denied" });
      }

      const { data: medical } = await supabase
        .from("pet_medical_logs")
        .select("*")
        .eq("pet_passport_id", pet.id)
        .single();

      const { data: conditions } = await supabase
        .from("pet_health_conditions")
        .select("*")
        .eq("pet_passport_id", pet.id);

      const { data: healthRecords } = await supabase
        .from("pet_health_records_documents")
        .select("*")
        .eq("pet_passport_id", pet.id);

      return res.json({
        pet,
        medical,
        conditions,
        healthRecords
      });
    } catch (err: any) {
      console.error("GET Single Passport Error:", err);
      return res.status(555).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const payload = req.body;
  const passportId = "SRV-" + Math.random().toString(36).substring(2, 5).toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();

  try {
    const { data: petData, error: petErr } = await supabase
      .from("pet_passports")
      .insert({
        user_id: payload.userId,
        passport_id: passportId,
        pet_name: payload.petName,
        species: payload.species,
        gender: payload.gender,
        breed: payload.breed,
        appearance: payload.appearance,
        age_type: payload.ageType,
        dob: payload.dob || null,
        approx_years: payload.approxYears ? parseInt(payload.approxYears) : null,
        approx_months: payload.approxMonths ? parseInt(payload.approxMonths) : null,
        weight: payload.weight ? parseFloat(payload.weight) : null,
        owner_name: payload.ownerName,
        primary_phone: payload.primaryPhone,
        emergency_contact_name: payload.emergencyContactName,
        emergency_phone: payload.emergencyPhone,
        emergency_relationship: payload.emergencyRelationship,
        photo_url: payload.photoUrl
      }).select().single();

    if (petErr) {
      console.error("petErr", petErr);
      return res.status(500).json({ error: "Failed to insert into pet_passports: " + petErr.message });
    }

    const medicalRowId = petData.id;

    await supabase.from("pet_medical_logs").insert({
      pet_passport_id: medicalRowId,
      last_vaccination_date: payload.lastVaccinationDate || null,
      known_allergies: payload.knownAllergies,
      last_veterinary_visit: payload.lastVeterinaryVisit || null
    });

    if (payload.conditions && payload.conditions.length > 0) {
      const conditionsInserts = payload.conditions.map((c) => ({
        pet_passport_id: medicalRowId,
        condition_name: c,
        specify_other: c === 'Other' || c === 'Others' ? payload.otherConditionText : null
      }));
      await supabase.from("pet_health_conditions").insert(conditionsInserts);
    }

    if (payload.healthRecords && payload.healthRecords.length > 0) {
      await supabase.from("pet_health_records_documents").insert(
        payload.healthRecords.map((r) => ({
          pet_passport_id: medicalRowId,
          record_type: r.type,
          vaccine_name: r.vaccineName,
          specify_vaccine: r.specifyVaccine,
          date_administered: r.dateAdministered || null,
          next_due_date: r.nextDueDate || null,
          diagnosis: r.diagnosis,
          prescribed_by: r.prescribedBy,
          issue_date: r.issueDate || null,
          test_name: r.testName,
          test_date: r.testDate || null,
          procedure_name: r.procedureName,
          surgery_date: r.surgeryDate || null,
          condition_name: r.conditionName,
          certificate_title: r.certificateTitle,
          record_description: r.recordDescription,
          document_base64: r.documentBase64
        }))
      );
    }

    return res.json({ success: true, passportId });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
