import { GoogleGenAI, Chat } from "@google/genai";

const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;

try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("API_KEY is missing. Gemini features will not work.");
  }
} catch (error) {
  console.error("Error initializing GoogleGenAI:", error);
}

// Function to get a chat instance
export const getChatInstance = (modelName: string = 'gemini-2.5-flash'): Chat | null => {
  if (!ai) return null;
  
  try {
    return ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: "Você é um assistente virtual inteligente e conciso integrado a um workspace minimalista. Responda em Português do Brasil de forma profissional, direta e útil. Evite formatação excessiva.",
      },
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
};
