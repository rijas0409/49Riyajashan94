const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// Replace the response building logic in /api/save-smart-match
const target = `      let structuredResponses: any = {
        pet_details: { 
           id: payload.pet?.id, 
           name: payload.pet?.name, 
           species: payload.pet?.species 
        },
        step2_concerns: payload.concerns || [],
        step3_health_background: payload.healthBackground || [],
        step4_current_health_status: payload.currentHealthStatus || [],
        step5_media_files: payload.mediaFiles || [],
        meta: { submitted_at: new Date().toISOString() }
      };

      let assessmentId = payload.assessmentId;

      // Try to find existing draft by pet_passport_id and user_id if assessmentId not sent
      if (!assessmentId || !uuidRegex.test(assessmentId)) {
        const { data: existingDrafts } = await supabaseAdmin
          .from("care_match_assessments")
          .select("id, responses")
          .eq("pet_passport_id", petPassportId)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingDrafts && existingDrafts.length > 0) {
          assessmentId = existingDrafts[0].id;
          const oldResponses = existingDrafts[0].responses as any;
          if (oldResponses) {
            structuredResponses = {
              ...oldResponses,
              pet_details: { 
                 id: payload.pet?.id || oldResponses.pet_details?.id, 
                 name: payload.pet?.name || oldResponses.pet_details?.name, 
                 species: payload.pet?.species || oldResponses.pet_details?.species 
              },
              meta: {
                submitted_at: oldResponses.meta?.submitted_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            };
            if (payload.concerns !== undefined && payload.concerns !== null) {
              structuredResponses.step2_concerns = payload.concerns;
            }
            if (payload.healthBackground !== undefined && payload.healthBackground !== null) {
              structuredResponses.step3_health_background = payload.healthBackground;
            }
            if (payload.currentHealthStatus !== undefined && payload.currentHealthStatus !== null) {
              structuredResponses.step4_current_health_status = payload.currentHealthStatus;
            }
            if (payload.mediaFiles !== undefined && payload.mediaFiles !== null) {
              structuredResponses.step5_media_files = payload.mediaFiles;
            }
          }
        }
      } else {
        // If assessmentId was provided, fetch old response to merge
        const { data: existingRow } = await supabaseAdmin
          .from("care_match_assessments")
          .select("responses")
          .eq("id", assessmentId)
          .maybeSingle();

        if (existingRow && existingRow.responses) {
          const oldResponses = existingRow.responses as any;
          structuredResponses = {
            ...oldResponses,
            pet_details: { 
               id: payload.pet?.id || oldResponses.pet_details?.id, 
               name: payload.pet?.name || oldResponses.pet_details?.name, 
               species: payload.pet?.species || oldResponses.pet_details?.species 
            },
            meta: {
              submitted_at: oldResponses.meta?.submitted_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
          if (payload.concerns !== undefined && payload.concerns !== null) {
            structuredResponses.step2_concerns = payload.concerns;
          }
          if (payload.healthBackground !== undefined && payload.healthBackground !== null) {
            structuredResponses.step3_health_background = payload.healthBackground;
          }
          if (payload.currentHealthStatus !== undefined && payload.currentHealthStatus !== null) {
            structuredResponses.step4_current_health_status = payload.currentHealthStatus;
          }
          if (payload.mediaFiles !== undefined && payload.mediaFiles !== null) {
            structuredResponses.step5_media_files = payload.mediaFiles;
          }
        }
      }`;

const replacement = `      let structuredResponses = payload.reviewData || {
        meta: { submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      };

      let assessmentId = payload.assessmentId;`;

// Use regex just in case there are whitespace differences
server = server.replace(/      let structuredResponses: any = \{[\s\S]*?        \}[\s\S]*?      \}/, replacement);
fs.writeFileSync('server.ts', server);
console.log("Updated server.ts");
