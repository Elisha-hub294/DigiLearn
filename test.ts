import { GoogleGenAI } from "@google/genai";

const apiKey = "AQ.Ab8RN6IULOJDTqpZqiiBSAJXTefqQOUsoY3FVSDjf8MCjUosWg"; // <<< replace with the fresh key
const ai = new GoogleGenAI({ apiKey });

(async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello, Gemini!",
    });
    console.log("✅ Gemini replied:", response.text);
  } catch (e) {
    console.error("❌ Error calling Gemini:", e);
  }
})();
