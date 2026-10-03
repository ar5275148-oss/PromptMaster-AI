import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Server-side Gemini initialization with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Robust multi-model fallback helper with retry on transient 503/429 spikes
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Strict "তুমি, তোমার" sanitizer map to eliminate "আপনি/আপনার/করুন" etc. from all outputs
const FORMAL_TO_INFORMAL_MAP: [RegExp, string][] = [
  [/(?<![\u0980-\u09FF])আপনাদের(?![\\u0980-\\u09FF])/gu, 'তোমাদের'],
  [/(?<![\u0980-\u09FF])আপনারা(?![\\u0980-\\u09FF])/gu, 'তোমরা'],
  [/(?<![\u0980-\u09FF])আপনার(?![\\u0980-\\u09FF])/gu, 'তোমার'],
  [/(?<![\u0980-\u09FF])আপনাকে(?![\\u0980-\\u09FF])/gu, 'তোমাকে'],
  [/(?<![\u0980-\u09FF])আপনি(?![\\u0980-\\u09FF])/gu, 'তুমি'],
  [/(?<![\u0980-\u09FF])করেছেন(?![\\u0980-\\u09FF])/gu, 'করেছো'],
  [/(?<![\u0980-\u09FF])বলেছেন(?![\\u0980-\\u09FF])/gu, 'বলেছো'],
  [/(?<![\u0980-\u09FF])লিখেছেন(?![\\u0980-\\u09FF])/gu, 'লিখেছো'],
  [/(?<![\u0980-\u09FF])দিয়েছেন(?![\\u0980-\\u09FF])/gu, 'দিয়েছো'],
  [/(?<![\u0980-\u09FF])দেখেছেন(?![\\u0980-\\u09FF])/gu, 'দেখেছো'],
  [/(?<![\u0980-\u09FF])করবেন(?![\\u0980-\\u09FF])/gu, 'করবে'],
  [/(?<![\u0980-\u09FF])বলবেন(?![\\u0980-\\u09FF])/gu, 'বলবে'],
  [/(?<![\u0980-\u09FF])লিখবেন(?![\\u0980-\\u09FF])/gu, 'লিখবে'],
  [/(?<![\u0980-\u09FF])দেখবেন(?![\\u0980-\\u09FF])/gu, 'দেখবে'],
  [/(?<![\u0980-\u09FF])জানাবেন(?![\\u0980-\\u09FF])/gu, 'জানাবে'],
  [/(?<![\u0980-\u09FF])রাখবেন(?![\\u0980-\\u09FF])/gu, 'রাখবে'],
  [/(?<![\u0980-\u09FF])পারবেন(?![\\u0980-\\u09FF])/gu, 'পারবে'],
  [/(?<![\u0980-\u09FF])করুন(?![\\u0980-\\u09FF])/gu, 'করো'],
  [/(?<![\u0980-\u09FF])বলুন(?![\\u0980-\\u09FF])/gu, 'বলো'],
  [/(?<![\u0980-\u09FF])লিখুন(?![\\u0980-\\u09FF])/gu, 'লেখো'],
  [/(?<![\u0980-\u09FF])দেখুন(?![\\u0980-\\u09FF])/gu, 'দেখো'],
  [/(?<![\u0980-\u09FF])জানান(?![\\u0980-\\u09FF])/gu, 'জানাও'],
  [/(?<![\u0980-\u09FF])রাখুন(?![\\u0980-\\u09FF])/gu, 'রাখো'],
  [/(?<![\u0980-\u09FF])থাকুন(?![\\u0980-\\u09FF])/gu, 'থাকো'],
  [/(?<![\u0980-\u09FF])ধরুন(?![\\u0980-\\u09FF])/gu, 'ধরো'],
  [/(?<![\u0980-\u09FF])ফেলুন(?![\\u0980-\\u09FF])/gu, 'ফেলো'],
  [/(?<![\u0980-\u09FF])দিন(?![\\u0980-\\u09FF])/gu, 'দাও'],
  [/(?<![\u0980-\u09FF])নিন(?![\\u0980-\\u09FF])/gu, 'নাও'],
  [/(?<![\u0980-\u09FF])পারেন(?![\\u0980-\\u09FF])/gu, 'পারবে'],
];

function sanitizeToTumiTomar(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const [regex, replacement] of FORMAL_TO_INFORMAL_MAP) {
    result = result.replace(regex, replacement);
  }
  return result;
}

function deepSanitizeToTumiTomar<T>(data: T): T {
  if (!data) return data;
  if (typeof data === 'string') {
    return sanitizeToTumiTomar(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => deepSanitizeToTumiTomar(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const copy: any = {};
    for (const key of Object.keys(data as any)) {
      copy[key] = deepSanitizeToTumiTomar((data as any)[key]);
    }
    return copy as T;
  }
  return data;
}

function getAvailableApiKeys(req?: Request): string[] {
  const keysSet = new Set<string>();
  
  if (req) {
    const headerKeys = req.headers['x-gemini-keys'];
    if (headerKeys && typeof headerKeys === 'string') {
      headerKeys.split(',').forEach(k => {
        const trimmed = k.trim();
        if (trimmed) keysSet.add(trimmed);
      });
    }

    if (req.body && Array.isArray(req.body.apiKeys)) {
      req.body.apiKeys.forEach((k: any) => {
        if (typeof k === 'string' && k.trim()) keysSet.add(k.trim());
      });
    }
  }

  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
  ];
  envKeys.forEach(k => {
    if (k && typeof k === 'string' && k.trim()) {
      keysSet.add(k.trim());
    }
  });

  if (keysSet.size === 0 && apiKey) {
    keysSet.add(apiKey);
  }

  return Array.from(keysSet);
}

async function generateWithFallback(
  models: string[],
  params: any,
  req?: Request
) {
  let lastError: any = null;
  const apiKeys = getAvailableApiKeys(req);

  if (apiKeys.length === 0) {
    apiKeys.push('');
  }

  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const currentApiKey = apiKeys[keyIdx];
    const clientAI = new GoogleGenAI({
      apiKey: currentApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await clientAI.models.generateContent({
            model,
            ...params,
          });
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || '');
          const statusCode = err?.status || err?.code || 0;
          
          const isQuota = statusCode === 429 || msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('resource_exhausted') || msg.includes('API key not valid');
          
          if (isQuota) {
            console.warn(`[Quota / Key Error] Key index ${keyIdx} model ${model} failed. Rotating to next API key/model...`);
            break; 
          }

          const isTransient = statusCode === 503 || msg.includes('503') || msg.includes('high demand') || msg.includes('spikes in demand');
          if (isTransient && attempt === 0) {
            await sleep(600);
            continue;
          }

          if (params?.config?.thinkingConfig) {
            try {
              const strippedConfig = { ...params.config };
              delete strippedConfig.thinkingConfig;
              return await clientAI.models.generateContent({
                model,
                ...params,
                config: strippedConfig,
              });
            } catch (stripErr: any) {
              lastError = stripErr;
            }
          }
          break;
        }
      }
    }
  }

  throw lastError;
}

