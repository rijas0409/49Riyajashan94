const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`
  <div id="block_Q1">
    <h3>Is your pet limping?</h3>
    <div class="qa-option selected"><span>Yes</span></div>
  </div>
  <div id="block_Q2">
    <h3>What is the issue?</h3>
    <input type="text" value="Not sure" />
  </div>
`);
const document = dom.window.document;
function extractQA(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return null;
    const qEl = block.querySelector("h3");
    const q = qEl ? qEl.textContent : "Question";
    let a = "Not answered";
    const selectedBtn = block.querySelector(".qa-option.selected span");
    if (selectedBtn) {
        a = selectedBtn.textContent;
    } else {
        const inputEl = block.querySelector("input[type='text'], textarea");
        if (inputEl && inputEl.value.trim() !== "") {
            a = inputEl.value.trim();
        } else if (inputEl && inputEl.value.trim() === "") {
            a = "Skipped";
        }
    }
    return { q, a };
}
console.log(extractQA("block_Q1"));
console.log(extractQA("block_Q2"));
console.log(extractQA("block_Q3"));
