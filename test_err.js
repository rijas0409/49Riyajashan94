const html = "<html><body>413 Request Entity Too Large</body></html>";
let errMessage = html;
try {
  const parsed = JSON.parse(html);
  errMessage = parsed.error || parsed.message || html;
} catch(e) {}
const err = new Error(errMessage);
console.log(err.message === "Error");
console.log(err.message);
