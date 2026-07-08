const fs = require('fs');
let content = fs.readFileSync('public/smartmatch.html', 'utf-8');

const targetFunction = `        function saveRealtimeResponse(data) {`;
const startIndex = content.indexOf(targetFunction);
if(startIndex !== -1) {
    const endIndex = content.indexOf(`        let answeredQuestions = [];`, startIndex);
    if(endIndex !== -1) {
        content = content.substring(0, startIndex) + `        function saveRealtimeResponse(data) {\n            // Real-time save disabled as requested. All data will be saved at Step 6.\n        }\n\n` + content.substring(endIndex);
        fs.writeFileSync('public/smartmatch.html', content);
        console.log("Realtime save disabled!");
    } else {
        console.log("End index not found");
    }
} else {
    console.log("Target function not found");
}
