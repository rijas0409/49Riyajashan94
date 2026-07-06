const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/            current_step: currentStep,\n            updated_at: new Date\(\).toISOString\(\)\n          \}\)/, `            current_step: currentStep,
            status: currentStep === 6 ? "submitted" : "draft",
            updated_at: new Date().toISOString()
          })`);
fs.writeFileSync('server.ts', server);
console.log("Fixed update status in server.ts");
