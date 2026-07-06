async function run() {
  const payload = {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    pet: { id: "123e4567-e89b-12d3-a456-426614174000", name: "test", species: "Dog" }
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
