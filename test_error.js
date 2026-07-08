const text = `{"error": "This is an error"}`;
let errMsg = "Database save failed: " + text;
try {
    const parsed = JSON.parse(text);
    errMsg = parsed.error || parsed.message || errMsg;
} catch(e) {}
console.log(errMsg);
