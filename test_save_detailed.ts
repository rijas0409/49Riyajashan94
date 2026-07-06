import axios from "axios";

async function testSave() {
  const payload = {
    userId: "ff9d1e1d-22d8-4774-ad68-e2564da6b7cb",
    pet: {
      id: "SRV-U5B-3GF",
      name: "BRUNO",
      species: "Dog"
    },
    concerns: [{ question: "What is your main concern today?", answer: "Vomiting" }],
    healthBackground: [],
    currentHealthStatus: [],
    mediaFiles: []
  };

  try {
    const response = await fetch("http://localhost:3000/api/save-smart-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    console.log("STATUS:", response.status);
    const text = await response.text();
    console.log("BODY:", text);
  } catch (error: any) {
    console.error("ERROR:", error.message);
  }
}

testSave();
