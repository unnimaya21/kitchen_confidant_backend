const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use stable model for structured output
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        ingredients: { type: "array", items: { type: "string" } },
        instructions: { type: "array", items: { type: "string" } },
        cook_time: { type: "string" },
      },
      required: ["title", "ingredients", "instructions", "cook_time"],
    },
  },
});
exports.generateRecipeFromPantry = async (pantryItems) => {
  const prompt = `
Return ONLY valid JSON. No text. No explanation.

Ingredients:
${pantryItems.join(", ")}

JSON format:
{
  "title": "Recipe Name",
  "ingredients": ["item 1", "item 2"],
  "instructions": ["Step 1", "Step 2"],
  "cook_time": "20 mins"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // 🛡️ Extract JSON object safely
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("Gemini raw response:", text);
    throw new Error("Invalid recipe JSON");
  }

  return JSON.parse(match[0]);
};
