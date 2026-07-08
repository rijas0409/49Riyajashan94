const fs = require('fs');
let content = fs.readFileSync('public/smartmatch.html', 'utf-8');

const startTarget = '            .then(res => {';
const endTarget = '            });';

const startIndex = content.indexOf(startTarget, content.indexOf('fetch("/api/save-smart-match"'));
if(startIndex !== -1) {
    const catchIndex = content.indexOf('catch(err => {', startIndex);
    const endIndex = content.indexOf('});', catchIndex) + 3;
    
    if (catchIndex !== -1 && endIndex !== -1) {
        const replaceBlock = `.then(res => {
                if (res && res.success) {
                    console.log("[SmartMatch Database Save Success]: Assessment record registered:", res);
                    payload.assessmentId = res.id;
                    
                    // Only transition on SUCCESS
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                    window.parent.postMessage({ type: "SUBMIT_SMART_MATCH", payload: payload }, "*");
                } else {
                    throw new Error(res?.error || "Failed to save smart match session.");
                }
            })
            .catch(err => {
                console.error("[SmartMatch Database Save Error]:", err);
                button.disabled = false;
                button.innerHTML = originalHTML;
                
                // Show the error on screen and remain on Step 6
                showToast(err.message || "A network or validation error occurred. Please try again.", "error");
            });`;
            
        content = content.substring(0, startIndex) + replaceBlock + content.substring(endIndex);
        fs.writeFileSync('public/smartmatch.html', content);
        console.log("Replaced successfully!");
    } else {
        console.log("Could not find end bounds.");
    }
} else {
    console.log("Could not find start bounds.");
}
