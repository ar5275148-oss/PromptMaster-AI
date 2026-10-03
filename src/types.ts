export type TabType = 'architect' | 'polisher' | 'rtcf';

export interface RTCFResult {
  title: string;
  category: string;
  roleBn: string;
  roleEn: string;
  taskBn: string;
  taskEn: string;
  contextBn: string;
  contextEn: string;
  formatBn: string;
  formatEn: string;
  completePromptBn: string;
  completePromptEn: string;
  proTips: string[];
}

export type PolisherStyleId = 
  | 'literary'       // সাহিত্যিক ও রসালো
  | 'eloquent'       // মার্জিত ও প্রভাবশালী
  | 'heartfelt'      // আন্তরিক ও হৃদয়স্পর্শী
  | 'punchy'         // সংক্ষিপ্ত ও ধারালো
  | 'inspirational'  // অনুপ্রেরণামূলক ও উদ্দীপক
  | 'lucid';         // সহজ-সরল ও প্রাঞ্জল

export interface PolishedVariation {
  styleName: string;
  tag: string;
  text: string;
}

export interface PolishedTextResult {
  polishedText: string;
  styleName: string;
  toneSummary: string;
  keyHighlights: string[];
  variations: PolishedVariation[];
}

export type SupportedModelId =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'perplexity'
  | 'grok'
  | 'copilot'
  | 'llama'
  | 'mistral'
  | 'qwen'
  | 'google-ai-studio'
  | 'apple-intelligence'
  | 'cohere'
  | 'kimi'
  | 'ernie'
  | 'nova'
  | 'huggingchat'
  | 'poe'
  | 'zhipu-glm'
  | 'midjourney';

export interface AIModelMeta {
  id: SupportedModelId;
  name: string;
  company: string;
  tagline: string;
  taglineBn: string;
  category: 'flagship' | 'reasoning' | 'search' | 'open' | 'enterprise' | 'image';
  bestFor: string;
  bestForBn: string;
  detailedOverviewBn?: string;
  detailedBestForBn?: string;
  secretFormula: string;
  secretFormulaBn: string;
  syntaxTip: string;
  color: string;
}

export interface PromptFlaw {
  title: string;
  description: string;
}

export interface PromptGuideline {
  rule: string;
  explanation: string;
}

export interface PromptVariation {
  name: string;
  tag: string;
  prompt: string;
}

export interface PromptScores {
  clarity: number;
  context: number;
  constraints: number;
  roleDefinition: number;
  overallRawScore: number;
}

export interface OptimizedPromptData {
  title: string;
  masterPromptEn: string;
  masterPromptBn: string;
  systemInstruction?: string;
  outputFormatSpec?: string;
  formatType?: string;
}

export interface PromptAnalysisResult {
  flaws: PromptFlaw[];
  missingContext: string[];
  guidelines: PromptGuideline[];
  modelSpecificTips: string[];
  optimizedPrompt: OptimizedPromptData;
  variations: PromptVariation[];
  scores: PromptScores;
  thinkingSummary?: string;
  promptFormat?: string;
  promptFormatEn?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export interface SavedPromptItem {
  id: string;
  title: string;
  rawInput: string;
  masterPromptEn: string;
  masterPromptBn: string;
  targetModel: SupportedModelId;
  category: string;
  createdAt: number;
  tags?: string[];
}

export interface PresetTemplate {
  id: string;
  titleBn: string;
  titleEn: string;
  category: string;
  exampleRawBn: string;
  exampleRawEn: string;
  suggestedModel: SupportedModelId;
}
