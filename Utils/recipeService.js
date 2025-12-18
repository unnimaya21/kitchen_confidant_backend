// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Use stable model for structured output
// // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash",
//   generationConfig: {
//     responseMimeType: "application/json",
//     responseSchema: {
//       type: "object",
//       properties: {
//         title: { type: "string" },
//         ingredients: { type: "array", items: { type: "string" } },
//         instructions: { type: "array", items: { type: "string" } },
//         cook_time: { type: "string" },
//       },
//       required: ["title", "ingredients", "instructions", "cook_time"],
//     },
//   },
// });
// exports.generateRecipeFromPantry = async (pantryItems) => {
//   const prompt = `
// Return ONLY valid JSON. No text. No explanation.

// Ingredients:
// ${pantryItems.join(", ")}

// JSON format:
// {
//   "title": "Recipe Name",
//   "ingredients": ["item 1", "item 2"],
//   "instructions": ["Step 1", "Step 2"],
//   "cook_time": "20 mins"
// }
// `;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text();

//   // 🛡️ Extract JSON object safely
//   const match = text.match(/\{[\s\S]*\}/);
//   if (!match) {
//     console.error("Gemini raw response:", text);
//     throw new Error("Invalid recipe JSON");
//   }

//   return JSON.parse(match[0]);
// };
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Define the exact shape you want
const schema = {
  description: "Recipe object",
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    instructions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    cook_time: { type: SchemaType.STRING },
  },
  required: ["title", "ingredients", "instructions", "cook_time"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  // 2. Pass the schema to the model configuration
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

exports.generateRecipeFromPantry = async (pantryItems) => {
  try {
    const prompt = `Generate a recipe using: ${pantryItems.join(", ")}`;
    const result = await model.generateContent(prompt);

    // 3. No regex needed! The response is guaranteed to be JSON.
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    // Provide a structured fallback so the frontend doesn't get a 500
    return {
      title: "Error finding recipe",
      ingredients: [],
      instructions: ["Please try again with different ingredients."],
      cook_time: "N/A",
    };
  }
};
