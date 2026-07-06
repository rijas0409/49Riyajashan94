const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/      let structuredResponses = payload\.reviewData \|\| \{[\s\S]*?        \}[\s\S]*?      \}/, `      let structuredResponses = payload.reviewData || {
        meta: { submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      };`);

// Check if there are any remaining old code
if (server.includes('oldResponses')) {
  console.log("Removing additional oldResponses block");
  server = server.replace(/      \/\/ Try to find existing draft by pet_passport_id and user_id if assessmentId not sent[\s\S]*?      let saveSuccess = false;/, `      let assessmentId = payload.assessmentId;
      
      let saveSuccess = false;`);
}

fs.writeFileSync('server.ts', server);
console.log("Fixed server.ts");
