const fs = require('fs');
let content = fs.readFileSync('public/smartmatch.html', 'utf-8');

const targetBlock = `            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errMsg = "Database save failed: " + text;
                        try {
                            const parsed = JSON.parse(text);
                            errMsg = parsed.error || parsed.message || errMsg;
                        } catch(e) {}
                        console.error(errMsg);
                        return { success: false, error: errMsg };
                    });
                }`;

const replacementBlock = `            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        let errMsg = text;
                        try {
                            const parsed = JSON.parse(text);
                            errMsg = parsed.error || parsed.message || JSON.stringify(parsed);
                        } catch(e) {
                            errMsg = "System Error: " + text.substring(0, 100);
                        }
                        console.error("Save Error Response:", errMsg);
                        return { success: false, error: errMsg };
                    });
                }`;

if(content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    fs.writeFileSync('public/smartmatch.html', content);
    console.log("Replaced error toast logic!");
} else {
    console.log("Could not find target block");
}
