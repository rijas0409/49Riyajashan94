const fs = require('fs');
let html = fs.readFileSync('public/smartmatch.html', 'utf8');

const replacement = `            const reviewData = {
                "Pet Profile": {
                    "Name": currentPet.name || "",
                    "Type": currentPet.species || "",
                    "Breed": currentPet.breed || "",
                    "Age": currentPet.age || "",
                    "Gender": currentPet.gender || "",
                    "Weight": currentPet.weight || ""
                },
                "Current Concern": buildQA(answeredQuestions),
                "Health Background": buildQA(step3AnsweredQuestions),
                "Current Health Status": buildQA(step4AnsweredQuestions),
                "Photos & Videos": step5MediaFiles.map(f => typeof f === 'string' ? f : 'Media File')
            };

            const payload = {
                userId: userId,
                pet: currentPet,
                assessmentId: activeAssessmentId,
                reviewData: reviewData
            };`;

html = html.replace(/const payload = \{\s*userId: userId,\s*pet: currentPet,\s*assessmentId: activeAssessmentId,\s*concerns: buildQA\(answeredQuestions\),\s*healthBackground: buildQA\(step3AnsweredQuestions\),\s*currentHealthStatus: buildQA\(step4AnsweredQuestions\),\s*mediaFiles: step5MediaFiles\s*\};/, replacement);

fs.writeFileSync('public/smartmatch.html', html);
console.log("Updated public/smartmatch.html");
