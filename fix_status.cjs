const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/status: "draft"/g, 'status: currentStep === 6 ? "submitted" : "draft"');
fs.writeFileSync('server.ts', server);
console.log("Fixed status in server.ts");
