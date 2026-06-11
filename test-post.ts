import fetch from "node-fetch";

async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/pet-passport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petName: "Buddy",
        species: "Dog",
        gender: "Male",
        ownerName: "Test Owner",
        primaryPhone: "1234567890"
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
