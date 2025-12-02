
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  dishName: string;
  critique: string;
  improvementStrategy: string;
  generationPrompt: string;
  literaryText?: string; // Optional field for the poetic text
}

export interface CostBreakdown {
  analysisCost: number; // In USD
  generationCost: number; // In USD
  totalCost: number; // In USD
  tokenUsage?: {
    promptTokens: number;
    responseTokens: number;
  };
}

export interface GenerationResult {
  originalImage: string; // Base64
  enhancedImage: string; // Base64
  analysis: AnalysisResult;
  cost: CostBreakdown;
}

export interface HistoryItem extends GenerationResult {
  id: string;
  timestamp: number;
}
