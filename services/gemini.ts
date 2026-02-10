
import { GoogleGenAI, Type } from "@google/genai";

// Standard initialization as per Google GenAI SDK guidelines
// Lazy initialization to prevent app crash if API key is missing on load
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: apiKey });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("Google API Key is missing (process.env.API_KEY). AI features will be disabled.");
}

export async function generatePersonalizedEmail(
  schoolName: string, 
  principalName: string, 
  emailType: 'problem' | 'solution' | 'social' | 'nudge'
) {
  if (!ai) {
     console.error("AI client not ready. Missing GEMINI_API_KEY.");
     return "AI services unavailable. Please configure your API key.";
  }

  const prompt = `Generate a professional, high-converting sales email for a company called "Educater". 
  The app helps schools go digital, reducing printing costs and improving parent engagement.
  
  Target School: ${schoolName}
  Principal: ${principalName}
  Email Type: ${emailType}
  
  Requirements:
  - Mention specific pain points like "R1200 paper costs".
  - Be concise and friendly.
  - Include a clear CTA.
  - Professional South African educational tone.`;

  try {
    // Using ai.models.generateContent with model name and prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class educational sales copywriter for Educater. Focus on the benefits of digital transformation for schools.",
      },
    });

    // Accessing .text property directly as per guidelines (not a method call)
    return response.text;
  } catch (error) {
    console.error("Gemini Email Generation Error:", error);
    return "Failed to generate email content. Please try again.";
  }
}

export async function getSalesAdvice(schoolStatus: string) {
  if (!ai) return "AI advice unavailable (Check Config).";

  const prompt = `A school is currently at this stage: "${schoolStatus}". 
  Provide 3 tactical tips for the sales rep to move them to the next stage in the Educater acquisition funnel.`;

  try {
    // Using ai.models.generateContent with model name and prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a senior sales coach for school apps. Give short, punchy, actionable advice.",
      },
    });

    // Accessing .text property directly as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini Sales Advice Error:", error);
    return "Keep following up consistently.";
  }
}
