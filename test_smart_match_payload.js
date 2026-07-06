async function run() {
  const payload = {
    userId: "test-user",
    pet: { id: "test-pet-id", name: "BRUNO", species: "Dog" },
    assessmentId: null,
    concerns: [],
    healthBackground: [],
    currentHealthStatus: [],
    mediaFiles: []
  };

  try {
    const res = await fetch("http://localhost:3000/api/save-smart-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (err) {
    console.error(err);
  }
}
run();
