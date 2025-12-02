
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, CostBreakdown } from "../types";

// Helper to get fresh instance
const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Pricing Assumptions (USD)
const PRICE_PER_1M_INPUT_TOKENS = 3.50;
const PRICE_PER_1M_OUTPUT_TOKENS = 10.50;
const PRICE_PER_IMAGE_GENERATION = 0.04;

export interface AnalysisResponseWithUsage {
  result: AnalysisResult;
  cost: number;
  tokens: { promptTokens: number; responseTokens: number };
}

/**
 * Step 1: Use Gemini 3 Pro (Preview) to think and analyze the image.
 */
export const analyzeFoodImage = async (base64Image: string, options?: { includeText: boolean }): Promise<AnalysisResponseWithUsage> => {
  const ai = getAIInstance();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  const includeText = options?.includeText || false;

  const prompt = `
    你是一位世界级的专业美食摄影师、修图师，同时也是一位极具感性的"生活美食家"和文艺作家。
    请分析这张美食照片。

    任务目标：
    1. 识别菜品名称。
    2. 批评当前照片（光线、角度、畸变、质感）。特别关注常见的俯视拍摄畸变问题。
    3. 制定一个策略，使这张照片看起来像是一本高端美食杂志拍摄的（更好的景深、诱人的质感、专业的光线）。
    4. 创建一个具体的英文提示词（prompt），用于图像生成模型根据改进方案“重新拍摄”这道菜。
    ${includeText ? `
    5. [重要] 创作一句简短的、文艺的中文文案（literaryText）。
       - 风格：文艺青年、热爱生活、治愈、精致。
       - 避免俗套的广告语。要写出对生活瞬间的感悟，让人看了觉得"这不仅是食物，更是美好的生活"。
       - 字数控制在 20 字以内。
    ` : ''}

    请严格按照 JSON 格式返回。
    dishName, critique, improvementStrategy 必须使用简体中文。
    generationPrompt 必须使用英文。
  `;

  const schemaProperties: any = {
    dishName: { type: Type.STRING, description: "菜品名称" },
    critique: { type: Type.STRING, description: "对当前光线、角度和构图的批评" },
    improvementStrategy: { type: Type.STRING, description: "修复畸变和提升美感的计划" },
    generationPrompt: { type: Type.STRING, description: "用于图像生成模型重新渲染场景的精确提示词（英文）" }
  };

  const requiredFields = ["dishName", "critique", "improvementStrategy", "generationPrompt"];

  if (includeText) {
      schemaProperties.literaryText = { type: Type.STRING, description: "一句文艺的、充满生活气息的中文短句" };
      requiredFields.push("literaryText");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: requiredFields
        }
      }
    });

    if (!response.text) throw new Error("未收到 Gemini 的分析结果。");

    // Calculate Usage & Cost
    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount || 0;
    const responseTokens = usage?.candidatesTokenCount || 0;
    
    const analysisCost = 
      (promptTokens / 1_000_000) * PRICE_PER_1M_INPUT_TOKENS +
      (responseTokens / 1_000_000) * PRICE_PER_1M_OUTPUT_TOKENS;
    
    return {
      result: JSON.parse(response.text) as AnalysisResult,
      cost: analysisCost,
      tokens: { promptTokens, responseTokens }
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Step 2: Use Nano Banana Pro (gemini-3-pro-image-preview) to generate the improved image.
 */
export const generateEnhancedFood = async (base64Image: string, analysis: AnalysisResult): Promise<{ image: string, cost: number }> => {
  const ai = getAIInstance();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const fullPrompt = `
    Using the provided image as a strong reference for the food's identity and ingredients:
    ${analysis.generationPrompt}
    Ensure the result is photorealistic, 4k, highly detailed, with perfect appetizing texture. 
    Fix any perspective distortion from overhead shots.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "2K",
          aspectRatio: "1:1"
        }
      }
    });

    let enhancedImageBase64 = "";
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          enhancedImageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!enhancedImageBase64) throw new Error("未生成图像。");

    return {
      image: `data:image/png;base64,${enhancedImageBase64}`,
      cost: PRICE_PER_IMAGE_GENERATION
    };

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('网络响应异常');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(error);
    throw new Error("无法加载图片 URL。请确保链接直接指向图片，且允许跨域访问 (CORS)。或者请尝试下载后上传。");
  }
};
