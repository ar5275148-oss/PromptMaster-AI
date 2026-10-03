import { SupportedModelId, PromptAnalysisResult, RTCFResult, PolishedTextResult, PolisherStyleId } from '../types';
import { ALL_AI_MODELS } from '../data/modelsData';
import { deepSanitizeToTumiTomar } from './bengaliSanitizer';

// 1. Client-Side Master Prompt Architect Engine
export function synthesizeClientPromptArchitect(
  rawThought: string,
  targetModelId: SupportedModelId = 'chatgpt',
  _goal: string = 'general',
  _tone: string = 'expert',
  requestedFormat: string = 'auto'
): PromptAnalysisResult {
  const modelObj = ALL_AI_MODELS.find((m) => m.id === targetModelId) || ALL_AI_MODELS[0];
  const targetModelName = modelObj.name;
  const rawLower = rawThought.toLowerCase();

  const isMidjourney =
    targetModelId === 'midjourney' ||
    rawLower.includes('ছবি') ||
    rawLower.includes('image') ||
    rawLower.includes('draw');

  const isCode =
    targetModelId === 'copilot' ||
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
    rawLower.includes('story') ||
    rawLower.includes('poem') ||
    rawLower.includes('creative');

  const isCommunication =
    rawLower.includes('চিঠি') ||
    rawLower.includes('ইমেইল') ||
    rawLower.includes('মেসেজ') ||
    rawLower.includes('আবেদন') ||
    rawLower.includes('দরখাস্ত') ||
    rawLower.includes('email') ||
    rawLower.includes('letter') ||
    rawLower.includes('message');

  const isWorkflow =
    rawLower.includes('রোডম্যাপ') ||
    rawLower.includes('পরিকল্পনা') ||
    rawLower.includes('চেকলিস্ট') ||
    rawLower.includes('প্ল্যান') ||
    rawLower.includes('roadmap') ||
    rawLower.includes('plan') ||
    rawLower.includes('checklist');

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
    enPrompt = `Ultra-realistic cinematic photograph, 8k resolution, volumetric lighting, ${rawThought.trim()}, shot on 85mm f/1.4 lens, photorealistic textures, vivid color grading, octane 3D render --ar 16:9 --v 6.1 --style raw`;
    bnPrompt = `সিনেম্যাটিক ফটোগ্রাফি, ৮k রেজ্যুলিউশন, গভীর আলোকসম্পাত, ${rawThought.trim()}, ৮৫ মিমি পোর্ট্রেট লেন্স, ড্রামাটিক স্টুডিও লাইটিং, নিখুঁত টেক্সচার, থ্রিডি অক্টেন রেন্ডার, অত্যন্ত নিখুঁত ডিটেইল --ar 16:9`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `Cinematic photo of ${rawThought.trim()}, dramatic lighting, 85mm lens, 8k --ar 16:9`;
    varStructuredPrompt = `Subject: ${rawThought.trim()}\nLighting: Volumetric cinematic rays\nCamera: 85mm f/1.4\nRender: Octane 3D 8K --ar 16:9`;
  } else if (isCreative || requestedFormat === 'paragraph') {
    promptFormatBn = 'প্রাকৃতিক ও সাবলীল অনুচ্ছেদ (নো-পয়েন্ট)';
    promptFormatEn = 'Fluent Narrative (Zero Bullets)';
    syntaxStyle = 'ধারাবাহিক সৃষ্টিশীল গদ্য (Natural Prose)';
    enPrompt = `Adopt the persona of an evocative, acclaimed creative author and storyteller. Your objective:\n\n${rawThought.trim()}\n\nWrite in continuous, captivating narrative prose without mechanical bullet points or rigid numbered lists. Build palpable atmosphere, deep emotional resonance, subtle character psychology, and vivid sensory detail. Let each sentence flow naturally.`;
    bnPrompt = `তুমি একজন সংবেদনশীল সাহিত্যিক ও সিদ্ধহস্ত লেখক হিসেবে কথা বলবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nলেখায় কোনো যান্ত্রিক পয়েন্ট বা বুলেট লিস্ট ব্যবহার করবে না। সম্পূর্ণ স্বাভাবিক, একটানা আকর্ষণীয় অনুচ্ছেদে গল্প ও আবেগের গভীরতা ফুটিয়ে তোলো। প্রতিটি শব্দের ছন্দ, দৃশ্যের স্বাভাবিক চিত্রায়ন এবং চরিত্রের মনস্তাত্ত্বিক টানাপোড়েন বজায় রেখে একটি অসাধারণ সাহিত্যিক শৈলীতে রচনা করো।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `একটি অত্যন্ত চিত্তাকর্ষক ও হৃদয়গ্রাহী ভাষায় সরাসরি লেখো: "${rawThought.trim()}". কোনো অপ্রয়োজনীয় ভূমিকা ছাড়া মূল বিষয়বস্তু প্রাঞ্জলভাবে তুলে ধরো।`;
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

    varNarrativePrompt = `একজন প্রবীণ ডেভেলপার হিসেবে বাস্তব অভিজ্ঞতার আলোকে ("${rawThought.trim()}") বিষয়টি সহজ কোড প্যাটার্নে ব্যাখ্যা ও সমাধান করো।`;
    varDirectPrompt = `Write clean, working code for: "${rawThought.trim()}". Return only the code with inline comments explaining key logic.`;
    varStructuredPrompt = `ধাপ ১: আর্কিটেকচার ও নির্ভরতা\nধাপ ২: কোর ইমপ্লিমেন্টেশন কোড\nধাপ ৩: এরর হ্যান্ডলিং ও টেস্ট\n\nএই ৩টি ধাপে "${rawThought.trim()}" কোডটি তৈরি করো।`;
  } else if (isWorkflow || requestedFormat === 'step_by_step') {
    promptFormatBn = 'পর্যায়ক্রমিক রোডম্যাপ ও রূপরেখা';
    promptFormatEn = 'Phased Roadmap';
    syntaxStyle = 'পর্যায়ক্রমিক অ্যাকশন ফ্রেমওয়ার্ক';
    enPrompt = `Act as an expert strategic operations director. Your objective:\n\n${rawThought.trim()}\n\nBreak this down into logical sequential phases with measurable outcomes, critical milestones, and practical execution steps.`;
    bnPrompt = `তুমি একজন দক্ষ স্ট্র্যাটেজিক ডিরেক্টর হিসেবে দিকনির্দেশনা দেবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nপুরো বিষয়টি সুশৃঙ্খল পর্যায়ক্রমিক ধাপে (পর্যায় ১, পর্যায় ২, পর্যায় ৩) ভাগ করে স্পষ্ট মাইলফলক ও বাস্তবসম্মত কর্মপরিকল্পনা প্রদান করো।`;

    varNarrativePrompt = `একটি সার্বিক সমন্বিত কর্মপরিকল্পনা হিসেবে ("${rawThought.trim()}") কোন বিষয়গুলো সবচেয়ে গুরুত্বপূর্ণ তা ধারাবাহিক প্রাঞ্জল অনুচ্ছেদে বুঝিয়ে বলো।`;
    varDirectPrompt = `সবচেয়ে গুরুত্বপূর্ণ ৩টি অ্যাকশন আইটেম সহ সংক্ষেপে জানাও: "${rawThought.trim()}".`;
    varStructuredPrompt = bnPrompt;
  } else {
    promptFormatBn = 'সহজবোধ্য প্রাঞ্জল অনুচ্ছেদ ও সাদৃশ্য';
    promptFormatEn = 'Conversational Analogy Prose';
    syntaxStyle = 'প্রাঞ্জল অনুচ্ছেদ ও বাস্তব সাদৃশ্য (No Bullets)';
    enPrompt = `Adopt the persona of a world-class mentor and subject matter expert. Your mission is:\n\n${rawThought.trim()}\n\nExplain this with exceptional clarity, warmth, and depth in smooth, flowing paragraphs without relying on dry, mechanical bullet points. Use vivid everyday analogies, uncover foundational principles, and guide the reader to a profound understanding through engaging narrative explanation.`;
    bnPrompt = `তুমি একজন প্রজ্ঞাবান শিক্ষক ও দূরদর্শী পরামর্শক হিসেবে কথা বলবে। তোমার দায়িত্ব:\n\n${rawThought.trim()}\n\nকোনো শুষ্ক বা কৃত্রিম ১, ২, ৩ বুলেট পয়েন্ট তালিকা না করে সরাসরি চমৎকার, সাবলীল অনুচ্ছেদে বিষয়টি বুঝিয়ে দাও। বাস্তব জীবনের উপমা ও গভীর বিশ্লেষণের মাধ্যমে বিষয়টির মূল রহস্য সহজবোধ্য ও আকর্ষণীয়ভাবে তুলে ধরো, যাতে প্রতিটি অনুচ্ছেদ পড়ার আনন্দ এনে দেয়।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `সরাসরি ও প্রাঞ্জল ভাষায় বুঝিয়ে বলো: "${rawThought.trim()}". কোনো অপ্রয়োজনীয় ভূমিকা বা তালিকা ছাড়া মূল বিষয়টি স্পষ্ট তুলে ধরো।`;
    varStructuredPrompt = `উৎস ও ভিত্তি, কার্যকারণ বিশ্লেষণ, বাস্তব প্রয়োগ — এই ৩টি অংশে "${rawThought.trim()}" ব্যাখ্যা করো।`;
  }

  const rawResult: PromptAnalysisResult = {
    flaws: [
      {
        title: 'নির্দিষ্ট কনটেক্সট ও ব্যাকগ্রাউন্ডের ঘাটতি',
        description: 'কাঁচা কথায় তোমার চূড়ান্ত উদ্দেশ্য এবং কাজের পরিধি স্পষ্ট ছিল না, ফলে এআই সাধারণ উত্তর দিত।',
      },
      {
        title: 'পছন্দসই ফরম্যাট ও স্বরের অনুপস্থিতি',
        description: 'তুমি কি একটানা গল্প/অনুচ্ছেদে চাও নাকি সরাসরি সমাধান চাও, তা আগে স্পষ্ট বলা ছিল না।',
      },
    ],
    missingContext: [
      'কাঙ্ক্ষিত স্টাইল বা শৈলী (সাবলীল অনুচ্ছেদ নাকি সংক্ষিপ্ত কমান্ড)',
      'লক্ষ্যমাত্রা ও টার্গেট অডিয়েন্স কারা',
    ],
    guidelines: [
      {
        rule: 'প্রয়োজন অনুযায়ী সঠিক ফরম্যাট নির্ধারণ (Format Adaptation)',
        explanation: 'সব কাজে পয়েন্ট তালিকা মানায় না; গল্প, চিঠি বা সাধারণ আলোচনায় সাবলীল অনুচ্ছেদ সবচেয়ে জীবন্ত ফলাফল দেয়।',
      },
      {
        rule: 'ভূমিকা বা পার্সোনা নির্ধারণ (Persona Framing)',
        explanation: `${targetModelName}-কে বিষয়োপযোগী বিশেষজ্ঞ রোল দিলে উত্তরের গভীরতা বহুগুণ বৃদ্ধি পায়।`,
      },
    ],
    modelSpecificTips: [
      `${targetModelName}-এর জন্য সেরা স্টাইল: ${syntaxStyle}`,
      'কাঙ্ক্ষিত উত্তর না পেলে সরাসরি প্রাসঙ্গিক উদাহরণ চেয়ে নির্দেশ দাও।',
    ],
    optimizedPrompt: {
      title: `${targetModelName}-এর জন্য অপ্টিমাইজড মাস্টার প্রম্পট (${promptFormatBn})`,
      masterPromptEn: enPrompt,
      masterPromptBn: bnPrompt,
      systemInstruction: `You are an elite expert tuned for ${targetModelName}. Always deliver precise, high-value, fluff-free responses with comprehensive reasoning.`,
      outputFormatSpec: syntaxStyle,
    },
    variations: [
      {
        name: 'প্রাকৃতিক অনুচ্ছেদ (প্যারাগ্রাফ স্টাইল)',
        tag: 'প্যারাগ্রাফ',
        prompt: varNarrativePrompt,
      },
      {
        name: 'সরাসরি ও সুনির্দিষ্ট কমান্ড',
        tag: 'সংক্ষিপ্ত',
        prompt: varDirectPrompt,
      },
      {
        name: 'ধাপভিত্তিক রূপরেখা (যখন প্রয়োজন)',
        tag: 'ধাপভিত্তিক',
        prompt: varStructuredPrompt,
      },
    ],
    scores: {
      clarity: 82,
      context: 70,
      constraints: 65,
      roleDefinition: 60,
      overallRawScore: 68,
    },
    thinkingSummary: `এই প্রম্পটটিকে ${targetModelName}-এর জন্য কৃত্রিম বুলেট পয়েন্ট বাদ দিয়ে প্রাকৃতিক ও কার্যকর ফরম্যাটে রূপান্তর করা হয়েছে।`,
    promptFormat: promptFormatBn,
    promptFormatEn: promptFormatEn,
  };

  return deepSanitizeToTumiTomar(rawResult);
}