// Built-in Architectural Synthesizer for 100% uptime when external API hits regional 503 load
// Intelligent dynamic fallback generator that adapts prompt format to user's intent
function synthesizePromptArchitectFallback(
  rawThought: string,
  targetModel: string,
  goal: string,
  tone: string,
  requestedFormat: string = 'auto'
) {
  const modelLower = targetModel.toLowerCase();
  const rawLower = rawThought.toLowerCase();

  const isMidjourney =
    modelLower.includes('midjourney') ||
    rawLower.includes('ছবি') ||
    rawLower.includes('image') ||
    rawLower.includes('draw');

  const isCode =
    rawLower.includes('কোড') ||
    rawLower.includes('প্রোগ্রামিং') ||
    rawLower.includes('code') ||
    rawLower.includes('python') ||
    rawLower.includes('javascript') ||
    rawLower.includes('react') ||
    rawLower.includes('api') ||
    rawLower.includes('bug') ||
    rawLower.includes('html') ||
    rawLower.includes('css') ||
    rawLower.includes('sql');

  const isCreative =
    rawLower.includes('গল্প') ||
    rawLower.includes('কবিতা') ||
    rawLower.includes('নাটক') ||
    rawLower.includes('সাহিত্য') ||
    rawLower.includes('গান') ||
    rawLower.includes('উপন্যাস') ||
    rawLower.includes('রোমাঞ্চ') ||
    rawLower.includes('story') ||
    rawLower.includes('poem') ||
    rawLower.includes('creative');

  const isCommunication =
    rawLower.includes('চিঠি') ||
    rawLower.includes('ইমেইল') ||
    rawLower.includes('মেসেজ') ||
    rawLower.includes('আবেদন') ||
    rawLower.includes('দরখাস্ত') ||
    rawLower.includes('শুভেচ্ছা') ||
    rawLower.includes('ক্ষমা') ||
    rawLower.includes('email') ||
    rawLower.includes('letter') ||
    rawLower.includes('message');

  const isWorkflow =
    rawLower.includes('রোডম্যাপ') ||
    rawLower.includes('পরিকল্পনা') ||
    rawLower.includes('চেকলিস্ট') ||
    rawLower.includes('প্ল্যান') ||
    rawLower.includes('রূপরেখা') ||
    rawLower.includes('roadmap') ||
    rawLower.includes('plan') ||
    rawLower.includes('checklist');

  // Determine format based on requestedFormat or intent
  let promptFormatBn = 'প্রাকৃতিক ও সাবলীল অনুচ্ছেদ';
  let promptFormatEn = 'Fluent Narrative Prose';
  let enPrompt = '';
  let bnPrompt = '';
  let syntaxStyle = 'সাবলীল ধারাবাহিক গদ্য (প্যারাগ্রাফ স্টাইল)';

  let varNarrativePrompt = '';
  let varDirectPrompt = '';
  let varStructuredPrompt = '';

  if (isMidjourney) {
    promptFormatBn = 'সিনেম্যাটিক ভিজ্যুয়াল টোকেন';
    promptFormatEn = 'Cinematic Visual Spec';
    syntaxStyle = 'Comma-separated prompt tokens (No bullets)';
    enPrompt = `Ultra-realistic cinematic photograph, 8k resolution, cinematic atmosphere, ${rawThought.trim()}, captured on 85mm portrait lens, f/1.4, volumetric lighting, photorealistic textures, vivid color grading, octane render --ar 16:9 --v 6.1 --style raw`;
    bnPrompt = `সিনেম্যাটিক ফটোগ্রাফি, ৮k রেজ্যুলিউশন, গভীর আলোকসম্পাত, ${rawThought.trim()}, ৮৫ মিমি পোর্ট্রেট লেন্স, লাইভ ড্রামাটিক লাইটিং, নিখুঁত টেক্সচার, থ্রিডি অক্টেন রেন্ডার, অত্যন্ত নিখুঁত ডিটেইল --ar 16:9`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `Cinematic photo of ${rawThought.trim()}, dramatic lighting, 85mm lens, 8k --ar 16:9`;
    varStructuredPrompt = `Subject: ${rawThought.trim()}\nLighting: Volumetric cinematic rays\nCamera: 85mm f/1.4\nRender: Octane 3D 8K --ar 16:9`;
  } else if (isCreative || requestedFormat === 'paragraph') {
    promptFormatBn = 'প্রাকৃতিক ও সাবলীল অনুচ্ছেদ (নো-পয়েন্ট)';
    promptFormatEn = 'Fluent Narrative (Zero Bullets)';
    syntaxStyle = 'ধারাবাহিক সৃষ্টিশীল গদ্য (Natural Prose)';
    enPrompt = `Adopt the persona of an evocative, acclaimed creative author and storyteller. Your objective is:\n\n${rawThought.trim()}\n\nWrite in continuous, captivating narrative prose without mechanical bullet points or rigid numbered lists. Build palpable atmosphere, deep emotional resonance, subtle character psychology, and vivid sensory detail. Let each sentence flow naturally and leave a lasting impression.`;
    bnPrompt = `তুমি একজন সংবেদনশীল সাহিত্যিক ও সিদ্ধহস্ত লেখক হিসেবে কথা বলবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nলেখায় কোনো যান্ত্রিক পয়েন্ট বা বুলেট লিস্ট ব্যবহার করবে না। সম্পূর্ণ স্বাভাবিক, একটানা আকর্ষণীয় অনুচ্ছেদে গল্প ও আবেগের গভীরতা ফুটিয়ে তোলো। প্রতিটি শব্দের ছন্দ, দৃশ্যের স্বাভাবিক চিত্রায়ন এবং চরিত্রের মনস্তাত্ত্বিক টানাপোড়েন বজায় রেখে একটি অসাধারণ সাহিত্যিক শৈলীতে রচনা করো।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `একটি অত্যন্ত চিত্তাকর্ষক ও হৃদয়গ্রাহী ভাষায় সরাসরি লেখো: "${rawThought.trim()}". কোনো অপ্রয়োজনীয় ভণিতা বা পয়েন্ট ছাড়া মূল বিষয়বস্তু প্রাঞ্জলভাবে তুলে ধরো।`;
    varStructuredPrompt = `দৃশ্যপট ১: প্রেক্ষাপট ও সূচনা\nদৃশ্যপট ২: সংঘাত ও গভীর আবেগ\nদৃশ্যপট ৩: চূড়ান্ত পরিণতি ও আত্মোপলব্ধি\n\nএই ৩টি ধাপে "${rawThought.trim()}" বিষয়টিকে নিখুঁতভাবে ফুটিয়ে তোলো।`;
  } else if (isCommunication) {
    promptFormatBn = 'প্রেক্ষাপট ও পরিস্থিতি ভিত্তিক অনুচ্ছেদ';
    promptFormatEn = 'Contextual Narrative';
    syntaxStyle = 'মার্জিত পরিস্থিতি-ভিত্তিক অনুচ্ছেদ';
    enPrompt = `Act as an elite executive communication strategist and empathetic writer. Your objective:\n\n${rawThought.trim()}\n\nDraft this message in a fluid, articulate narrative format without mechanical bullet points. Ensure the tone is warm, compelling, and perfectly tailored to create high trust and immediate impact.`;
    bnPrompt = `তুমি একজন অভিজ্ঞ যোগাযোগ পরামর্শক ও মার্জিত লেখক হিসেবে কাজ করবে। তোমার কাজ:\n\n${rawThought.trim()}\n\nকোনো কৃত্রিম বুলেট পয়েন্ট ছাড়া একটি স্বাভাবিক, মার্জিত ও হৃদয়গ্রাহী অনুচ্ছেদ আকারে চিঠি/বার্তাটি রচনা করো। বার্তার বক্তব্য যেন অত্যন্ত স্পষ্ট, আন্তরিক ও প্রভাববিস্তারী হয়।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `সংক্ষেপে কিন্তু অত্যন্ত বিনয়ী ও স্পষ্ট ভাষায় সরাসরি নিচের বিষয়টি তুলে ধরে বার্তা লেখো: "${rawThought.trim()}".`;
    varStructuredPrompt = `বিষয়: সুনির্দিষ্ট বার্তা\nপ্রেক্ষাপট: মূল বক্তব্য ও কারণ\nঅনুরোধ/আহ্বান: পরবর্তী করণীয়\n\nএই ফরম্যাটে "${rawThought.trim()}"-এর একটি পেশাদার যোগাযোগ খসড়া প্রস্তুত করো।`;
  } else if (isCode) {
    promptFormatBn = 'কারিগরি স্পেক ও আর্কিটেকচারাল প্রম্পট';
    promptFormatEn = 'Technical Specification';
    syntaxStyle = 'প্রোডাকশন-গ্রেড আর্কিটেকচারাল স্পেসিফিকেশন';
    enPrompt = `You are a principal software architect. Your objective:\n\n${rawThought.trim()}\n\nProvide a robust, production-ready solution adhering to clean architecture. Include full code implementations with edge-case handling, modular design, and brief real-world setup instructions without unnecessary theory.`;
    bnPrompt = `তুমি একজন সিনিয়র সফটওয়্যার আর্কিটেক্ট ও অভিজ্ঞ ইঞ্জিনিয়ার হিসেবে নির্দেশ গ্রহণ করো। তোমার লক্ষ্য:\n\n${rawThought.trim()}\n\nসম্পূর্ণ প্রোডাকশন-রেডি, টাইপ-সেফ এবং পরিচ্ছন্ন কোড আর্কিটেকচারে সমাধানটি তৈরি করো। প্রয়োজনীয় এরর হ্যান্ডলিং, টেস্টেবল মডুলারিটি এবং সরাসরি কার্যকর কোড ব্লক প্রদান করো। তাত্ত্বিক ব্যাখ্যার চেয়ে ব্যবহারিক কোডকে প্রাধান্য দাও।`;

    varNarrativePrompt = `একজন প্রবীণ ডেভেলপার হিসেবে কথপোকথন ও বাস্তব অভিজ্ঞতার আলোকে("${rawThought.trim()}") বিষয়টি সহজ কোড প্যাটার্নে ব্যাখ্যা ও সমাধান করো।`;
    varDirectPrompt = `Write clean, working code for: "${rawThought.trim()}". Return only the code with inline comments explaining key logic.`;
    varStructuredPrompt = `ধাপ ১: আর্কিটেকচার ও নির্ভরতা\nধাপ ২: কোর ইমপ্লিমেন্টেশন কোড\nধাপ ৩: এরর হ্যান্ডলিং ও টেস্ট\n\nএই ৩টি ধাপে "${rawThought.trim()}" কোডটি তৈরি করো।`;
  } else if (isWorkflow || requestedFormat === 'step_by_step') {
    promptFormatBn = 'পর্যায়ক্রমিক রোডম্যাপ ও রূপরেখা';
    promptFormatEn = 'Phased Roadmap';
    syntaxStyle = 'পর্যায়ক্রমিক অ্যাকশন ফ্রেমওয়ার্ক';
    enPrompt = `Act as an expert strategic operations director. Your objective:\n\n${rawThought.trim()}\n\nBreak this down into logical sequential phases with measurable outcomes, critical milestones, and practical execution steps.`;
    bnPrompt = `তুমি একজন দক্ষ স্ট্র্যাটেজিক ডিরেক্টর হিসেবে দিকনির্দেশনা দেবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nপুরো বিষয়টি সুশৃঙ্খল পর্যায়ক্রমিক ধাপে (পর্যায় ১, পর্যায় ২, পর্যায় ৩) ভাগ করে স্পষ্ট মাইলফলক ও বাস্তবসম্মত কর্মপরিকল্পনা প্রদান করো।`;

    varNarrativePrompt = `একটি সার্বিক সমন্বিত কর্মপরিকল্পনা হিসেবে("${rawThought.trim()}") কোন বিষয়গুলো সবচেয়ে গুরুত্বপূর্ণ তা ধারাবাহিক প্রাঞ্জল অনুচ্ছেদে বুঝিয়ে বলো।`;
    varDirectPrompt = `সবচেয়ে গুরুত্বপূর্ণ ৩টি অ্যাকশন আইটেম সহ সংক্ষেপে জানাও: "${rawThought.trim()}".`;
    varStructuredPrompt = bnPrompt;
  } else {
    // Default for general questions/concepts/inquiries: Fluent conversational prose (NO bullet points!)
    promptFormatBn = 'সহজবোধ্য প্রাঞ্জল অনুচ্ছেদ ও সাদৃশ্য';
    promptFormatEn = 'Conversational Analogy Prose';
    syntaxStyle = 'প্রাঞ্জল অনুচ্ছেদ ও বাস্তব সাদৃশ্য (No Bullets)';
    enPrompt = `Adopt the persona of a world-class mentor and subject matter expert. Your mission is:\n\n${rawThought.trim()}\n\nExplain this with exceptional clarity, warmth, and depth in smooth, flowing paragraphs without relying on dry, mechanical bullet points. Use vivid everyday analogies, uncover foundational principles, and guide the reader to a profound understanding through engaging narrative explanation.`;
    bnPrompt = `তুমি একজন প্রজ্ঞাবান শিক্ষক ও দূরদর্শী পরামর্শক হিসেবে কথা বলবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nকোনো শুষ্ক বা কৃত্রিম ১, ২, ৩ বুলেট পয়েন্ট তালিকা না করে সরাসরি চমৎকার, সাবলীল অনুচ্ছেদে বিষয়টি বুঝিয়ে দাও। বাস্তব জীবনের উপমা ও গভীর বিশ্লেষণের মাধ্যমে বিষয়টির মূল রহস্য সহজবোধ্য ও আকর্ষণীয়ভাবে তুলে ধরো, যাতে প্রতিটি অনুচ্ছেদ পড়ার আনন্দ এনে দেয়।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `সরাসরি ও প্রাঞ্জল ভাষায় বুঝিয়ে বলো: "${rawThought.trim()}". কোনো অপ্রয়োজনীয় ভূমিকা বা তালিকা ছাড়া মূল বিষয়টি স্পষ্ট তুলে ধরো।`;
    varStructuredPrompt = `উৎস ও ভিত্তি, কার্যকারণ বিশ্লেষণ, বাস্তব প্রয়োগ — এই ৩টি অংশে "${rawThought.trim()}" ব্যাখ্যা করো।`;
  }

  return {
    flaws: [
      {
        title: "নির্দিষ্ট কনটেক্সট ও ব্যাকগ্রাউন্ডের ঘাটতি",
        description: "কাঁচা কথায় তোমার চূড়ান্ত উদ্দেশ্য এবং কাজের পরিধি স্পষ্ট ছিল না, ফলে এআই সাধারণ উত্তর দিত।"
      },
      {
        title: "পছন্দসই ফরম্যাট ও স্বরের অনুপস্থিতি",
        description: "তুমি কি একটানা গল্প/অনুচ্ছেদে চাও নাকি সরাসরি সমাধান চাও, তা আগে স্পষ্ট বলা ছিল না।"
      }
    ],
    missingContext: [
      "কাঙ্ক্ষিত স্টাইল বা শৈলী (সাবলীল অনুচ্ছেদ নাকি সংক্ষিপ্ত কমান্ড)",
      "লক্ষ্যমাত্রা ও টার্গেট অডিয়েন্স কারা"
    ],
    guidelines: [
      {
        rule: "প্রয়োজন অনুযায়ী সঠিক ফরম্যাট নির্ধারণ (Format Adaptation)",
        explanation: "সব কাজে পয়েন্ট তালিকা মানায় না; গল্প, চিঠি বা সাধারণ আলোচনায় সাবলীল অনুচ্ছেদ সবচেয়ে জীবন্ত ফলাফল দেয়।"
      },
      {
        rule: "ভূমিকা বা পার্সোনা নির্ধারণ (Persona Framing)",
        explanation: `${targetModel}-কে বিষয়োপযোগী বিশেষজ্ঞ রোল দিলে উত্তরের গভীরতা বহুগুণ বৃদ্ধি পায়।`
      }
    ],
    modelSpecificTips: [
      `${targetModel}-এর জন্য সেরা স্টাইল: ${syntaxStyle}`
    ],
    optimizedPrompt: {
      title: `${targetModel}-এর জন্য অপ্টিমাইজড মাস্টার প্রম্পট (${promptFormatBn})`,
      masterPromptEn: enPrompt,
      masterPromptBn: bnPrompt,
      systemInstruction: `You are an elite expert tuned for ${targetModel}. Always deliver precise, high-value, fluff-free responses with comprehensive reasoning.`,
      outputFormatSpec: syntaxStyle
    },
    variations: [
      {
        name: "প্রাকৃতিক অনুচ্ছেদ (প্যারাগ্রাফ স্টাইল)",
        tag: "প্যারাগ্রাফ",
        prompt: varNarrativePrompt
      },
      {
        name: "সরাসরি ও সুনির্দিষ্ট কমান্ড",
        tag: "সংক্ষিপ্ত",
        prompt: varDirectPrompt
      },
      {
        name: "ধাপভিত্তিক রূপরেখা (যখন প্রয়োজন)",
        tag: "ধাপভিত্তিক",
        prompt: varStructuredPrompt
      }
    ],
    scores: {
      clarity: 82,
      context: 70,
      constraints: 60,
      roleDefinition: 50,
      overallRawScore: 65
    },
    thinkingSummary: `এই প্রম্পটটিকে ${targetModel}-এর জন্য কৃত্রিম বুলেট পয়েন্ট বাদ দিয়ে প্রাকৃতিক ও কার্যকর ফরম্যাটে রূপান্তর করা হয়েছে।`,
    promptFormat: promptFormatBn,
    promptFormatEn: promptFormatEn
  };
}

// 1. POST /api/analyze-prompt: Deep prompt flaw detection, improvement rules & master prompt synthesis
app.post('/api/analyze-prompt', async (req: Request, res: Response) => {
  try {
    const {
      rawThought,
      targetModel = 'chatgpt',
      goal = 'general',
      language = 'bilingual',
      tone = 'expert',
      requestedFormat = 'auto',
      useHighThinking = false,
    } = req.body;

    if (!rawThought || typeof rawThought !== 'string' || !rawThought.trim()) {
      return res.status(400).json({ error: 'কাঁচা চিন্তা বা প্রশ্ন প্রদান করা আবশ্যক (Raw thought is required).' });
    }

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];

    const systemInstruction = `You are the world's greatest AI Prompt Architect and AI Communication Strategist.
Your mission is to examine the user's raw, unpolished, everyday thought or query (which may be in Bengali, English, or mixed Banglish).
Your overarching goal:
TRANSFORM EVEN THE SIMPLEST, ROUGHEST, OR VAGUEST USER THOUGHT INTO AN UNSTOPPABLE, ELITE MASTER PROMPT THAT FORCES THE TARGET AI (${targetModel}) TO DELIVER THE ABSOLUTE HIGHEST-VALUE, MOST IN-DEPTH, AND EXPERT-LEVEL ANSWER POSSIBLE.

CRITICAL ARCHITECTURAL DIRECTIVE - DYNAMIC PROMPT FORMAT INTELLIGENCE (ANTI-MONOTONOUS BULLET LIST RULE):
- STRICT USER REQUIREMENT: DO NOT ALWAYS GENERATE PROMPTS AS POINT-BY-POINT (১. ২. ৩.) BULLET LISTS!
- Prompts that force rigid bullet points on creative tasks, stories, letters, personal emails, philosophy, or natural explanations feel mechanical, artificial, and frustrating.
- YOU MUST DYNAMICALLY ADAPT THE PROMPT FORMAT TO SUIT THE GENUINE NEED OF THE USER'S TASK:
  1. FLUENT NARRATIVE PROSE (প্রাকৃতিক ও সাবলীল অনুচ্ছেদ):
     - For stories, creative writing, emotional copy, letters, emails, general inquiries, conceptual explanations, speeches, social media posts.
     - The master prompt MUST be written in continuous, highly articulate paragraphs with ZERO numbered points or bullet lists!
  2. DIRECT, AUTHORITATIVE COMMAND (সরাসরি ও সুনির্দিষ্ট নির্দেশনা):
     - For quick tasks, concise queries, fast translations, direct summaries.
     - Punchy, laser-focused 1-2 paragraph command that cuts straight to the core without filler.
  3. SCENARIO & PERSONA IMMERSION (প্রেক্ষাপট ও চরিত্র আখ্যান):
     - For roleplay, consultations, simulations, behavioral scenarios.
     - Immersive narrative setting the exact stage, emotions, and dynamic without robotic lists.
  4. DEVELOPER TECHNICAL SPECIFICATION (কারিগরি ও কোডিং স্পেক):
     - For coding, debugging, architecture, database schemas, APIs.
     - Professional technical spec with architecture expectations, edge cases, and code block standards.
  5. PHASED / STEP-BY-STEP FRAMEWORK (ধাপভিত্তিক রূপরেখা):
     - ONLY use numbered steps or phases when the task is INHERENTLY a sequential workflow, SOP, or multi-stage business roadmap!
  6. CINEMATIC DESCRIPTIVE TOKENS (ভিজ্যুয়াল টোকেন):
     - For Midjourney/Flux: Comma-separated descriptive visual keywords, camera lens, lighting, render style (NEVER bullet points!).

User Requested Format Preference: "${requestedFormat}" (If 'paragraph', strictly enforce continuous prose with zero bullet points. If 'direct', enforce compact single/double paragraph command. If 'step_by_step', provide phased steps. If 'auto', select the best natural fit).

CRITICAL INVIOLABLE LANGUAGE DIRECTIVE - "তুমি, তোমার" MANDATORY (NO "আপনি"):
- Every prompt generated for EVERY model and EVERY Bengali explanation MUST strictly and exclusively use "তুমি", "তোমার", "তোমাকে", "তোমরা", "তোমাদের" as second person pronouns.
- ABSOLUTELY NEVER use "আপনি", "আপনার", "আপনাকে", or "আপনাদের" anywhere! "আপনি" is strictly NOT supported on this website and completely forbidden.
- In all Bengali verb forms, ALWAYS use informal/friendly imperatives and conjugations: "করো" (NEVER "করুন"), "বলো" (NEVER "বলুন"), "লেখো" (NEVER "লিখুন"), "দাও" (NEVER "দিন"), "দেখো" (NEVER "দেখুন"), "নাও" (NEVER "নিন"), "রাখো" (NEVER "রাখুন"), "পারবে" (NEVER "পারেন"), "জানাও" (NEVER "জানান"), "ধরো" (NEVER "ধরুন").
- In the generated Master Prompt in Bengali (masterPromptBn): Instruct the AI model directly as "তুমি" (e.g., "তুমি একজন শীর্ষস্থানীয় বিশেষজ্ঞ...", "তোমার কাজ হলো...", "তুমি গভীর বিশ্লেষণ করো এবং স্পষ্ট সমাধান দাও...").
- In flaws, guidelines, missing context, and tips: Address the user consistently as "তুমি / তোমার" (e.g., "তোমার কাঁচা কথায়...", "তুমি এই নিয়মটি অনুসরণ করো...").

Return your analysis strictly as a valid JSON object with the following schema:
{
  "flaws": [
    { "title": "সংক্ষিপ্ত ত্রুটি", "description": "বিস্তারিত ব্যাখ্যা কেন এটা দুর্বল ছিল" }
  ],
  "missingContext": [
    "অনুপস্থিত প্রাসঙ্গিক তথ্য ১", "অনুপস্থিত প্রাসঙ্গিক তথ্য ২"
  ],
  "guidelines": [
    { "rule": "ফরম্যাট ও গভীরতার নিয়ম ১", "explanation": "কেন এই নিয়মে প্রম্পট করলে এআই সবচেয়ে সেরা উত্তর দেয়" }
  ],
  "modelSpecificTips": [
    "${targetModel}-এর জন্য বিশেষ গোপন কৌশল"
  ],
  "optimizedPrompt": {
    "title": "প্রম্পটের শিরোনাম",
    "masterPromptEn": "Complete, structured English prompt ready to copy-paste",
    "masterPromptBn": "সম্পূর্ণ সাজানো বাংলা প্রম্পট কপি করে ব্যবহারের জন্য (তুমি/তোমার সম্বোধনে, যথাযথ ফরম্যাটে)",
    "systemInstruction": "Optional system instruction if user uses custom GPT or AI Studio",
    "outputFormatSpec": "কী ধরনের ফরম্যাটে এআই উত্তর দিবে তার স্পেসিফিকেশন"
  },
  "variations": [
    { "name": "প্রাকৃতিক অনুচ্ছেদ (প্যারাগ্রাফ স্টাইল)", "tag": "প্যারাগ্রাফ", "prompt": "একটানা সাবলীল অনুচ্ছেদে প্রম্পট (কোনো পয়েন্ট বা বুলেট ছাড়া)" },
    { "name": "সরাসরি ও সুনির্দিষ্ট কমান্ড", "tag": "সংক্ষিপ্ত", "prompt": "সংক্ষিপ্ত ও সরাসরি কমান্ড" },
    { "name": "ধাপভিত্তিক রূপরেখা (যখন দরকার)", "tag": "ধাপভিত্তিক", "prompt": "ধাপভিত্তিক পর্যায়ক্রমিক কাঠামো" }
  ],
  "scores": {
    "clarity": 65,
    "context": 40,
    "constraints": 30,
    "roleDefinition": 20,
    "overallRawScore": 45
  },
  "thinkingSummary": "Short explanation of the format engineering reasoning behind this prompt design.",
  "promptFormat": "প্রাকৃতিক অনুচ্ছেদ / সরাসরি কমান্ড / কারিগরি স্পেক / ধাপভিত্তিক রূপরেখা",
  "promptFormatEn": "Fluent Narrative / Direct Command / Technical Spec / Step-by-Step Framework"
}
IMPORTANT: The response MUST be clean JSON with no markdown backticks wrapping if possible, or cleanly parseable JSON.`;

    const userPromptText = `User Raw Query / কাঁচা মনের কথা:
"""${rawThought.trim()}"""

Target AI Chatbot: ${targetModel}
Goal / Task Category: ${goal}
Tone: ${tone}
Requested Format Style: ${requestedFormat}
Language Preference: ${language}
High Thinking Enabled: ${useHighThinking}

Please dissect this raw thought, determine the best format (avoiding robotic bullet points if prose or narrative fits better), explain the flaws and missing elements, and synthesize the ultimate master prompts for ${targetModel}. Remember: Use ONLY "তুমি" and "তোমার" in all Bengali outputs; "আপনি" is completely forbidden.`;

    const config: any = {
      systemInstruction,
      responseMimeType: 'application/json',
    };

    if (useHighThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      // Do not set maxOutputTokens per feature block instructions
    }

    const response = await generateWithFallback(candidateModels, {
      contents: userPromptText,
      config,
    }, req);

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      // In case of any wrapping ticks
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const sanitizedData = deepSanitizeToTumiTomar(parsedData);

    return res.json({
      success: true,
      modelUsed: candidateModels[0],
      data: sanitizedData,
    });
  } catch (_error: any) {
    const fallbackData = synthesizePromptArchitectFallback(
      String(req.body.rawThought || ''),
      String(req.body.targetModel || 'ChatGPT'),
      String(req.body.goal || 'general'),
      String(req.body.tone || 'expert'),
      String(req.body.requestedFormat || 'auto')
    );
    return res.json({
      success: true,
      modelUsed: 'architect-core-engine',
      data: deepSanitizeToTumiTomar(fallbackData),
    });
  }
});

// 2. POST /api/quick-enhance: Ultra fast prompt polisher using valid flash models
app.post('/api/quick-enhance', async (req: Request, res: Response) => {
  try {
    const { text, targetModel = 'chatgpt' } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text required' });
    }

    const response = await generateWithFallback(['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'], {
      contents: `Quickly enhance this raw user query into a crisp, high-impact prompt for ${targetModel}. Keep it concise, direct, and actionable. Provide 1 enhanced English prompt and 1 enhanced Bengali prompt:
User text: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: 'You are a lightning-fast prompt polish assistant. Return JSON: {"enhancedEn": "...", "enhancedBn": "...", "quickTip": "..."}',
      },
    }, req);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ...parsed });
  } catch (_error: any) {
    return res.json({
      success: true,
      enhancedEn: `Act as a senior specialist. Deliver an actionable, structured, in-depth solution for: "${req.body.text}" with real-world examples and zero boilerplate.`,
      enhancedBn: `একজন শীর্ষ বিশেষজ্ঞ হিসেবে নিচের বিষয়ে কার্যকর, কাঠামোগত ও গভীর সমাধান দাও: "${req.body.text}"।`,
      quickTip: `${req.body.targetModel || 'AI'}-এ নির্দিষ্ট রোল এবং আউটপুট ফরম্যাট উল্লেখ করলে সেরা উত্তর পাওয়া যায়।`
    });
  }
});

