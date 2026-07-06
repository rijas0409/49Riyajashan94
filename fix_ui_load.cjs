const fs = require('fs');
let html = fs.readFileSync('public/smartmatch.html', 'utf8');

// There is some UI loading logic we should probably just disable if we aren't saving drafts.
html = html.replace(/function loadDraftProgress\(\) \{[\s\S]*?\}\)/, `function loadDraftProgress() {
            // Disabled: We no longer save or load drafts incrementally.
            return Promise.resolve();
        }`);
fs.writeFileSync('public/smartmatch.html', html);
console.log("Disabled loadDraftProgress in smartmatch.html");