// 2. Client-Side RTCF Generator Engine
export function synthesizeClientRTCF(
  rawThought: string,
  customFields?: { role?: string; task?: string; context?: string; format?: string }
): RTCFResult {
  const text = rawThought.trim();
  const rawLower = text.toLowerCase();

  const isWebOrApp =
    rawLower.includes('ওয়েবসাইট') ||
    rawLower.includes('website') ||
    rawLower.includes('web') ||
    rawLower.includes('app') ||
    rawLower.includes('react') ||
    rawLower.includes('কোড');

  const isCreative =
    rawLower.includes('গল্প') ||
    rawLower.includes('কবিতা') ||
    rawLower.includes('লেখা') ||
    rawLower.includes('story');

  const isImage =
    rawLower.includes('ছবি') ||
    rawLower.includes('image') ||
    rawLower.includes('photo') ||
    rawLower.includes('চিত্র');

  let defaultRole = 'তুমি একজন অভিজ্ঞ ও বিশ্বমানের সিনিয়র কনসালট্যান্ট ও বিশেষজ্ঞ হিসেবে কাজ করবে।';
  let defaultTask = `তোমার প্রধান দায়িত্ব হলো নিচের কাজটি শতভাগ নিখুঁতভাবে সম্পন্ন করা: "${text || 'প্রদত্ত লক্ষ্য অর্জন'}".`;
  let defaultContext = `ব্যবহারকারী একটি অত্যন্ত প্রফেশনাল ও নির্ভরযোগ্য ফলাফল আশা করছেন। কোনো সাধারণ বা ভাসা-ভাসা উত্তর নয়, বরং সুনির্দিষ্ট ও বাস্তবমুখী তথ্য প্রদান করতে হবে।`;
  let defaultFormat = `সম্পূর্ণ সাবলীল, প্রাঞ্জল ও সুবিন্যস্ত অনুচ্ছেদে উত্তর প্রদান করো। প্রয়োজনীয় ক্ষেত্রে স্পষ্ট কোড বা বাস্তব উদাহরণ উপস্থাপন করো।`;
  let category = 'সাধারণ আর্কিটেকচার';

  if (isWebOrApp) {
    category = 'ফুলস্ট্যাক ওয়েব ডেভেলপমেন্ট';
    defaultRole = 'তুমি একজন প্রিন্সিপাল সফটওয়্যার ইঞ্জিনিয়ার এবং সিনিয়র ফুলস্ট্যাক আর্কিটেক্ট হিসেবে ভূমিকা পালন করবে।';
    defaultTask = `আধুনিক প্রযুক্তি ও বেস্ট প্র্যাকটিস মেনে সম্পূর্ণ কার্যকরী কোড সমাধান প্রস্তুত করো: "${text}".`;
    defaultContext = `কোডটি হতে হবে সম্পূর্ণ রেসপনসিভ, দ্রুত লোডিং এবং সহজে রক্ষণাবেক্ষণযোগ্য। প্রয়োজনীয় সব ফাংশনালিটি এবং এরর হ্যান্ডলিং অন্তর্ভুক্ত থাকতে হবে।`;
    defaultFormat = `প্রথমে আর্কিটেকচার সংক্ষেপে উল্লেখ করে সরাসরি ক্লিন ও কমপ্লিট কোড ব্লক প্রদান করো।`;
  } else if (isCreative) {
    category = 'সৃষ্টিশীল সাহিত্য ও কন্টেন্ট';
    defaultRole = 'তুমি একজন খ্যাতিমান সাহিত্যিক, গল্পকার ও প্রজ্ঞাবান সৃজনশীল লেখক হিসেবে কথা বলবে।';
    defaultTask = `একটি হৃদয়গ্রাহী ও চিত্তাকর্ষক সাহিত্যিক সৃষ্টি রচনা করো: "${text}".`;
    defaultContext = `লেখাটিতে গভীর মানবিক আবেগ, জীবন্ত চিত্রায়ন এবং শব্দের মনকাড়া ছন্দ বজায় থাকতে হবে। কোনো যান্ত্রিক পয়েন্ট ব্যবহার করা যাবে না।`;
    defaultFormat = `ধারাবাহিক আকর্ষণীয় অনুচ্ছেদে সমৃদ্ধ একটি সাহিত্যিক রূপরেখা ও পূর্ণাঙ্গ লেখা।`;
  } else if (isImage) {
    category = 'ভিজ্যুয়াল ও ড্রয়িং প্রম্পট';
    defaultRole = 'তুমি একজন বিশ্বখ্যাত ভিজ্যুয়াল ডিরেক্টর এবং সিনেম্যাটিক ফটোগ্রাফি বিশেষজ্ঞ।';
    defaultTask = `একটি চোখধাঁধানো ও নিখুঁত ইমেজ আর্ট প্রম্পট তৈরি করো: "${text}".`;
    defaultContext = `ছবিতে সঠিক আলোর খেলা (Volumetric Lighting), হাই-রেজ্যুলিউশন টেক্সচার (8K) এবং সিনেম্যাটিক ফ্রেম সেট থাকতে হবে।`;
    defaultFormat = `মিডজার্নি বা ডাল-ই-এর জন্য তৈরি কমা-সেপারেটেড ভিজ্যুয়াল টোকেন ও ক্যামেরা সেটিংস।`;
  }

  const finalRoleBn = customFields?.role?.trim() || defaultRole;
  const finalTaskBn = customFields?.task?.trim() || defaultTask;
  const finalContextBn = customFields?.context?.trim() || defaultContext;
  const finalFormatBn = customFields?.format?.trim() || defaultFormat;

  const result: RTCFResult = {
    roleBn: finalRoleBn,
    taskBn: finalTaskBn,
    contextBn: finalContextBn,
    formatBn: finalFormatBn,
    roleEn: 'Act as a top-tier domain specialist with rigorous standards.',
    taskEn: `Execute with precision: ${text || 'the specified objective'}.`,
    contextEn: 'Target audience demands world-class production quality and practical utility.',
    formatEn: 'Structured, clean, and comprehensive narrative or technical specification.',
    completePromptBn: `【রোল (Role)】\n${finalRoleBn}\n\n【টাস্ক (Task)】\n${finalTaskBn}\n\n【কনটেক্সট (Context)】\n${finalContextBn}\n\n【ফরম্যাট (Format)】\n${finalFormatBn}`,
    completePromptEn: `[Role]\nAct as a top-tier domain specialist with rigorous standards.\n\n[Task]\nExecute with precision: ${text || 'the specified objective'}.\n\n[Context]\nTarget audience demands world-class production quality and practical utility.\n\n[Format]\nStructured, clean, and comprehensive narrative or technical specification.`,
    title: `RTCF মাস্টার প্রম্পট (${category})`,
    category,
    proTips: [
      'রোলকে সুনির্দিষ্ট অভিজ্ঞতার পরিচয় দিলে এআই আরও বুদ্ধিদীপ্ত উত্তর দেয়।',
      'টাস্কে স্পষ্ট লক্ষ্য উল্লেখ থাকলে অপ্রয়োজনীয় ভূমিকা বাদ পড়ে।',
      'ফরম্যাট স্পষ্টভাবে বেঁধে দিলে তোমার পছন্দমতো স্টাইলেই উত্তর পাওয়া যায়।',
    ],
  };

  return deepSanitizeToTumiTomar(result);
}