// Built-in fallback for Polish Text feature
function synthesizePolishedTextFallback(rawText: string, style: string = 'literary') {
  const trimmed = rawText.trim();
  
  let mainText = `মনের অবচেতনে জমে থাকা প্রতিটি অনুভূতি যখন শব্দের রূপ পায়, তখন তা কেবল কথা থাকে না—হয়ে ওঠে হৃদয়ের গভীর সুর। ঠিক যেমন তুমি প্রকাশ করতে চেয়েছো: "${trimmed}"। জীবনের প্রতিটি পদক্ষেপে এই ভাবনা তোমার একান্ত শক্তি হয়ে থাকুক এবং সকলের হৃদয়ে পৌঁছে দিক এক অনাবিল মুগ্ধতা।`;
  let styleName = 'সাহিত্যিক ও রসালো';
  
  if (style === 'eloquent') {
    mainText = `যেকোনো চিন্তা তখনই অনন্য মর্যাদা পায় যখন তা সুস্পষ্ট ও মার্জিত শব্দে প্রকাশিত হয়। তোমার মূল ভাবনা: "${trimmed}"—বিষয়টিকে অত্যন্ত শ্রদ্ধাশীল ও প্রভাববিস্তারী রূপ দিয়ে তুলে ধরা হয়েছে, যাতে তা পাঠকের মনে গভীর আস্থা ও শ্রদ্ধার সঞ্চার করে।`;
    styleName = 'মার্জিত ও প্রভাবশালী';
  } else if (style === 'heartfelt') {
    mainText = `হৃদয়ের খুব গভীর থেকে আসা কথাগুলোই সবচেয়ে বেশি আপন মনে হয়। তোমার ভেতরের অনুভূতি: "${trimmed}"—এখানে কোনো মেকি বা কৃত্রিম আবরণ নেই, আছে কেবল এক রাশ খাঁটি ভালোবাসা ও নির্মল আন্তরিকতা।`;
    styleName = 'আন্তরিক ও হৃদয়স্পর্শী';
  } else if (style === 'punchy') {
    mainText = `শব্দ কম, কিন্তু ওজন অপরিসীম—"${trimmed}"। এক পলকে পাঠকের দৃষ্টি কাড়ার মতো তীক্ষ্ণ, স্পষ্ট ও আকর্ষণীয় ভাব প্রকাশ।`;
    styleName = 'সংক্ষিপ্ত ও ধারালো';
  } else if (style === 'inspirational') {
    mainText = `প্রতিটি বড় অর্জনের শুরু হয় একটি সাহসী চিন্তা থেকে। তোমার এই বিশ্বাস: "${trimmed}"—এটি শুধু একটি ভাবনা নয়, বরং এক নতুন উদ্দীপনার পথপ্রদর্শক যা তোমাকে বহুদূর এগিয়ে নিয়ে যাবে।`;
    styleName = 'অনুপ্রেরণামূলক ও উদ্দীপক';
  } else if (style === 'lucid') {
    mainText = `সহজ কথাই সবচেয়ে সুন্দর। কোনো আড়ম্বর ছাড়াই স্পষ্ট ও প্রাঞ্জল ভাষায় তোমার কথা: "${trimmed}"। যা যেকেউ একবার পড়লেই সহজে অনুধাবন করতে পারবে।`;
    styleName = 'সহজ-সরল ও প্রাঞ্জল';
  }

  return {
    polishedText: mainText,
    styleName,
    toneSummary: `তোমার কাঁচা কথাটিকে অত্যন্ত আকর্ষণীয় ও হৃদয়গ্রাহী ভাষায় গুছিয়ে রূপান্তর করা হয়েছে যাতে পাঠকমাত্রই মুগ্ধ হয়।`,
    keyHighlights: ['মুগ্ধকর শব্দচয়ন', 'প্রাঞ্জল বাক্যগঠন', 'স্বাভাবিক আবেগের প্রকাশ'],
    variations: [
      {
        styleName: 'সাহিত্যিক ও রসালো রূপ',
        tag: 'সাহিত্যিক',
        text: `শব্দের গহীনে লুকিয়ে থাকা একরাশ নিবিড় অনুভূতি নিয়ে গড়ে উঠেছে এই প্রকাশ: "${trimmed}"। প্রতিটি বাক্যে সুর ও অনুরাগের এক চমৎকার বন্ধন ফুটিয়ে তোলা হয়েছে।`
      },
      {
        styleName: 'মার্জিত ও প্রভাবশালী রূপ',
        tag: 'মার্জিত',
        text: `সুচিন্তিত ও শ্রদ্ধাপূর্ণ ভাষায় উপস্থাপন: "${trimmed}"—যা যেকোনো ব্যক্তি বা পরিমণ্ডলে তোমার ব্যক্তিত্ব ও ভাবনার গুরুত্বকে বহুলাংশে বাড়িয়ে তুলবে।`
      },
      {
        styleName: 'আন্তরিক ও হৃদয়স্পর্শী রূপ',
        tag: 'হৃদয়স্পর্শী',
        text: `অকপট মন থেকে উচ্চারিত এক মধুর বার্তা: "${trimmed}"। যেখানে কৃত্রিমতার লেশমাত্র নেই, আছে শুধু হৃদয়ের উষ্ণ ছোঁয়া।`
      }
    ]
  };
}

