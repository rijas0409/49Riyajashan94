async function run() {
  const payload = {
    userId: "test-user",
    pet: { id: "random-id-123", name: "RandomPetNameNotExists", species: "Dog" }
  };
  try {
    const res = await fetch("http://localhost:3000/api/save-smart-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch(e) {}
}
run();
