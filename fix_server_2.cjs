const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// Find the start:
const startStr = '      const dbUserId = (userId && uuidRegex.test(userId)) ? userId : null;';
const endStr = '      let saveSuccess = false;';

const startIndex = server.indexOf(startStr);
const endIndex = server.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `      const dbUserId = (userId && uuidRegex.test(userId)) ? userId : null;
      let structuredResponses = payload.reviewData || {
        meta: { submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      };

      let assessmentId = payload.assessmentId;
      
`;
  
  server = server.substring(0, startIndex) + newContent + server.substring(endIndex);
  fs.writeFileSync('server.ts', server);
  console.log("Fixed server.ts successfully");
} else {
  console.log("Could not find start or end bounds!");
}
