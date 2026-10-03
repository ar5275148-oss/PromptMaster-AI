import { SupportedModelId, PromptAnalysisResult, RTCFResult, PolishedTextResult, PolisherStyleId } from '../types';
import { ALL_AI_MODELS } from '../data/modelsData';
import { deepSanitizeToTumiTomar } from './bengaliSanitizer';

// Helper to extract keywords and intent from raw text
function analyzeIntent(rawThought: string) {
  const text = rawThought.trim();
  const lower = text.toLowerCase();

  const isCode =
    lower.includes('কোড') || lower.includes('প্রোগ্রামিং') || lower.includes('code') ||
    lower.includes('python') || lower.includes('javascript') || lower.includes('react') ||
    lower.includes('api') || lower.includes('bug') || lower.includes('html') ||
    lower.includes('css') || lower.includes('sql') || lower.includes('function') ||
    lower.includes('developer') || lower.includes('software');

  const isCreative =
    lower.includes('গল্প') || lower.includes('কবিতা') || lower.includes('নাটক') ||
    lower.includes('সাহিত্য') || lower.includes('গান') || lower.includes('উপন্যাস') ||
    lower.includes('story') || lower.includes('poem') || lower.includes('novel') ||
    lower.includes('চরিত্র') || lower.includes('কল্পনা') || lower.includes('creative');

  const isCommunication =
    lower.includes('চিঠি') || lower.includes('ইমেইল') || lower.includes('মেসেজ') ||
    lower.includes('আবেদন') || lower.includes('দরখাস্ত') || lower.includes('email') ||
    lower.includes('letter') || lower.includes('message') || lower.includes('বক্তৃতা') ||
    lower.includes('প্রস্তাব') || lower.includes('proposal');

  const isBusiness =
    lower.includes('ব্যবসা') || lower.includes('মার্কেটিং') || lower.includes('মার্কেট') ||
    lower.includes('বিক্রি') || lower.includes('সেলস') || lower.includes('কাস্টমার') ||
    lower.includes('business') || lower.includes('startup') || lower.includes('marketing') ||
    lower.includes('brand') || lower.includes('লাভ') || lower.includes('বিনিয়োগ');

  const isStudy =
    lower.includes('পড়াশোনা') || lower.includes('ব্যাখ্যা') || lower.includes('শিখতে') ||
    lower.includes('পড়া') || lower.includes('বিজ্ঞান') || lower.includes('ইতিহাস') ||
    lower.includes('study') || lower.includes('exam') || lower.includes('concept') ||
    lower.includes('সহজ করে');

  const isWorkflow =
    lower.includes('রোডম্যাপ') || lower.includes('পরিকল্পনা') || lower.includes('চেকলিস্ট') ||
    lower.includes('প্ল্যান') || lower.includes('roadmap') || lower.includes('plan') ||
    lower.includes('কৌশল') || lower.includes('রুটিন') || lower.includes('checklist');

  const isMidjourney =
    lower.includes('ছবি') || lower.includes('image') || lower.includes('draw') ||
    lower.includes('ফটোগ্রাফি') || lower.includes('photo') || lower.includes('art') ||
    lower.includes('পেইন্টিং');

  return { isCode, isCreative, isCommunication, isBusiness, isStudy, isWorkflow, isMidjourney, text };
}

