const fs = require('fs');
let content = fs.readFileSync('public/smartmatch.html', 'utf-8');

const targetBlock = `            .then(res => {
                if (res && res.success) {
                    console.log("[SmartMatch Database Save Success]: Assessment record registered:", res);
                    payload.assessmentId = res.id;
                } else {
                    console.warn("[SmartMatch Database Save Warning]:", res?.error || "Failed to save smart match session.");
                }
                
                // Restore button and transition ALWAYS
                button.disabled = false;
                button.innerHTML = originalHTML;
                window.parent.postMessage({ type: "SUBMIT_SMART_MATCH", payload: payload }, "*");
            })
            .catch(err => {
                console.error("[SmartMatch Database Save Error]:", err);
                // Restore button
                button.disabled = false;
                button.innerHTML = originalHTML;
                
                // Do not block the user if analytics save fails, proceed anyway
                window.parent.postMessage({ type: "SUBMIT_SMART_MATCH", payload: payload }, "*");
            });`;

const replaceBlock = `            .then(res => {
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

if(content.includes(targetBlock)) {
    content = content.replace(targetBlock, replaceBlock);
    fs.writeFileSync('public/smartmatch.html', content);
    console.log('Error handling fixed!');
} else {
    console.error('Target block not found, trying another matching pattern.');
}
