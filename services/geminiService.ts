
import { GoogleGenAI, Type } from "@google/genai";
import { AITip, ToneSettings } from "../types";

// Inizializzazione sicura: non crasha se la chiave manca o process non è pronto
const getAI = () => {
  const apiKey = process.env.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export async function getToneAdvice(settings: ToneSettings): Promise<AITip> {
  const fallback = {
    title: "Keep Rocking!",
    content: "Il tuo setup sembra solido. Prova a sperimentare con il gain per ottenere più sustain."
  };

  if (!process.env.API_KEY) return fallback;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user has an electric guitar app with the following settings:
        Gain: ${settings.gain * 100}%
        Distortion: ${settings.distortion * 100}%
        Tone: ${settings.tone * 100}%
        Reverb: ${settings.reverb * 100}%
        
        Give a short (max 150 chars) pro-guitarist tip about this specific tone in Italian. Be creative and cool.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return fallback;
  }
}
