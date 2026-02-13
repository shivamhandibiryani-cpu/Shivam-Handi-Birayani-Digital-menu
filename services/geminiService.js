
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  getClient() {
    // Use VITE_API_KEY for Vite frontend environment
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      console.warn("VITE_API_KEY is not set. Please add VITE_API_KEY to your .env file.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
  }

  async generateDescription(itemName, category) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Write a short, appetizing, and poetic one-sentence description (15-20 words) for a ${category} item named "${itemName}" from Shivam Handi Biryani in Janakpur, Nepal. Highlight authentic Nepali spices, fresh ingredients, and local flavors. Make it mouth-watering and evocative.` }]
          }
        ]
      });
      return response.response.candidates[0].content.parts[0].text?.trim() || "Delicious freshly prepared dish with authentic Nepali spices.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Authentic taste crafted with love and fresh ingredients.";
    }
  }

  async getSmartRecommendations(currentItems) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: `Based on a customer ordering ${currentItems.join(', ')} from Shivam Handi Biryani restaurant in Janakpur, Nepal, suggest 3 perfect beverage or dessert pairings that complement the flavors. Consider Nepali drinks like Masala Chiya, Lassi, and traditional desserts. Return only the item names separated by commas, no explanation.` }]
          }
        ]
      });
      const text = response.response.candidates[0].content.parts[0].text || "";
      return text.split(',').map(s => s.trim()).filter(Boolean);
    } catch (error) {
      console.error("Gemini Recommendations Error:", error);
      return ["Masala Chiya", "Kheer", "Sweet Lassi"];
    }
  }

  // New function for customer-facing AI assistant
  async getMenuRecommendation(preferences, budget, occasion) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: `As a helpful menu assistant for Shivam Handi Biryani in Janakpur, Nepal, recommend the best dish(es) for someone who likes ${preferences}. Budget is around ${budget}. Occasion: ${occasion}. Give a brief, friendly recommendation (1-2 sentences) with the dish name.` }]
          }
        ]
      });
      return response.response.candidates[0].content.parts[0].text?.trim() || "Our Chicken Biryani is a great choice!";
    } catch (error) {
      console.error("Gemini Menu Recommendation Error:", error);
      return "Our chef recommends trying our signature Chicken Handi Biryani!";
    }
  }
}

export const gemini = new GeminiService();
