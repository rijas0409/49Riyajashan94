async function run() {
  const payload = {
    userId: "some-user-id",
    pet: { id: "SRV-U6K-SSM", name: "Gabru", species: "Dog" },
    assessmentId: "de212d4e-c409-40b0-91e5-764399255614",
    currentStep: 6
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
