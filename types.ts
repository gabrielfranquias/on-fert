
export enum AppView {
  ANALYSIS_FORM,
  ANALYSIS_RESULT,
  LIVE_ASSISTANT,
  COMPANY_REPORT,
}

export const PRODUCTS = ['Master P', 'Organomineral', 'Mineral'] as const;
export type Product = typeof PRODUCTS[number];

export interface SoilData {
  crop: string;
  soilType: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  history: string;
  climate: string;
}

export interface AnalysisResult {
  productRecommendation: Product;
  reasoning: string;
  confidence: number;
}

export interface SavedAnalysis {
  id: string;
  timestamp: string;
  soilData: SoilData;
  imagePreview: string;
  result: AnalysisResult;
}

export interface TranscriptionEntry {
  id: string;
  type: 'user' | 'model' | 'system';
  text: string;
}