// 3. Client-Side Text Polisher Engine
export function synthesizeClientPolishedText(
  rawText: string,
  style: PolisherStyleId = 'literary'
): PolishedTextResult {
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

  const result: PolishedTextResult = {
    polishedText: mainText,
    styleName,
    toneSummary: `তোমার কাঁচা কথাটিকে অত্যন্ত আকর্ষণীয় ও হৃদয়গ্রাহী ভাষায় গুছিয়ে রূপান্তর করা হয়েছে যাতে পাঠকমাত্রই মুগ্ধ হয়।`,
    keyHighlights: ['মুগ্ধকর শব্দচয়ন', 'প্রাঞ্জল বাক্যগঠন', 'স্বাভাবিক আবেগের প্রকাশ'],
    variations: [
      {
        styleName: 'সাহিত্যিক ও রসালো রূপ',
        tag: 'সাহিত্যিক',
        text: `শব্দের গহীনে লুকিয়ে থাকা একরাশ নিবিড় অনুভূতি নিয়ে গড়ে উঠেছে এই প্রকাশ: "${trimmed}"। প্রতিটি বাক্যে সুর ও অনুরাগের এক চমৎকার বন্ধন ফুটিয়ে তোলা হয়েছে।`,
      },
      {
        styleName: 'মার্জিত ও প্রভাবশালী রূপ',
        tag: 'মার্জিত',
        text: `সুচিন্তিত ও শ্রদ্ধাপূর্ণ ভাষায় উপস্থাপন: "${trimmed}"—যা যেকোনো ব্যক্তি বা পরিমণ্ডলে তোমার ব্যক্তিত্ব ও ভাবনার গুরুত্বকে বহুলাংশে বাড়িয়ে তুলবে।`,
      },
      {
        styleName: 'আন্তরিক ও হৃদয়স্পর্শী রূপ',
        tag: 'হৃদয়স্পর্শী',
        text: `অকপট মন থেকে উচ্চারিত এক মধুর বার্তা: "${trimmed}"। যেখানে কৃত্রিমতার লেশমাত্র নেই, আছে শুধু হৃদয়ের উষ্ণ ছোঁয়া।`,
      },
    ],
  };

  return deepSanitizeToTumiTomar(result);
}
