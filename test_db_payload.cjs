const reviewData = {
    "Pet Profile": {
        "Name": "Gabru",
        "Type": "Dog",
        "Breed": "Bulldog",
        "Age": "2",
        "Gender": "Male",
        "Weight": "20"
    },
    "Current Concern": [{question: "Q1", answer: "A1"}],
    "Health Background": [],
    "Current Health Status": [],
    "Photos & Videos": ["blob:http://localhost:3000/12345"]
};

fetch("http://localhost:3000/api/save-smart-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        userId: "cb5e830c-5d95-4a38-a9e2-c919b120b65a",
        pet: { id: "70c0e8ec-c6c8-413f-bc81-405f679e3480", name: "Gabru" },
        currentStep: 6,
        reviewData: reviewData,
        concerns: [],
        healthBackground: [],
        currentHealthStatus: [],
        mediaFiles: []
    })
}).then(res => res.json()).then(console.log).catch(console.error);
