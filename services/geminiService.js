
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateDescription(itemName, category) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Write a short, appetizing, and poetic one-sentence description for a ${category} item named "${itemName}" for a restaurant called Shivam Handi Biryani. Keep it under 20 words.` }]
          }
        ]
      });
      return response.response.candidates[0].content.parts[0].text?.trim() || "Delicious freshly prepared dish.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Authentic taste crafted with love and fresh ingredients.";
    }
  }

  async getSmartRecommendations(currentItems) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Based on a customer ordering ${currentItems.join(', ')}, suggest 3 perfect beverage or dessert pairings. Return only the names separated by commas.` }]
          }
        ]
      });
      const text = response.response.candidates[0].content.parts[0].text || "";
      return text.split(',').map(s => s.trim()).filter(Boolean);
    } catch {
      return ["Masala Chiya", "Kheer", "Iced Tea"];
    }
  }
}

export const gemini = new GeminiService();