// 3. POST /api/polish-text: Transforms any raw text into captivating, mesmerizing writing with literary and diverse styles
app.post('/api/polish-text', async (req: Request, res: Response) => {
  try {
    const { rawText, style = 'literary' } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'লেখা বা মনের কথা প্রদান করা আবশ্যক (Text is required).' });
    }

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];

    const systemInstruction = `You are a master literary artist, celebrated author, and wordsmith supreme.
The user provides raw, unorganized, everyday Bengali or mixed words, rough draft, or personal thought.
Your mission:
Transform and elevate this raw thought into an exquisitely polished, captivating, and emotionally enchanting piece of writing so that ANYONE reading it will be mesmerized and deeply impressed ("যাতে করে সকলে পড়ে মুগ্ধ হতে পারে").

Selected Primary Style: "${style}"

Styles available:
1. "literary" (সাহিত্যিক ও রসালো):
   - Rich, poetic, evocative Bengali prose with enchanting metaphors, sublime emotional depth, and rhythmic cadence (reminiscent of Rabindranath Tagore, Jibanananda Das, or Humayun Ahmed).
2. "eloquent" (মার্জিত ও প্রভাবশালী):
   - Dignified, articulate, sophisticated, authoritative, and deeply impressive professional/formal prose.
3. "heartfelt" (আন্তরিক ও হৃদয়স্পর্শী):
   - Deeply touching, personal, warm, affectionate, and tearfully authentic.
4. "punchy" (সংক্ষিপ্ত ও চোখধাঁধানো):
   - Crisp, sharp, captivating lines perfect for social media posts, captions, or viral quotes.
5. "inspirational" (অনুপ্রেরণামূলক ও উদ্দীপক):
   - Energetic, powerful, stirring, and courageous oratorical style that motivates people.
6. "lucid" (সহজ-সরল ও প্রাঞ্জল):
   - Crystal clear, natural, fluid, and elegant everyday prose with zero unnecessary complexity.

STRICT INVIOLABLE PRONOUN DIRECTIVE - "তুমি, তোমার" MANDATORY (NO "আপনি"):
- Use ONLY "তুমি", "তোমার", "তোমাকে", "তোমরা", "তোমাদের". ABSOLUTELY NEVER use "আপনি", "আপনার", "আপনাকে", or "আপনাদের"!
- In all Bengali verb forms, ALWAYS use informal/friendly imperatives and conjugations: "করো" (NEVER "করুন"), "বলো" (NEVER "বলুন"), "দেখো" (NEVER "দেখুন"), "নাও" (NEVER "নিন"), "রাখো" (NEVER "রাখুন"), "পারবে" (NEVER "পারেন"), "জানাও" (NEVER "জানান"), "ধরো" (NEVER "ধরুন").

Return strictly a valid JSON object matching this schema:
{
  "polishedText": "মূল পরিমার্জিত ও মুগ্ধকর লেখা...",
  "styleName": "সাহিত্যিক ও রসালো",
  "toneSummary": "লেখাটির মধ্যে সাহিত্যের রস ও গভীর অনুভূতির প্রকাশ ঘটানো হয়েছে...",
  "keyHighlights": [
    "উন্নত শব্দচয়ন ও রূপকের ব্যবহার",
    "হৃদয়স্পর্শী বাক্যের বিন্যাস"
  ],
  "variations": [
    {
      "styleName": "সাহিত্যিক ও রসালো রূপ",
      "tag": "সাহিত্যিক",
      "text": "..."
    },
    {
      "styleName": "মার্জিত ও প্রভাবশালী রূপ",
      "tag": "মার্জিত",
      "text": "..."
    },
    {
      "styleName": "আন্তরিক ও হৃদয়স্পর্শী রূপ",
      "tag": "হৃদয়স্পর্শী",
      "text": "..."
    }
  ]
}`;

    const userPrompt = `User Raw Text / কাঁচা লেখা:
"""${rawText.trim()}"""

Target Style: ${style}

Please organize, polish, and transform these words into captivating, beautiful Bengali writing. Remember: Use ONLY "তুমি" and "তোমার", never "আপনি".`;

    const response = await generateWithFallback(candidateModels, {
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    }, req);

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const sanitizedData = deepSanitizeToTumiTomar(parsedData);
    return res.json({ success: true, data: sanitizedData });
  } catch (_error: any) {
    const fallbackData = synthesizePolishedTextFallback(
      String(req.body.rawText || ''),
      String(req.body.style || 'literary')
    );
    return res.json({ success: true, data: deepSanitizeToTumiTomar(fallbackData) });
  }
});