// 1. Deep Semantic Client-Side Prompt Architect Engine
export function synthesizeClientPromptArchitect(
  rawThought: string,
  targetModelId: SupportedModelId = 'chatgpt',
  _goal: string = 'general',
  _tone: string = 'expert',
  requestedFormat: string = 'auto'
): PromptAnalysisResult {
  const modelObj = ALL_AI_MODELS.find((m) => m.id === targetModelId) || ALL_AI_MODELS[0];
  const targetModelName = modelObj.name;
  const { isCode, isCreative, isCommunication, isBusiness, isStudy, isWorkflow, isMidjourney, text } = analyzeIntent(rawThought);

  let promptFormatBn = 'গভীর বিশ্লেষণধর্মী প্রাঞ্জল অনুচ্ছেদ';
  let promptFormatEn = 'Comprehensive Analytical Narrative';
  let syntaxStyle = 'সাবলীল ধারাবাহিক গদ্য ও গভীর কার্যকারণ';

  let enPrompt = '';
  let bnPrompt = '';
  let varNarrativePrompt = '';
  let varDirectPrompt = '';
  let varStructuredPrompt = '';

  let flaws = [
    {
      title: 'নির্দিষ্ট প্রেক্ষাপট ও লক্ষ্যের অস্পষ্টতা',
      description: 'কাঁচা ভাবনায় কাজের মূল প্রেক্ষাপট, টার্গেট অডিয়েন্স ও সাফল্যের মানদণ্ড অনুপস্থিত ছিল।',
    },
    {
      title: 'সীমা ও গুণগত মানদণ্ডের ঘাটতি',
      description: 'এআই যাতে বাঁধাধরা ক্লিশে বা ভাসাভাসা উত্তর না দিয়ে বাস্তবমুখী উদাহরণসহ গভীর সমাধান দেয়, সেই নিয়ন্ত্রণ ছিল না।',
    },
  ];

  let missingContext = [
    'নির্দিষ্ট উদ্দেশ্য এবং ব্যবহারের ক্ষেত্র',
    'কাঙ্ক্ষিত গভীরতা ও বাস্তব উদাহরণের প্রয়োজনীয়তা',
    'যেসব সাধারণ ভুল পরিহার করতে হবে',
  ];

  let guidelines = [
    {
      rule: 'পার্সোনা ও এক্সপার্ট মাইন্ডসেট ফ্রেইমিং',
      explanation: `${targetModelName}-কে বিশেষায়িত ভূমিকা দিলে সে সাধারণ সারসংক্ষেপ না দিয়ে অভিজ্ঞ পরামর্শকের মতো চিন্তা করে।`,
    },
    {
      rule: 'ধাপভিত্তিক কার্যকারণ ও সমাধান বিশ্লেষণ',
      explanation: 'শুধু তথ্য না চেয়ে সমাধানের পেছনের যুক্তি ও সম্ভাব্য ঝুঁকি তুলে ধরার নির্দেশ দিলে উত্তরের মান ৫ গুণ বৃদ্ধি পায়।',
    },
  ];

  let modelTips = [
    `${targetModelName}-এর জন্য সেরা পদ্ধতি: শুরুতে পরিষ্কার ভূমিকা ও গভীর প্রেক্ষাপট উল্লেখ করা।`,
    'উত্তরে অপ্রয়োজনীয় ভূমিকা বা কৃত্রিম ভদ্রতা পরিহার করতে সরাসরি নির্দেশ দাও।',
  ];

  if (isMidjourney || targetModelId === 'midjourney') {
    promptFormatBn = 'সিনেম্যাটিক ভিজ্যুয়াল প্রম্পট টোকেন';
    promptFormatEn = 'Cinematic Visual Spec';
    syntaxStyle = 'টোকেন ও কমা-বিভাজিত প্যারামিটার (নো বুলেট)';

    enPrompt = `Ultra-detailed cinematic photograph of ${text}, 8k resolution, photorealistic textures, dramatic volumetric lighting, captured on 85mm f/1.4 lens, shallow depth of field, vivid color grading, unreal engine 5 render, hyper-detailed atmosphere --ar 16:9 --style raw --v 6.1`;
    bnPrompt = `সিনেম্যাটিক মাস্টারপিস ফটোগ্রাফি, ৮k রেজ্যুলিউশন, ড্রামাটিক স্টুডিও আলোকসম্পাত, বিষয়বস্তু: ${text}, ৮৫ মিমি পোর্ট্রেট লেন্স, অগভীর ডেপথ অফ ফিল্ড, অত্যন্ত সূক্ষ্ম টেক্সচার, নিখুঁত কালার গ্রেডিং, অত্যন্ত বাস্তবসম্মত ৩ডি ভিজ্যুয়াল --ar 16:9`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `Cinematic 8k shot of ${text}, photorealistic, dramatic studio lighting, 85mm lens --ar 16:9`;
    varStructuredPrompt = `Subject: ${text}\nStyle: Cinematic Realism 8K\nLighting: Warm dramatic rim lighting\nCamera: 85mm f/1.4\nParameters: --ar 16:9 --v 6.1`;
  } else if (isCode || targetModelId === 'copilot') {
    promptFormatBn = 'প্রোডাকশন-গ্রেড আর্কিটেকচারাল কোড স্পেসিফিকেশন';
    promptFormatEn = 'Production-Grade Architecture Spec';
    syntaxStyle = 'কারিগরি স্পেক, টাইপ-সেফ কোড ও এরর হ্যান্ডলিং';

    enPrompt = `You are a Principal Software Architect and Senior Systems Engineer.
Your task is to provide an elite, production-ready solution for the following requirement:
"""
${text}
"""

Please execute with the following strict engineering standards:
1. Architecture & Design: Use clean architecture, strong type safety, modular component/function separation, and follow idiomatic best practices.
2. Complete Implementation: Provide fully functional, complete code without placeholders, dummy stubs, or "TODO" comments for critical logic.
3. Edge Cases & Reliability: Handle corner cases, graceful error handling, boundary validation, and performance bottlenecks.
4. Production Quality: Keep explanations minimal and technical; focus on the concrete, copy-paste ready code with concise inline comments explaining non-trivial logic.`;

    bnPrompt = `তুমি একজন প্রিন্সিপাল সফটওয়্যার আর্কিটেক্ট ও অভিজ্ঞ সিনিয়র ইঞ্জিনিয়ার হিসেবে কাজ করবে।
তোমার দায়িত্ব হলো নিচের সমস্যা/চাহিদাটির জন্য একটি সম্পূর্ণ প্রোডাকশন-রেডি ও ত্রুটিমুক্ত আর্কিটেকচারাল সমাধান প্রদান করা:
"""
${text}
"""

সমাধান তৈরির সময় নিচের নীতিগুলো কঠোরভাবে অনুসরণ করো:
১. পরিচ্ছন্ন আর্কিটেকচার: কোডটি সম্পূর্ণ টাইপ-সেফ, মডুলার এবং আধুনিক বেস্ট প্র্যাকটিস মেনে সাজাও।
২. বাস্তবায়ন সম্পূর্ণতা: কোনো অসম্পূর্ণ লজিক বা ডামি কোড রাখবে না; বাস্তব ব্যবহারের উপযোগী পূর্ণাঙ্গ কোড ব্লক দাও।
৩. এরর ও এজ-কেস হ্যান্ডলিং: সম্ভাব্য ব্যতিক্রম, ডেটা ভ্যালিডেশন এবং পারফরম্যান্স ঝুঁকিগুলো কোডেই হ্যান্ডেল করো।
৪. অপ্রয়োজনীয় তত্ত্ব বাদ দাও: দীর্ঘ তাত্ত্বিক আলোচনার পরিবর্তে সরাসরি কার্যকর কোড ও দরকারি ইনলাইন কমেন্ট দাও।`;

    varNarrativePrompt = `একজন অভিজ্ঞ সফটওয়্যার আর্কিটেক্টের মতো চিন্তা করো। "${text}"-এর জন্য সবচেয়ে পরিচ্ছন্ন ও কার্যকর কোড ডিজাইন কী হবে তা বাস্তব উদাহরণ সহ কোডে তুলে ধরো।`;
    varDirectPrompt = `Write clean, production-ready, fully typed code for: "${text}". Include edge-case handling and zero boilerplate filler.`;
    varStructuredPrompt = `ধাপ ১: কোর আর্কিটেকচার ও ডেটা মডেল\nধাপ ২: পূর্ণাঙ্গ ইমপ্লিমেন্টেশন কোড\nধাপ ৩: টেস্ট কেস ও এরর হ্যান্ডলিং\n\nএই ৩টি অংশে "${text}" সম্পূর্ণ করো।`;
  } else if (isCreative) {
    promptFormatBn = 'সাবলীল সাহিত্যিক আখ্যান ও চরিত্র মনস্তত্ত্ব';
    promptFormatEn = 'Immersive Literary Narrative';
    syntaxStyle = 'ধারাবাহিক সৃষ্টিশীল কথাসাহিত্য (কোনো যান্ত্রিক পয়েন্ট ছাড়া)';

    enPrompt = `You are an acclaimed novelist, master storyteller, and literary essayist.
Your creative objective:
"""
${text}
"""

Writing Directives:
- Continuous Flow: Write in evocative, seamless paragraphs. Do NOT use mechanical bullet points or artificial numbered lists.
- Sensory Immersion: Build rich atmosphere using sight, sound, touch, and scent to ground the reader deeply into the scene.
- Psychological Depth: Capture nuanced human emotions, unspoken conflicts, and realistic dialogue or internal monologue.
- Eloquent Tone: Use rich, varied sentence rhythms that keep the reader spellbound from the opening sentence to the final lingering thought.`;

    bnPrompt = `তুমি একজন খ্যাতিমান কথাশিল্পী, সিদ্ধহস্ত ঔপন্যাসিক ও সংবেদনশীল সাহিত্যিক হিসেবে লিখবে।
তোমার সাহিত্যিক লক্ষ্য:
"""
${text}
"""

রচনার কঠোর নিয়মাবলি:
- কোনো যান্ত্রিক পয়েন্ট বা ১, ২, ৩ তালিকা ব্যবহার করবে না। সম্পূর্ণ লেখাটি সাবলীল, প্রাঞ্জল ও টানা অনুচ্ছেদে সাজাও।
- পরিবেশ ও আবহ: ইন্দ্রিয়গ্রাহ্য অনুভূতির (দৃশ্য, শব্দ, গন্ধ, অনুভূতি) নিখুঁত ছোঁয়ায় পাঠককে দৃশ্যের ভেতর টেনে নাও।
- মানসিক টানাপোড়েন: চরিত্রের সূক্ষ্ম আবেগ, দ্বিধা ও অনুচ্চারিত অনুভূতির বাস্তব রূপ দাও।
- ভাষার ছন্দ: প্রতিটি বাক্যে স্বাভাবিক গতি ও সাহিত্যিক মাধুর্য বজায় রাখো, যাতে লেখাটি পাঠকের মনে দীর্ঘস্থায়ী দাগ কাটে।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `একটি অত্যন্ত হৃদয়গ্রাহী ও শক্তিশালী ভাষায় নিচের প্রেক্ষাপট নিয়ে গল্প/সাহিত্য রচনা করো: "${text}". কোনো অপ্রয়োজনীয় ভূমিকা ছাড়া সরাসরি শুরু করো।`;
    varStructuredPrompt = `দৃশ্যপট ১: সূচনা ও অন্তর্নিহিত দ্বন্দ্ব\nদৃশ্যপট ২: তীব্র মানসিক ঘাত-প্রতিঘাত\nদৃশ্যপট ৩: চরম মুহূর্ত ও দার্শনিক উপলব্ধি\n\nএই ৩টি দৃশ্যে "${text}" রূপায়ণ করো।`;
  } else if (isBusiness) {
    promptFormatBn = 'কৌশলগত বিজনেস ব্লুপ্রিন্ট ও মার্কেট ফ্রেমওয়ার্ক';
    promptFormatEn = 'Strategic Business Blueprint';
    syntaxStyle = 'কার্যকর বিজনেস স্ট্র্যাটেজি ও বাস্তব রোডম্যাপ';

    enPrompt = `You are a Tier-1 Management Consultant and Growth Strategist (McKinsey / Sequoia background).
Your objective is to build an authoritative, high-impact business strategy for:
"""
${text}
"""

Core Strategic Requirements:
1. Problem & Value Proposition: Clearly identify the core bottleneck, market opportunity, and differentiated value proposition.
2. Actionable Execution Plan: Provide realistic, prioritized action items that drive measurable ROI and customer acquisition.
3. Risk & Mitigation: Identify non-obvious operational, financial, and competitive risks with concrete countermeasures.
4. Fluff-Free Tone: Deliver high-signal, decisive, data-driven recommendations without generic business buzzwords.`;

    bnPrompt = `তুমি একজন শীর্ষস্থানীয় ম্যানেজমেন্ট কনসালট্যান্ট ও সফল বিজনেস স্ট্র্যাটেজিস্ট হিসেবে পরামর্শ দেবে।
তোমার দায়িত্ব হলো নিচের বিষয়ে একটি বাস্তবমুখী, কৌশলগত ও চূড়ান্ত সফলতার বিজনেস ফ্রেমওয়ার্ক তৈরি করা:
"""
${text}
"""

পরামর্শ প্রদানের আবশ্যিক শর্ত:
১. আসল সমস্যা ও সুযোগ: ভাসাভাসা আলোচনা না করে মূল সংকট, বাজার চাহিদা ও গ্রাহকের কাছে পৌঁছানোর শক্তিশালী দিকগুলো তুলে ধরো।
২. কার্যকর কর্মপরিকল্পনা: এমন পদক্ষেপ দাও যা বাস্তব জীবনে সরাসরি প্রয়োগ করে সেলস, গ্রহণযোগ্যতা বা প্রবৃদ্ধি নিশ্চিত করা যায়।
৩. সম্ভাব্য ঝুঁকি ও সতর্কতা: যেসব গোপন কারণে প্রজেক্টে ব্যর্থতা বা লোকসান হতে পারে, তা চিহ্নিত করে আগাম সমাধানের পথ দেখাও।
৪. বাস্তবসম্মত ভাষা: কোনো গৎবাঁধা কথার ফুলঝুরি নয়; সোজাসাপ্টা, তথ্যবহুল ও কার্যকর দিকনির্দেশনা প্রদান করো।`;

    varNarrativePrompt = `একজন ঝানু উদ্যোক্তা হিসেবে বাস্তব অভিজ্ঞতার আলোকে বিশ্লেষণ করো: "${text}"। কেন এটি সফল হবে এবং সবচেয়ে বড় বাধাগুলো কীভাবে অতিক্রম করতে হবে তা বুঝিয়ে বলো।`;
    varDirectPrompt = `সবচেয়ে গুরুত্বপূর্ণ ৩টি কৌশল ও অবিলম্বে করণীয় পদক্ষেপ সহ সংক্ষেপে দিকনির্দেশনা দাও: "${text}".`;
    varStructuredPrompt = `পর্যায় ১: মার্কেট ভ্যালিডেশন ও কোর অফার\nপর্যায় ২: গ্রাহক সংগ্রহ ও প্রচার কৌশল\nপর্যায় ৩: ঝুঁকি ব্যবস্থাপনা ও দীর্ঘমেয়াদী স্থায়িত্ব\n\nএই ৩ ধাপে "${text}" সমাধান করো।`;
  } else if (isCommunication) {
    promptFormatBn = 'মার্জিত পরিস্থিতি-ভিত্তিক যোগাযোগ বার্তা';
    promptFormatEn = 'High-Impact Executive Communication';
    syntaxStyle = 'আন্তরিক, আত্মবিশ্বাসী ও প্রাঞ্জল অনুচ্ছেদ';

    enPrompt = `You are a Master Executive Communication Strategist and High-Stakes Negotiator.
Your mission is to compose a compelling, perfectly calibrated message for:
"""
${text}
"""

Tone & Structure Directives:
- Emotional Intelligence: Calibrate the tone to build high mutual trust, deep respect, and clarity without sounding aggressive or submissive.
- Unambiguous Core Message: State the core purpose naturally and memorably within the first two sentences.
- Frictionless Call-to-Action: Conclude with a clear, gentle next step that makes it effortless for the recipient to respond positively.
- Continuous Flow: Present this as an authentic, polished piece of correspondence without robotic bullet points.`;

    bnPrompt = `তুমি একজন অভিজ্ঞ যোগাযোগ বিশেষজ্ঞ ও দক্ষ মধ্যস্থতাকারী হিসেবে লিখবে।
তোমার লক্ষ্য হলো নিচের প্রসঙ্গের জন্য একটি অত্যন্ত মার্জিত, আত্মবিশ্বাসী ও মন জয় করার মতো বার্তা তৈরি করা:
"""
${text}
"""

বার্তার গুণগত বৈশিষ্ট্য:
- আন্তরিক ও স্পষ্ট ভাষা: বার্তাটির প্রতিটি শব্দে আন্তরিকতা ও আত্মমর্যাদা বজায় রাখো, যাতে প্রাপকের মনে বিশ্বাস ও ইতিবাচক মনোভাব জন্মায়।
- মূল বক্তব্যের স্পষ্টতা: প্রথম ১-২ লাইনের মধ্যেই মূল উদ্দেশ্য প্রাঞ্জলভাবে তুলে ধরো, যাতে কোনো ভুল বোঝাবুঝি না থাকে।
- স্পষ্ট ভবিষ্যৎ পদক্ষেপ: বার্তার শেষে এমন একটি সুন্দর আহ্বান জানাও, যাতে প্রাপক সহজেই সাড়া দিতে পারেন।
- সাবলীল বিন্যাস: কোনো কৃত্রিম তালিকা বা ফরমাল শুষ্কতা ছাড়া স্বাভাবিক ও হৃদয়গ্রাহী অনুচ্ছেদে চিঠি/বার্তাটি প্রস্তুত করো।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `অত্যন্ত বিনয়ী ও সরাসরি ভাষায় নিচের বিষয়ে একটি কার্যকরী বার্তা প্রস্তুত করো: "${text}".`;
    varStructuredPrompt = `ভূমিকা ও উদ্দেশ্য ➔ মূল যুক্তি ও প্রাসঙ্গিক প্রেক্ষাপট ➔ চূড়ান্ত আহ্বান ও সৌজন্য\n\nএই কাঠামোর ভিত্তিতে "${text}" সম্পন্ন করো।`;
  } else if (isStudy) {
    promptFormatBn = 'গভীর নীতিগত ব্যাখ্যা ও বাস্তব সাদৃশ্য';
    promptFormatEn = 'First-Principles Conceptual Explanation';
    syntaxStyle = 'প্রাঞ্জল অনুচ্ছেদ ও বাস্তব জীবনের দৃষ্টান্ত';

    enPrompt = `You are a world-renowned educator and cognitive scientist (Feynman technique specialist).
Your mission is to unpack and explain the following concept with breathtaking clarity:
"""
${text}
"""

Pedagogical Directives:
1. First Principles: Demystify the concept from its foundational mechanics. Why does it exist, and how does it fundamentally work?
2. Intuitive Everyday Analogy: Use an unforgettable, vivid real-world analogy to make abstract ideas instantly click.
3. Common Misconceptions: Expose the frequent pitfalls or misunderstandings people hold about this topic and resolve them.
4. Deep Insight: Write in engaging, articulate prose that inspires genuine curiosity and profound comprehension.`;

    bnPrompt = `তুমি একজন জগৎখ্যাত শিক্ষক ও বিজ্ঞানী (রিচার্ড ফাইনম্যানের সহজ ব্যাখ্যা কৌশলে দক্ষ)।
তোমার লক্ষ্য হলো নিচের বিষয়টি এমনভাবে বুঝিয়ে দেওয়া যাতে যেকেউ সহজে ও স্থায়ীভাবে এর মূল রহস্য বুঝতে পারে:
"""
${text}
"""

ব্যাখ্যার বিশেষ নিয়মাবলি:
১. মূল ভিত্তি বা রুট কজ: বিষয়টি কী এবং কেন এটি এমনভাবে কাজ করে, তা গোড়া থেকে যৌক্তিকভাবে ব্যাখ্যা করো।
২. বাস্তব জীবনের উপমা: দৈনন্দিন জীবনের এমন একটি চমৎকার রূপক বা সাদৃশ্য ব্যবহার করো, যাতে বিমূর্ত ধারণাটি মুহূর্তেই চোখের সামনে স্পষ্ট হয়ে ওঠে।
৩. প্রচলিত ভুল ধারণা দূরীকরণ: মানুষ এই বিষয়ে সাধারণত কী কী ভুল বোঝে, তা ধরিয়ে দিয়ে সঠিক তথ্য তুলে ধরো।
৪. আকর্ষণীয় প্রাঞ্জল ভাষা: কোনো শুষ্ক মুখস্থ বিদ্যার মতো নয়; পড়ার আনন্দ জাগিয়ে তোলে এমন স্বাভাবিক ও গভীর অনুচ্ছেদে বর্ণনা করো।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `সবচেয়ে সহজ ভাষায় একটি চমৎকার বাস্তব উদাহরণের সাহায্যে বুঝিয়ে বলো: "${text}".`;
    varStructuredPrompt = `উৎস ও মূল তত্ত্ব ➔ বাস্তব জীবনের উদাহরণ ➔ প্রায়োগিক গুরুত্ব\n\nএই ৩টি ধাপে "${text}" বুঝিয়ে দাও।`;
  } else {
    promptFormatBn = 'সার্বজনীন মাস্টার আর্কিটেকচারাল প্রম্পট';
    promptFormatEn = 'Universal Master Diagnostic Prompt';
    syntaxStyle = 'উন্নত উদ্দেশ্য বিশ্লেষণ ও কার্যকর সমাধান কাঠামো';

    enPrompt = `You are an elite subject-matter authority and strategic advisor.
Your objective is to provide a master-level, deeply reasoned, and definitive analysis for:
"""
${text}
"""

Execution Framework:
1. Holistic Comprehension: Unpack the underlying dimensions, hidden complexities, and essential background of this challenge.
2. Pragmatic Guidance: Provide specific, high-leverage solutions and concrete advice tailored for real-world excellence.
3. Edge Cases & Anti-Goals: Explicitly warn against common mistakes, shallow answers, or ineffective approaches.
4. Clarity & Polish: Present your answer with exceptional clarity, authoritative reasoning, and engaging depth.`;

    bnPrompt = `তুমি একজন শীর্ষস্থানীয় বিশেষজ্ঞ ও অভিজ্ঞ পরামর্শক হিসেবে কাজ করবে।
তোমার দায়িত্ব হলো নিচের চিন্তা/সমস্যার ওপর একটি গভীর, প্রজ্ঞাপূর্ণ এবং চূড়ান্ত কার্যকরী বিশ্লেষণ ও সমাধান প্রদান করা:
"""
${text}
"""

উত্তর প্রদানের কাঠামো:
১. সামগ্রিক প্রেক্ষাপট বিশ্লেষণ: বিষয়ের ভেতরের জটিলতা ও মূল লক্ষ্য গভীরভাবে অনুধাবন করে আলোচনা শুরু করো।
২. বাস্তবমুখী ও সুনির্দিষ্ট সমাধান: সাধারণ বা ভাসাভাসা কথার বদলে এমন কার্যকরী দিকনির্দেশনা দাও যা বাস্তব জীবনে সরাসরি সেরা ফল এনে দেয়।
৩. যা পরিহার করতে হবে: সাধারণ মানুষ এই বিষয়ে কী ধরনের ভুল বা ভুল সিদ্ধান্ত নেয়, তা ধরিয়ে দিয়ে সতর্ক করো।
৪. ভাষার গভীরতা: সম্পূর্ণ মার্জিত, সুশৃঙ্খল ও বুদ্ধিদীপ্ত ভাষায় তোমার বিশ্লেষণ প্রকাশ করো।`;

    varNarrativePrompt = bnPrompt;
    varDirectPrompt = `সরাসরি সবচেয়ে কার্যকর ও বুদ্ধিদীপ্ত সমাধান তুলে ধরো: "${text}". কোনো ভাসাভাসা কথা ছাড়া মূল পয়েন্টে কথা বলো।`;
    varStructuredPrompt = `প্রেক্ষাপট ও আসল সমস্যা ➔ সমাধান ও করণীয় ➔ সতর্কতা ও সাফল্য নিশ্চিতকরণ\n\nএই ৩টি ধাপে "${text}" রূপায়ণ করো।`;
  }

  const rawResult: PromptAnalysisResult = {
    flaws,
    missingContext,
    guidelines,
    modelSpecificTips: modelTips,
    optimizedPrompt: {
      title: `${targetModelName}-এর জন্য তৈরি চূড়ান্ত মাস্টার প্রম্পট`,
      masterPromptEn: enPrompt,
      masterPromptBn: bnPrompt,
      systemInstruction: `You are an elite expert tuned for ${targetModelName}. Always deliver deeply reasoned, high-value, fluff-free responses with comprehensive insight.`,
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
      clarity: 88,
      context: 80,
      constraints: 75,
      roleDefinition: 70,
      overallRawScore: 78,
    },
    thinkingSummary: `এই প্রম্পটটিকে ${targetModelName}-এর জন্য বিশেষায়িত করে গভীর প্রেক্ষাপট, বাস্তবমুখী দিকনির্দেশনা ও সর্বোচ্চ মানের ফ্রেমওয়ার্কে রূপান্তর করা হয়েছে।`,
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
  const { isCode, isCreative, isCommunication, isBusiness } = analyzeIntent(text);

  let roleBn = 'অভিজ্ঞ উপদেষ্টা ও বিশ্লেষক';
  let roleEn = 'Senior Strategic Advisor & Domain Specialist';
  let taskBn = text ? `"${text}" সংক্রান্ত বিষয়ের সম্পূর্ণ বিশ্লেষণ এবং কার্যকর সমাধান তৈরি করা` : 'নির্দিষ্ট বিষয়ের ওপর কার্যকর দিকনির্দেশনা প্রণয়ন';
  let taskEn = text ? `Deliver a comprehensive strategy and actionable roadmap for: ${text}` : 'Develop an actionable roadmap';
  let contextBn = 'বাস্তব জীবনের জটিলতা মাথায় রেখে সাধারণ ভাসাভাসা উত্তরের বদলে গভীর ও সুনির্দিষ্ট দিকনির্দেশনা প্রয়োজন';
  let contextEn = 'Context requires deep, production-ready, and non-generic insight tailored for high-stakes execution';
  let formatBn = 'ধারাবাহিক প্রাঞ্জল অনুচ্ছেদ ও সুনির্দিষ্ট কর্মপরিকল্পনা';
  let formatEn = 'Structured narrative prose with clear prioritized action steps';

  if (isCode) {
    roleBn = 'প্রিন্সিপাল সফটওয়্যার আর্কিটেক্ট ও টেকনিক্যাল লিড';
    roleEn = 'Principal Software Architect & Systems Engineer';
    taskBn = `"${text}"-এর জন্য একটি স্কেলেবল, বাগ-মুক্ত ও টাইপ-সেফ কোড আর্কিটেকচার তৈরি করো`;
    taskEn = `Architect and implement a robust, production-grade, type-safe implementation for: ${text}`;
    contextBn = 'কোডটি বাস্তব প্রোডাকশনে ব্যবহার হবে, তাই এরর হ্যান্ডলিং ও মডুলারিটি অত্যন্ত গুরুত্বপূর্ণ';
    contextEn = 'Solution is intended for production deployment; clean architecture and error resiliency are paramount';
    formatBn = 'কোর আর্কিটেকচার, পূর্ণাঙ্গ কোড ব্লক ও সংক্ষেপে ইনলাইন ব্যাখ্যা';
    formatEn = 'Clean architecture specification followed by fully functional code blocks and inline comments';
  } else if (isCreative) {
    roleBn = 'প্রথিতযশা কথাশিল্পী ও সৃষ্টিশীল সাহিত্যিক';
    roleEn = 'Acclaimed Storyteller & Literary Author';
    taskBn = `"${text}" বিষয়ের ওপর একটি ইন্দ্রিয়গ্রাহ্য ও হৃদয়গ্রাহী আখ্যান রচনা করো`;
    taskEn = `Write an emotionally resonant, atmospheric narrative exploring: ${text}`;
    contextBn = 'গল্পে কোনো কৃত্রিম বুলেট পয়েন্ট ছাড়া স্বাভাবিক ও মানবিক আবেগ ফুটিয়ে তুলতে হবে';
    contextEn = 'Continuous literary prose without robotic lists, prioritizing subtext and sensory immersion';
    formatBn = 'টানা সাহিত্যিক অনুচ্ছেদ ও জীবন্ত চরিত্র মনস্তত্ত্ব';
    formatEn = 'Fluid narrative prose with organic dialogue and vivid environmental atmosphere';
  } else if (isBusiness) {
    roleBn = 'ম্যানেজমেন্ট কনসালট্যান্ট ও বিজনেস গ্রোথ স্ট্র্যাটেজিস্ট';
    roleEn = 'Tier-1 Management Consultant & Growth Strategist';
    taskBn = `"${text}"-এর জন্য সর্বোচ্চ আরওআই ও গ্রাহক আকর্ষণের সফল কৌশল প্রণয়ন করো`;
    taskEn = `Formulate an actionable market execution framework and risk mitigation plan for: ${text}`;
    contextBn = 'বাজেট ও সময়ের সঠিক ব্যবহার করে বাজারে দ্রুত গ্রহণযোগ্যতা অর্জন করাই মূল লক্ষ্য';
    contextEn = 'Focus is rapid market validation, operational feasibility, and tangible revenue growth';
    formatBn = 'কৌশলগত ব্লুপ্রিন্ট, প্রধান মাইলফলক ও প্রতিরোধযোগ্য ঝুঁকির তালিকা';
    formatEn = 'Strategic framework highlighting core opportunity, execution phases, and risk safeguards';
  }

  if (customFields) {
    if (customFields.role) roleBn = customFields.role;
    if (customFields.task) taskBn = customFields.task;
    if (customFields.context) contextBn = customFields.context;
    if (customFields.format) formatBn = customFields.format;
  }

  const completeBn = `[ভূমিকা/Role]: তুমি ${roleBn} হিসেবে কাজ করবে।
[কাজ/Task]: তোমার মূল কাজ হলো: ${taskBn}।
[প্রেক্ষাপট/Context]: ${contextBn}।
[ফরম্যাট/Format]: ${formatBn}। কোনো অপ্রয়োজনীয় কৃত্রিম ভূমিকা ছাড়া সরাসরি কার্যকর সমাধান প্রদান করো।`;

  const completeEn = `[Role]: Act as ${roleEn}.
[Task]: Your primary mission is to: ${taskEn}.
[Context]: ${contextEn}.
[Format]: Deliver in the following structure: ${formatEn}. Avoid generic filler; provide decisive, expert-level depth.`;

  return deepSanitizeToTumiTomar({
    title: text ? `RTCF: ${text.slice(0, 30)}...` : 'RTCF মাস্টার প্রম্পট ফ্রেমওয়ার্ক',
    category: isCode ? 'কোডিং ও কারিগরি' : isBusiness ? 'ব্যবসা ও ক্যারিয়ার' : isCreative ? 'সৃষ্টিশীল লেখা' : 'সার্বজনীন চিন্তা',
    roleBn,
    roleEn,
    taskBn,
    taskEn,
    contextBn,
    contextEn,
    formatBn,
    formatEn,
    completePromptBn: completeBn,
    completePromptEn: completeEn,
    proTips: [
      'RTCF ফ্রেমওয়ার্ক ব্যবহার করলে এআই নিজের ইচ্ছামতো না ঘুরে তোমার দেওয়া চরিত্রে নির্দিষ্টভাবে কাজ করে।',
      'প্রয়োজনে [প্রেক্ষাপট]-এর ভেতর তোমার নিজস্ব বাজেট, সময়সীমা বা প্রযুক্তি যুক্ত করে আরও তীক্ষ্ণ করো।',
    ],
  });
}

// 3. Client-Side Text Polisher Engine
export function synthesizeClientPolishedText(
  rawText: string,
  style: PolisherStyleId = 'literary'
): PolishedTextResult {
  const text = rawText.trim();
  let styleName = 'সাহিত্যিক ও মনোমুগ্ধকর';
  let toneSummary = 'গভীর ভাবগাম্ভীর্য, আবেগ ও মার্জিত শব্দের অনুপম রূপায়ণ';
  let polished = text;

  if (style === 'eloquent') {
    styleName = 'মার্জিত ও প্রভাবশালী';
    toneSummary = 'সুনির্দিষ্ট, আত্মবিশ্বাসী ও প্রাতিষ্ঠানিক উপস্থাপন';
    polished = `অত্যন্ত আন্তরিকতা ও শ্রদ্ধার সাথে বিষয়টি তুলে ধরছি। ${text}—এই প্রেক্ষিতে আমাদের সার্বিক মূল্যায়ন হলো, সুপরিকল্পিত পদক্ষেপ ও সময়োপযোগী সমন্বয়ের মাধ্যমে আমরা সর্বোচ্চ ফলাফল নিশ্চিত করতে পারব। তোমার সুচিন্তিত মতামত আমাদের পরবর্তী কর্মপন্থা নির্ধারণে সহায়ক হবে।`;
  } else if (style === 'heartfelt') {
    styleName = 'আন্তরিক ও হৃদয়স্পর্শী';
    toneSummary = 'উষ্ণ, প্রাণবন্ত ও মন ছুঁয়ে যাওয়া আন্তরিক ভাষা';
    polished = `মনে হচ্ছিল এই সুন্দর ভাবনাটি তোমার সাথে একটু ভাগ করে নিই! ${text}। সত্যি বলতে, মনের মধ্যে যখন কোনো সুন্দর উপলব্ধি বা অনুভূতি আসে, তা আপন মানুষের সাথে কথা বলে আরও মধুর হয়ে ওঠে। তুমি বিষয়টি নিয়ে কী ভাবছো?`;
  } else if (style === 'punchy') {
    styleName = 'সংক্ষিপ্ত ও ধারালো';
    toneSummary = 'অপ্রয়োজনীয় শব্দের ছাঁটাই, সরাসরি ও তীক্ষ্ণ তথ্য';
    polished = `মূল বিষয়বস্তুর স্পষ্ট সারসংক্ষেপ:\n• সারমর্ম: ${text}\n• মূল লক্ষ্য: কোনো দীর্ঘ ভূমিকা ছাড়াই সরাসরি কার্যকারিতা নিশ্চিতকরণ\n• করণীয়: অবিলম্বে সুনির্দিষ্ট পদক্ষেপ গ্রহণ।`;
  } else if (style === 'inspirational') {
    styleName = 'অনুপ্রেরণামূলক ও উদ্দীপক';
    toneSummary = 'প্রত্যয়ী যুক্তি, আকর্ষণীয় সুর ও তাৎক্ষণিক উদ্যম সৃষ্টির ক্ষমতা';
    polished = `একটু গভীরভাবে ভাবলে স্পষ্ট বোঝা যায়, বিষয়টির গুরুত্ব কতটা সুদূরপ্রসারী! ${text}। এটি কেবল একটি সাধারণ চিন্তা নয়, বরং সঠিক সময়ে সঠিক সিদ্ধান্তের মাধ্যমে অভূতপূর্ব পরিবর্তন আনার একটি অনন্য সুযোগ। এখনই এই সম্ভাবনাকে কাজে লাগিয়ে এগিয়ে যাওয়া প্রয়োজন।`;
  } else if (style === 'lucid') {
    styleName = 'সহজ-সরল ও প্রাঞ্জল';
    toneSummary = 'অত্যন্ত সহজবোধ্য, সাবলীল ও স্পষ্ট প্রকাশ';
    polished = `সহজ ভাষায় বলতে গেলে: ${text}। এখানে জটিল কোনো তত্ত্ব নেই; বিষয়টির মূল সুর হলো খুব স্বাভাবিকভাবে কাজটি সম্পন্ন করা এবং ইতিবাচক ফল পাওয়া।`;
  } else {
    // literary
    styleName = 'সাহিত্যিক ও রসালো';
    toneSummary = 'গভীর অনুভূতি, চিত্রকল্প ও স্নিগ্ধ নান্দনিকতা';
    polished = `শব্দের মায়াজালে প্রতিটি অনুভূতির এক চিরন্তন প্রকাশ থাকে। ${text}—এই অনুভূতির প্রতিটি ভাঁজে লুকিয়ে আছে এক গভীর জীবনবোধ ও স্নিগ্ধতা। যখন এলোমেলো চিন্তাগুলো একটি সুন্দর ছন্দে ধরা দেয়, তখন সাধারণ কথাও হয়ে ওঠে আশ্চর্য রকমের জীবন্ত ও চিরভাস্বর।`;
  }

  return deepSanitizeToTumiTomar({
    polishedText: polished,
    styleName,
    toneSummary,
    keyHighlights: [
      'ভাষার কৃত্রিমতা দূর করে প্রাঞ্জল ও আকর্ষণীয় শব্দচয়ন করা হয়েছে।',
      'বক্তব্যের মূল সুর অক্ষুণ্ন রেখে সাহিত্যিক ও প্রাসঙ্গিক মাধুর্য যোগ করা হয়েছে।',
      'প্রতিটি বাক্যে মার্জিত ও আত্মবিশ্বাসী ভাব ফুটিয়ে তোলা হয়েছে।',
    ],
    variations: [
      { 
        styleName: 'গভীর ভাবগাম্ভীর্য', 
        tag: 'গম্ভীর', 
        text: `আরও একটু গভীর অনুভব থেকে বললে: ${text}—যার আবেদন অত্যন্ত স্পষ্ট ও অর্থপূর্ণ।` 
      },
      { 
        styleName: 'সহজ ও সাবলীল', 
        tag: 'সাবলীল', 
        text: `সহজ অথচ অত্যন্ত মার্জিতভাবে: ${text}। প্রতিটি কথার মধ্যে যেন এক স্বাভাবিক আত্মবিশ্বাস ফুটে ওঠে।` 
      },
    ],
  });
}
