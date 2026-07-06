const fs = require('fs');
let html = fs.readFileSync('public/smartmatch.html', 'utf8');
html = html.replace(/const payload = \{\s*userId: userId,\s*pet: currentPet,\s*assessmentId: activeAssessmentId,\s*reviewData: reviewData\s*\};/, `const payload = {
                userId: userId,
                pet: currentPet,
                assessmentId: activeAssessmentId,
                currentStep: 6,
                reviewData: reviewData
            };`);
fs.writeFileSync('public/smartmatch.html', html);
console.log("Fixed payload in public/smartmatch.html");