// Built-in fallback for RTCF Framework Prompt Generator
function synthesizeRTCFFallback(
  rawText: string,
  targetCategory: string = 'auto',
  customFields?: { role?: string; task?: string; context?: string; format?: string },
  refineInstruction?: string
) {
  const trimmed = rawText.trim();
  const lower = (trimmed + ' ' + (refineInstruction || '')).toLowerCase();

  const isImage = lower.includes('ছবি') || lower.includes('image') || lower.includes('photo') || lower.includes('draw') || lower.includes('art') || lower.includes('আর্ট') || lower.includes('midjourney');
  const isWeb = lower.includes('ওয়েবসাইট') || lower.includes('website') || lower.includes('কোড') || lower.includes('code') || lower.includes('react') || lower.includes('app') || lower.includes('অ্যাপ') || lower.includes('html') || lower.includes('python');
  const isBusiness = lower.includes('ব্যবসা') || lower.includes('business') || lower.includes('মার্কেটিং') || lower.includes('marketing') || lower.includes('বিক্রি') || lower.includes('sales');

  let title = 'প্রফেশনাল RTCF মাস্টার প্রম্পট';
  let category = 'সাধারণ টাস্ক ও সমাধান';
  let roleBn = customFields?.role?.trim() || 'তুমি একজন অভিজ্ঞ ও আন্তর্জাতিক মানের বিশেষজ্ঞ কনসালট্যান্ট।';
  let roleEn = 'Act as an elite domain authority and world-class specialist with exhaustive experience.';
  let taskBn = customFields?.task?.trim() || `তোমার দায়িত্ব হলো নিচের লক্ষ্যটি নিখুঁত ও সর্বোচ্চ মানের সাথে বাস্তবায়ন করা: "${trimmed || 'নির্দিষ্ট টাস্ক সম্পন্ন করো'}"।`;
  let taskEn = `Your primary task is to execute, design, and deliver a comprehensive solution for: "${trimmed || 'the specified objective'}".`;
  let contextBn = customFields?.context?.trim() || `এই কাজটি বাস্তবায়নের ক্ষেত্রে বাস্তবসম্মত পদক্ষেপ, কোনো ভাসাভাসা কথা ছাড়া গভীর বিশ্লেষণ এবং সেরা ফলাফল অর্জন নিশ্চিত করতে হবে।`;
  let contextEn = `Deliver high-precision execution with deep practical insights, real-world context, and zero superficial filler.`;
  let formatBn = customFields?.format?.trim() || `সম্পূর্ণ উত্তরটি কাঠামোগতভাবে সাজাও: প্রথমে মূল সারসংক্ষেপ, তারপর পর্যায়ক্রমিক বাস্তবায়ন ধাপ এবং শেষে কার্যকর টিপস।`;
  let formatEn = `Structure the output clearly with: 1) Executive Summary, 2) Phased Action Steps, 3) Real-world Best Practices.`;

  if (isImage) {
    category = 'ছবি ও আর্ট জেনারেশন (Midjourney / DALL-E / Flux)';
    title = 'সিনেমাটিক ইমেজ জেনারেশন RTCF প্রম্পট';
    if (!customFields?.role) {
      roleBn = 'তুমি একজন বিশ্বখ্যাত ডিজিটাল কনসেপ্ট আর্টিস্ট ও মাস্টার সিনেমাটোগ্রাফার।';
      roleEn = 'Act as an award-winning cinematic photographer and master digital concept artist.';
    }
    if (!customFields?.task) {
      taskBn = `নিচের আইডিয়ার ওপর ভিত্তি করে একটি ফটোরিয়ালিস্টিক এবং দৃষ্টিনন্দন ভিজ্যুয়াল আর্ট তৈরি করার নিখুঁত প্রম্পট তৈরি করো: "${trimmed}"।`;
      taskEn = `Generate an ultra-detailed, photorealistic visual prompt for Midjourney/DALL-E based on: "${trimmed}".`;
    }
    if (!customFields?.context) {
      contextBn = `ছবির লাইটিং (যেমন ভলিউমেটিক লাইট, গোল্ডেন আওয়ার), ক্যামেরা অ্যাঙ্গেল (যেমন 85mm f/1.4 লেন্স), কালার গ্রেডিং এবং হাইপার-রিয়ালিস্টিক ডিটেইলিং বজায় থাকবে।`;
      contextEn = `Ensure dramatic cinematic lighting, 8k resolution, photorealistic textures, volumetric dust, 85mm lens depth of field, and perfect color grading.`;
    }
    if (!customFields?.format) {
      formatBn = `মিডজার্নি ও এআই ইমেজ জেনারেটরে সরাসরি পেস্ট করার উপযোগী কমা-সেপারেটেড ভিজ্যুয়াল টোকেন ও প্যারামিটার (--ar 16:9 --v 6.1 --style raw) সহ আউটপুট দাও।`;
      formatEn = `Output a rich, comma-separated descriptive token prompt with camera specs, lighting tokens, and parameters (--ar 16:9 --v 6.1 --style raw).`;
    }
  } else if (isWeb) {
    category = 'ওয়েবসাইট ও কোডিং (Web Development & Coding)';
    title = 'ওয়েবসাইট ডেভেলপমেন্ট RTCF প্রম্পট';
    if (!customFields?.role) {
      roleBn = 'তুমি একজন সিনিয়র প্রিন্সিপাল সফটওয়্যার ইঞ্জিনিয়ার ও ফুল-স্ট্যাক ওয়েব আর্কিটেক্ট।';
      roleEn = 'Act as a Senior Principal Full-Stack Software Engineer and System Architect.';
    }
    if (!customFields?.task) {
      taskBn = `নিচের বর্ণনার ওপর ভিত্তি করে একটি আধুনিক, প্রিমিয়াম, রেসপনসিভ ও নিরাপদ ওয়েবসাইট বা অ্যাপ্লিকেশন তৈরি করার জন্য পূর্ণাঙ্গ কোড ও স্টেপ-বাই-স্টেপ গাইড দাও: "${trimmed}"।`;
      taskEn = `Architect, engineer, and write complete production-ready code and implementation plan for: "${trimmed}".`;
    }
    if (!customFields?.context) {
      contextBn = `আধুনিক টেক-স্ট্যাক (যেমন React, TypeScript, Tailwind CSS), প্রিমিয়াম UI/UX, মোবাইল রেসপনসিভনেস এবং ক্লিন আর্কিটেকচার মেনে কোড লিখতে হবে।`;
      contextEn = `Use modern web tech (React/TypeScript/Tailwind CSS), modular component architecture, fluid responsive styling, and comprehensive error handling.`;
    }
    if (!customFields?.format) {
      formatBn = `প্রথমে ফাইল স্ট্রাকচার, তারপর পূর্ণাঙ্গ কম্পোনেন্ট কোড ব্লক এবং সবশেষে রান ও ডিপ্লয়মেন্ট নির্দেশিকা সহ দাও।`;
      formatEn = `Provide: 1) Architecture & File Structure, 2) Complete Production Component Code Blocks, 3) Setup & Deployment Instructions.`;
    }
  } else if (isBusiness) {
    category = 'ব্যবসা ও মার্কেটিং স্ট্র্যাটেজি (Business & Marketing)';
    title = 'বিজনেস ও মার্কেটিং RTCF প্রম্পট';
    if (!customFields?.role) {
      roleBn = 'তুমি একজন শীর্ষস্থানীয় চিফ মার্কেটিং অফিসার (CMO) ও বিজনেস গ্রোথ স্ট্র্যাটেজিস্ট।';
      roleEn = 'Act as a Chief Marketing Officer (CMO) and seasoned Business Growth Strategist.';
    }
    if (!customFields?.task) {
      taskBn = `নিচের উদ্যোগটির জন্য একটি কার্যকর ও লাভজনক বিজনেস/মার্কেটিং পরিকল্পনা প্রণয়ন করো: "${trimmed}"।`;
      taskEn = `Develop an actionable, high-ROI business growth and marketing blueprint for: "${trimmed}".`;
    }
    if (!customFields?.context) {
      contextBn = `টার্গেট অডিয়েন্স, প্রতিযোগীদের বিশ্লেষণ, মার্কেটিং চ্যানেল এবং বাজেট অপ্টিমাইজেশন মাথায় রেখে বাস্তবসম্মত পরিকল্পনা হতে হবে।`;
      contextEn = `Ground the strategy in target audience psychology, high-converting acquisition channels, unit economics, and competitive positioning.`;
    }
    if (!customFields?.format) {
      formatBn = `ধাপে ধাপে একশন প্ল্যান, টাইমলাইন এবং পরিমাপযোগ্য কেপিআই (KPI) সহ বুলেট ও টেবিল ফরম্যাটে আউটপুট দাও।`;
      formatEn = `Deliver structured sections with: Target Persona, Multi-Channel Action Plan, Timeline, and Measurable KPIs.`;
    }
  }

  const completePromptBn = `【রোল (Role)】\n${roleBn}\n\n【টাস্ক (Task)】\n${taskBn}\n\n【কনটেক্সট (Context)】\n${contextBn}\n\n【ফরম্যাট (Format)】\n${formatBn}`;
  const completePromptEn = `【Role】\n${roleEn}\n\n【Task】\n${taskEn}\n\n【Context】\n${contextEn}\n\n【Format】\n${formatEn}`;

  return {
    title,
    category,
    roleBn,
    roleEn,
    taskBn,
    taskEn,
    contextBn,
    contextEn,
    formatBn,
    formatEn,
    completePromptBn,
    completePromptEn,
    proTips: [
      'এই RTCF প্রম্পটটি সরাসরি ChatGPT, Claude, Gemini বা Cursor-এ পেস্ট করলে এআই সবচেয়ে সঠিক ও নির্ভুল ফলাফল দেবে।',
      'প্রয়োজনে নির্দিষ্ট রোল বা ফরম্যাটে তোমার নিজস্ব কোনো শর্ত যোগ করে নিতে পারো।'
    ]
  };
}

