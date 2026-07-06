const fs = require('fs');
let html = fs.readFileSync('public/smartmatch.html', 'utf8');

const target = `            const activeIdKey = "active_assessment_id_" + (currentPet.id || currentPet.name);
            const activeAssessmentId = localStorage.getItem(activeIdKey);
            const payload = {
                userId: userId,
                pet: currentPet,
                assessmentId: activeAssessmentId,
                concerns: buildQA(answeredQuestions),
                healthBackground: buildQA(step3AnsweredQuestions),
                currentHealthStatus: buildQA(step4AnsweredQuestions),
                mediaFiles: step5MediaFiles
            };`;

const replacement = `            const activeIdKey = "active_assessment_id_" + (currentPet.id || currentPet.name);
            const activeAssessmentId = localStorage.getItem(activeIdKey);
            
            const reviewData = {
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

html = html.replace(target, replacement);
// also try another regex if that doesn't match exactly
html = html.replace(/const payload = \{[\s\S]*?mediaFiles: step5MediaFiles\n            \};/, replacement.replace(`            const activeIdKey = "active_assessment_id_" + (currentPet.id || currentPet.name);\n            const activeAssessmentId = localStorage.getItem(activeIdKey);\n            \n`, ''));
fs.writeFileSync('public/smartmatch.html', html);
console.log("Updated public/smartmatch.html");
