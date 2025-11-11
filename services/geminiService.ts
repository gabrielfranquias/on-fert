import { GoogleGenAI, Type } from "@google/genai";
import { SoilData, AnalysisResult, Product, PRODUCTS } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    productRecommendation: {
      type: Type.STRING,
      enum: [...PRODUCTS],
      description: 'The recommended fertilizer product.'
    },
    reasoning: {
      type: Type.STRING,
      description: 'A detailed explanation for the recommendation, based on the soil data and image analysis.'
    },
    confidence: {
      type: Type.NUMBER,
      description: 'A confidence score between 0 and 1 for the recommendation.'
    }
  },
  required: ['productRecommendation', 'reasoning', 'confidence']
};


export const analyzeSoilAndImage = async (soilData: SoilData, imageBase64: string): Promise<AnalysisResult> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64,
    },
  };

  const textPart = {
    text: `Você é uma IA especialista em agronomia para uma empresa de fertilizantes chamada "ON FERT". Sua tarefa é analisar os dados do solo fornecidos e uma foto da cultura/solo para recomendar o melhor produto fertilizante.

    Produtos Disponíveis:
    - Master P
    - Organomineral
    - Mineral

    Por favor, analise as seguintes informações:
    - Dados do Solo: ${JSON.stringify(soilData, null, 2)}
    - Imagem Anexada: Uma foto da condição da cultura e/ou do solo. Procure por pistas visuais como descoloração das folhas (clorose, necrose), crescimento atrofiado ou textura do solo.

    Com base em uma análise abrangente dos dados e da imagem, forneça uma recomendação de produto personalizada. Sua resposta deve estar no formato JSON correspondente ao esquema fornecido.
    `,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, imagePart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    },
  });
  
  const rawJson = response.text.trim();
  try {
    const result = JSON.parse(rawJson);
    if (!PRODUCTS.includes(result.productRecommendation)) {
        // Fallback or correction if model hallucinates a product
        result.productRecommendation = 'Mineral';
        result.reasoning = `(O modelo recomendou um produto inválido, retornando ao padrão) ${result.reasoning}`;
    }
    return result as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error, "Raw response:", rawJson);
    throw new Error("A IA retornou uma resposta inválida. Por favor, tente novamente.");
  }
};