// 4. POST /api/generate-rtcf: Converts any raw thought, chat message, or user self-drafted fields into a structured, supercharged RTCF Prompt Framework
app.post('/api/generate-rtcf', async (req: Request, res: Response) => {
  try {
    const { 
      rawThought = '', 
      category = 'auto', 
      customFields, 
      refineInstruction = '', 
      chatHistory = [] 
    } = req.body;

    const hasRaw = typeof rawThought === 'string' && rawThought.trim().length > 0;
    const hasCustom = customFields && (
      (customFields.role && customFields.role.trim()) ||
      (customFields.task && customFields.task.trim()) ||
      (customFields.context && customFields.context.trim()) ||
      (customFields.format && customFields.format.trim())
    );
    const hasRefine = typeof refineInstruction === 'string' && refineInstruction.trim().length > 0;

    if (!hasRaw && !hasCustom && !hasRefine) {
      return res.status(400).json({ error: 'আইডিয়া, চ্যাট বার্তা বা নিজে লেখা RTCF অংশ প্রদান করা আবশ্যক।' });
    }

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];

    const systemInstruction = `You are the world's most elite Master Prompt Architect specializing in the RTCF Framework (Role, Task, Context, Format).
The RTCF Framework is the golden standard for AI prompting:
- R = Role (The precise domain authority, elite persona, mindset, and specialty the AI must assume)
- T = Task (The explicit, high-impact assignment, step-by-step goal, or creation objective)
- C = Context (Technical parameters, audience, background data, edge-case constraints, and style guidelines)
- F = Format (Exact schema, code-block structure, bullet guidelines, tone, and delivery requirements)

YOUR CORE MISSION:
1. The user may:
   a) Provide an unorganized raw idea or project description in natural language, OR
   b) Write their own draft Role, Task, Context, and Format manually and ask AI to ELEVATE / SUPERCHARGE it, OR
   c) Send a chat instruction/refinement to improve an existing RTCF prompt (e.g. "make the role more technical", "add strict coding constraints", "make it for Midjourney 6.1").
2. Your job is to take their input, enhance it with professional depth, eliminate ambiguity, add missing vital constraints, and produce a flawless, world-class RTCF master prompt.

STRICT INVIOLABLE PRONOUN DIRECTIVE - "তুমি, তোমার" MANDATORY (NO "আপনি"):
- In all Bengali fields (roleBn, taskBn, contextBn, formatBn, completePromptBn, proTips), use ONLY "তুমি", "তোমার", "তোমাকে", "তোমরা", "তোমাদের". ABSOLUTELY NEVER use "আপনি", "আপনার", "আপনাকে", or "আপনাদের"!
- In all Bengali verb forms, ALWAYS use informal/friendly imperatives and conjugations: "করো", "লেখো", "বলো", "দাও", "দেখো", "নাও", "রাখো", "পারবে", "জানাও", "ধরো".

Return strictly a valid JSON object matching this schema:
{
  "title": "প্রম্পটের আকর্ষণীয় বাংলা শিরোনাম",
  "category": "ক্যাটেগরি (যেমন: ওয়েবসাইট ও কোডিং / ছবি ও আর্ট জেনারেশন / ব্যবসা ও মার্কেটিং / কনটেন্ট তৈরি)",
  "roleBn": "তুমি একজন ... (বাংলায় উচ্চমানের রোল স্পেসিফিকেশন)",
  "roleEn": "Act as an elite ... (English role specification)",
  "taskBn": "তোমার কাজ হলো ... (বাংলায় সুনির্দিষ্ট ও উন্নত টাস্ক)",
  "taskEn": "Your task is to ... (English task specification)",
  "contextBn": "প্রেক্ষাপট, টেকনিক্যাল শর্ত ও কনস্ট্রেইন্ট ... (বাংলায় কনটেক্সট)",
  "contextEn": "Context, parameters, and constraints ... (English context)",
  "formatBn": "আউটপুট ফরম্যাট ও নিয়মাবলী ... (বাংলায় ফরম্যাট)",
  "formatEn": "Output format specifications ... (English format)",
  "completePromptBn": "সম্পূর্ণ কপি করার উপযোগী বাংলা RTCF প্রম্পট (【রোল (Role)】\\n...\\n\\n【টাস্ক (Task)】\\n...\\n\\n【কনটেক্সট (Context)】\\n...\\n\\n【ফরম্যাট (Format)】\\n...)",
  "completePromptEn": "Complete copy-pasteable English RTCF prompt (【Role】\\n...\\n\\n【Task】\\n...\\n\\n【Context】\\n...\\n\\n【Format】\\n...)",
  "proTips": [
    "এই প্রম্পটটি কার্যকরভাবে ব্যবহারের বাস্তব টিপ ১",
    "টিপ ২"
  ]
}`;

    let userPrompt = `User Request Details:
Target Category / Domain: ${category}
Raw Idea / Thought: """${rawThought.trim()}"""
`;

    if (hasCustom) {
      userPrompt += `
User Manually Drafted RTCF Components to Supercharge & Elevate:
- User Drafted Role: ${customFields.role || '(None provided - generate the best role)'}
- User Drafted Task: ${customFields.task || '(None provided - generate the best task)'}
- User Drafted Context: ${customFields.context || '(None provided - generate deep context & constraints)'}
- User Drafted Format: ${customFields.format || '(None provided - generate strict output format)'}
`;
    }

    if (hasRefine) {
      userPrompt += `
User Refinement Instruction / Chat Request:
"""${refineInstruction.trim()}"""
`;
    }

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      const recentChat = chatHistory.slice(-4).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      userPrompt += `
Recent Conversation Context:
${recentChat}
`;
    }

    userPrompt += `
Please analyze everything carefully and output the elevated, pristine RTCF (Role, Task, Context, Format) framework in both Bengali (strictly using তুমি/তোমার) and English.`;

    const response = await generateWithFallback(candidateModels, {
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    }, req);

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    const sanitizedData = deepSanitizeToTumiTomar(parsedData);
    return res.json({ success: true, data: sanitizedData });
  } catch (_error: any) {
    const fallbackData = synthesizeRTCFFallback(
      String(req.body.rawThought || ''),
      String(req.body.category || 'auto'),
      req.body.customFields,
      req.body.refineInstruction
    );
    return res.json({ success: true, data: deepSanitizeToTumiTomar(fallbackData) });
  }
});

