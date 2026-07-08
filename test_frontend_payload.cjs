// simulate a full payload
const payload = {
    userId: "cb5e830c-5d95-4a38-a9e2-c919b120b65a",
    pet: { id: "70c0e8ec-c6c8-413f-bc81-405f679e3480", name: "Gabru", species: "Dog", breed: "Bulldog", age: "2", gender: "Male", weight: "20" },
    currentStep: 6,
    reviewData: {
        "Pet Profile": {
            "Name": "Gabru",
            "Type": "Dog",
            "Breed": "Bulldog",
            "Age": "2",
            "Gender": "Male",
            "Weight": "20"
        },
        "Current Concern": "Some concern",
        "Health Background": "None",
        "Current Health Status": "Good",
        "Photos & Videos": []
    },
    concerns: "Some concern",
    healthBackground: "None",
    currentHealthStatus: "Good",
    mediaFiles: []
};

fetch("http://localhost:3000/api/save-smart-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
}).then(res => res.text()).then(console.log).catch(console.error);
