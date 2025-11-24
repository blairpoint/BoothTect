import { GoogleGenAI, Type } from "@google/genai";
import { DEVICES } from '../data/equipment';

// Initialize the API client.
// Note: process.env.API_KEY is assumed to be available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are an expert DJ Equipment Technician and Stage Manager.
Your goal is to suggest equipment setups based on user requests.
You have access to the following inventory (ID - Model):
${DEVICES.map(d => `- ${d.id}: ${d.model} (${d.type})`).join('\n')}

When a user asks for a setup, you must return a JSON object containing a list of device IDs from the inventory that best matches their request.
If the user asks for something vague like "Techno setup", assume a standard club standard: 2-3 players and a mixer.
If the user asks for "Vinyl", use the SL-1210MK7.
If the user asks for "Portable" or "All in one", use the XDJ-AZ.
`;

export const getSuggestedSetup = async (prompt: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            setupName: { type: Type.STRING },
            devices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of device IDs to add to the booth"
            },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    return data.devices || [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getTechAdvice = async (question: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: question,
            config: {
                systemInstruction: "You are a helpful DJ tech support assistant. Provide brief, technical, and accurate answers about audio routing, cabling, and DJ gear features.",
            }
        });
        return response.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini Advice Error:", error);
        return "Error connecting to AI assistant.";
    }
}