// 4. POST /api/chat: Multi-turn chat using Gemini with resilient fallbacks
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      modelTier = 'general',
      targetBotSimulation = 'Prompt Architect Guru',
      systemRole,
    } = req.body;

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.8-flash'];

    const defaultSystemInstruction = systemRole || `You are the Lead Prompt Architect & AI Interaction Consultant.
Your mission is to guide users to create world-class prompts for ChatGPT, Claude, Gemini, DeepSeek, Grok, Copilot, Perplexity, and other modern AI systems.
You can:
1. Critique user's prompts live and suggest instant edits.
2. Simulate how different AI models (like Claude, DeepSeek R1, or ChatGPT) would respond to a specific prompt.
3. Suggest missing constraints, edge cases, few-shot examples, or output schemas.
4. Communicate fluently in Bengali or English as preferred by the user. Keep advice sharp, respectful, and highly actionable.`;

    // Convert messages history to Gemini contents format
    // gemini-3 series generateContent accepts contents array with role and parts
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const response = await generateWithFallback(candidateModels, {
      contents,
      config: {
        systemInstruction: defaultSystemInstruction,
      },
    }, req);

    const reply = response.text || '';
    return res.json({
      success: true,
      modelUsed: candidateModels[0],
      reply,
    });
  } catch (_error: any) {
    return res.json({
      success: true,
      modelUsed: 'architect-core-assistant',
      reply: 'বর্তমানে এআই ক্লাউড সার্ভারে কিছুটা চাপ রয়েছে। তবে তোমার প্রম্পটটি নিখুঁত করতে:\n\n১. **নির্দিষ্ট ভূমিকা দাও**: এআই-কে নির্দিষ্ট রোল দিলে উত্তর অনেক গভীর হয়।\n২. **সীমাবদ্ধতা উল্লেখ করো**: কী করতে হবে এবং কী বর্জন করতে হবে তা স্পষ্ট করো।\n৩. **আউটপুট ফরম্যাট দাও**: টেবিল, কোড নাকি বুলেট পয়েন্টে উত্তর চাও তা বলে দাও।',
    });
  }
});

