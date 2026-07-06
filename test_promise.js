Promise.resolve({ ok: false, text: () => Promise.resolve("413 Payload Too Large") })
.then(response => {
    if (!response.ok) {
        return response.text().then(text => {
            throw new Error(text);
        });
    }
    return response.json();
})
.then(res => {
    console.log("Success then:", res);
})
.catch(err => {
    console.log("Catch:", err.message);
});
