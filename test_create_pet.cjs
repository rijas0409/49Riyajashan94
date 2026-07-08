fetch("http://localhost:3000/api/pet-passport?userId=new-user-123", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pet_name: "TestNewPet" })
}).then(res => res.json()).then(console.log).catch(console.error);