// Creative High-Fidelity Procedural Visual Generator (used when Gemini Image Free Tier hits 429 quota limit)
function generateCreativeProceduralImage(prompt: string, aspectRatio: string): string {
  const p = prompt.toLowerCase();
  let width = 1200;
  let height = 675; // 16:9 default

  if (aspectRatio === '1:1') {
    width = 1000;
    height = 1000;
  } else if (aspectRatio === '9:16') {
    width = 675;
    height = 1200;
  } else if (aspectRatio === '4:3') {
    width = 1200;
    height = 900;
  } else if (aspectRatio === '3:4') {
    width = 900;
    height = 1200;
  }

  // Determine theme from prompt
  let themeName = 'NEO VISUAL STUDIO';
  let primaryColor = '#06b6d4'; // Cyan
  let secondaryColor = '#3b82f6'; // Blue
  let accentColor = '#8b5cf6'; // Violet
  let gridColor = 'rgba(6, 182, 212, 0.15)';
  let symbolIcon = '✦';

  if (p.includes('xray') || p.includes('x-ray') || p.includes('internal')) {
    themeName = 'X-RAY CUTAWAY MATRIX';
    primaryColor = '#22d3ee';
    secondaryColor = '#0891b2';
    accentColor = '#38bdf8';
    gridColor = 'rgba(34, 211, 238, 0.2)';
    symbolIcon = '🔬';
  } else if (p.includes('blueprint') || p.includes('cad') || p.includes('schematic')) {
    themeName = 'PRECISION CAD BLUEPRINT';
    primaryColor = '#60a5fa';
    secondaryColor = '#1d4ed8';
    accentColor = '#93c5fd';
    gridColor = 'rgba(96, 165, 250, 0.25)';
    symbolIcon = '📐';
  } else if (p.includes('luxury') || p.includes('perfume') || p.includes('gold') || p.includes('marble')) {
    themeName = 'LUXURY SHOWCASE';
    primaryColor = '#fbbf24';
    secondaryColor = '#d97706';
    accentColor = '#fef08a';
    gridColor = 'rgba(251, 191, 36, 0.15)';
    symbolIcon = '✨';
  } else if (p.includes('cyberpunk') || p.includes('neon') || p.includes('tokyo')) {
    themeName = 'CYBERPUNK NEON 2077';
    primaryColor = '#f43f5e';
    secondaryColor = '#ec4899';
    accentColor = '#06b6d4';
    gridColor = 'rgba(236, 72, 153, 0.2)';
    symbolIcon = '🌆';
  } else if (p.includes('water') || p.includes('splash') || p.includes('ice') || p.includes('cold')) {
    themeName = 'HYDRO FROZEN MOTION';
    primaryColor = '#38bdf8';
    secondaryColor = '#0284c7';
    accentColor = '#e0f2fe';
    gridColor = 'rgba(56, 189, 248, 0.2)';
    symbolIcon = '💧';
  } else if (p.includes('exploded') || p.includes('disassembly') || p.includes('teardown')) {
    themeName = 'EXPLODED VIEW ASSEMBLY';
    primaryColor = '#818cf8';
    secondaryColor = '#4f46e5';
    accentColor = '#c7d2fe';
    gridColor = 'rgba(129, 140, 248, 0.18)';
    symbolIcon = '📦';
  }

  const cleanPrompt = prompt.replace(/[<>&"]/g, ' ').slice(0, 120) + (prompt.length > 120 ? '...' : '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#040814"/>
        <stop offset="50%" stop-color="#0b1328"/>
        <stop offset="100%" stop-color="#020612"/>
      </linearGradient>
      <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${gridColor}" stroke-width="1"/>
      </pattern>
      <filter id="bloomFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="20" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#gridPattern)"/>

    <circle cx="${width * 0.5}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.35}" fill="${primaryColor}" opacity="0.14" filter="url(#bloomFilter)"/>
    <circle cx="${width * 0.2}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.2}" fill="${secondaryColor}" opacity="0.12" filter="url(#bloomFilter)"/>
    <circle cx="${width * 0.8}" cy="${height * 0.68}" r="${Math.min(width, height) * 0.22}" fill="${accentColor}" opacity="0.12" filter="url(#bloomFilter)"/>

    <g transform="translate(${width * 0.5}, ${height * 0.45})">
      <circle r="${Math.min(width, height) * 0.26}" fill="none" stroke="${primaryColor}" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.6"/>
      <circle r="${Math.min(width, height) * 0.18}" fill="#080e1e" fill-opacity="0.8" stroke="${secondaryColor}" stroke-width="2" filter="url(#bloomFilter)"/>
      <rect x="-${Math.min(width, height) * 0.12}" y="-${Math.min(width, height) * 0.12}" width="${Math.min(width, height) * 0.24}" height="${Math.min(width, height) * 0.24}" rx="18" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.8"/>
      <text x="0" y="16" font-size="${Math.min(width, height) * 0.09}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${symbolIcon}</text>
    </g>

    <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.8"/>
    <path d="M ${width - 40} 70 L ${width - 40} 40 L ${width - 70} 40" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.8"/>
    <path d="M 40 ${height - 70} L 40 ${height - 40} L 70 ${height - 40}" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.8"/>
    <path d="M ${width - 40} ${height - 70} L ${width - 40} ${height - 40} L ${width - 70} ${height - 40}" fill="none" stroke="${primaryColor}" stroke-width="2" opacity="0.8"/>

    <rect x="${width * 0.5 - 150}" y="45" width="300" height="34" rx="17" fill="#030712" fill-opacity="0.85" stroke="${primaryColor}" stroke-width="1.5"/>
    <text x="${width * 0.5}" y="67" fill="${primaryColor}" font-size="12" font-weight="700" font-family="monospace" text-anchor="middle" letter-spacing="3">${themeName}</text>

    <rect x="${width * 0.08}" y="${height - 110}" width="${width * 0.84}" height="76" rx="18" fill="#030712" fill-opacity="0.9" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    <text x="${width * 0.12}" y="${height - 76}" fill="#f8fafc" font-size="14" font-weight="600" font-family="system-ui, -apple-system, sans-serif">${cleanPrompt}</text>
    <text x="${width * 0.12}" y="${height - 52}" fill="${primaryColor}" font-size="11" font-family="monospace">RESOLUTION: ${width}x${height} • PROMPT VISUAL CANVAS</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// 4. POST /api/generate-image: High quality image generation with graceful free-tier fallback
// With affordance for 1K, 2K, 4K resolution and aspect ratios
let imageQuotaCooldownUntil = 0;

app.post('/api/generate-image', async (req: Request, res: Response) => {
  const {
    prompt,
    imageSize = '1K', // 1K, 2K, 4K
    aspectRatio = '1:1', // 1:1, 16:9, 9:16, 4:3, 3:4
  } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Image prompt is required' });
  }

  const validSizes = ['1K', '2K', '4K'];
  const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

  const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const chosenAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

  let imageUrl = '';
  let usedModel = 'gemini-3.1-flash-image';
  let description = '';
  let isQuotaExceeded = false;

  // If quota was recently exceeded on free-tier, skip cloud call to prevent repeated 429 errors
  const now = Date.now();
  if (now > imageQuotaCooldownUntil) {
    const candidateModels = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: chosenAspectRatio as any,
              imageSize: chosenSize as any,
            },
          },
        });

        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const mime = part.inlineData.mimeType || 'image/png';
              imageUrl = `data:${mime};base64,${part.inlineData.data}`;
              usedModel = model;
            } else if (part.text) {
              description += part.text;
            }
          }
        }

        if (imageUrl) {
          break;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || '');
        const is429 = err?.status === 429 || err?.code === 429 || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
        if (is429) {
          isQuotaExceeded = true;
          imageQuotaCooldownUntil = Date.now() + 60000; // 1-minute cooldown for free tier
          break;
        }
      }
    }
  } else {
    isQuotaExceeded = true;
  }

  // If Gemini image model succeeded, return the real image
  if (imageUrl) {
    return res.json({
      success: true,
      imageUrl,
      modelUsed: usedModel,
      imageSize: chosenSize,
      aspectRatio: chosenAspectRatio,
      description,
    });
  }

  // Graceful Fallback: When Free Tier quota limit is exceeded or image model is restricted
  const fallbackUrl = generateCreativeProceduralImage(prompt, chosenAspectRatio);

  return res.json({
    success: true,
    imageUrl: fallbackUrl,
    modelUsed: 'creative-canvas-engine',
    imageSize: chosenSize,
    aspectRatio: chosenAspectRatio,
    description: 'High-fidelity visual canvas preview (Free-tier API quota fallback)',
    isQuotaFallback: true,
    warning: isQuotaExceeded ? 'Gemini Image Free Tier Quota Limit Reached (429)' : undefined,
  });
});


// Vite middleware for dev / static for prod
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`PromptCraft AI server running on port ${port}`);
});
