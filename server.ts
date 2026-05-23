import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up JSON parsing with a limit for larger requests
  app.use(express.json({ limit: "10mb" }));

  // API Routes MUST go before Vite middlewares
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // End Point: Pet Care Plan Generator
  app.post("/api/care-plan", async (req, res) => {
    try {
      const { petData, formData, flowType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({ apiKey });

      const { breed, category, ageMonths, gender } = petData;
      const isDeep = flowType === "deep";
      let lifestyleBlock = "";

      if (isDeep) {
        const { homeType, cityType, hasKids, otherPets, freeTime, workSchedule, travelFrequency, firstTimePetParent, budgetMin, emergencyFund } = formData;
        const budgetINR = budgetMin ? `₹${(budgetMin * 80).toLocaleString("en-IN")}` : "not specified";
        lifestyleBlock = `
- Home type: ${homeType || "unknown"}
- City type: ${cityType || "unknown"}
- Has children: ${hasKids ? "Yes" : "No"}
- Other pets at home: ${otherPets ? "Yes" : "No"}
- Daily free time: ${freeTime || "unknown"}
- Work schedule: ${workSchedule || "unknown"}
- Travel frequency: ${travelFrequency || "unknown"}
- First time pet parent: ${firstTimePetParent ? "Yes" : "No"}
- Monthly budget: ${budgetINR}
- Emergency fund ready: ${emergencyFund ? "Yes" : "No"}`;
      } else {
        const { living, hasChildren, freeTime, budgetMin, budgetMax } = formData;
        lifestyleBlock = `
- Living situation: ${living || "unknown"}
- Has children under 18: ${hasChildren ? "Yes" : "No"}
- Daily free time: ${freeTime || "unknown"}
- Monthly budget range: ₹${budgetMin || 0} - ₹${budgetMax || 0}`;
      }

      const prompt = `You are a professional pet care advisor. Generate a PERSONALIZED care compatibility report.

PET DETAILS:
- Breed: ${breed}
- Category: ${category}
- Age: ${ageMonths} months
- Gender: ${gender || "unknown"}

USER'S LIFESTYLE:${lifestyleBlock}

Based on real, factual breed-specific data and the user's lifestyle inputs, generate a care compatibility report. Be honest — if the pet is NOT a good match for the user's lifestyle, say so clearly. Consider space needs, exercise requirements, child-friendliness, time commitment, and realistic monthly costs for Indian market.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              compatibilityScore: { type: Type.NUMBER },
              tagline: { type: Type.STRING },
              feeding: { type: Type.STRING },
              exercise: { type: Type.STRING },
              grooming: { type: Type.STRING },
              monthlyCost: { type: Type.STRING },
              verdict: { type: Type.STRING },
              ...(isDeep ? {
                monthlyCostNote: { type: Type.STRING },
                healthConsiderations: { type: Type.STRING },
                beginnerTips: { type: Type.STRING },
              } : {})
            },
            required: ["compatibilityScore", "tagline", "feeding", "exercise", "grooming", "monthlyCost", "verdict"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating care plan on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Pet AI Insights
  app.post("/api/pet-ai-insights", async (req, res) => {
    try {
      const { breed, category, ageMonths, gender } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Generate pet care insights for a ${ageMonths} month old ${gender || "unknown"} ${breed} (${category}). 
Provide data for two categories: Quick Facts and Deep Dive.
Quick Facts should cover nutrition, activity, and lifespan.
Deep Dive should cover health, training, and grooming.
Keep descriptions concise (max 2 sentences).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quick: {
                type: Type.OBJECT,
                properties: {
                  nutrition: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  activity: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  lifespan: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["nutrition", "activity", "lifespan"]
              },
              deep: {
                type: Type.OBJECT,
                properties: {
                  health: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  training: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  grooming: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["health", "training", "grooming"]
              }
            },
            required: ["quick", "deep"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating pet insights on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Product Insights
  app.post("/api/product-insights", async (req, res) => {
    try {
      const { name, brand, pet_type, category, ingredients, highlights } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Provide nutrition and wellness insights for a pet product:
Name: ${name}
Brand: ${brand}
Type: ${pet_type}
Category: ${category}
Ingredients: ${ingredients?.join(", ") || "N/A"}
Highlights: ${highlights?.join(", ") || "N/A"}

Keep descriptions concise (max 2 sentences).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quick: {
                type: Type.OBJECT,
                properties: {
                  nutrition: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  activity: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  lifespan: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["nutrition", "activity", "lifespan"]
              },
              deep: {
                type: Type.OBJECT,
                properties: {
                  health: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  training: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  grooming: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["health", "training", "grooming"]
              }
            },
            required: ["quick", "deep"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating product insights on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets middleware configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sruvo Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
