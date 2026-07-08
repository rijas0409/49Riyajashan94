const http = require('http');

const data = JSON.stringify({
  sessionId: "sms_local_test_" + Date.now(),
  userId: null,
  pet: { id: "test_pet_id", name: "Buddy", species: "Dog" },
  currentStep: 6,
  reviewData: { name: "Buddy" },
  concerns: [],
  healthBackground: [],
  currentHealthStatus: [],
  mediaFiles: []
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/save-smart-match',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
