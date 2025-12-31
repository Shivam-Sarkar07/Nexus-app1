import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiRecommendations = async (userQuery: string, availableApps: AppData[]): Promise<string[]> => {
  try {
    const appListString = availableApps.map(app => 
      `ID: ${app.id}, Name: ${app.name}, Description: ${app.description}, Category: ${app.category}`
    ).join('\n');

    const prompt = `
      You are an intelligent app recommendation engine for "AppVault".
      User Request: "${userQuery}"
      
      Available Apps Database:
      ${appListString}

      Task: Select the top 3 apps that best match the user's request.
      Return ONLY the IDs of the matching apps in a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedAppIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json.recommendedAppIds || [];

  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return [];
  }
};