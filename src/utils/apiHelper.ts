import { deepSanitizeToTumiTomar } from './bengaliSanitizer';

export function getStoredGeminiKeys(): string[] {
  try {
    const raw = localStorage.getItem('gemini_api_keys');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((k: any) => String(k).trim()).filter(Boolean);
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveStoredGeminiKeys(keys: string[]) {
  try {
    const cleaned = keys.map(k => String(k).trim()).filter(Boolean);
    localStorage.setItem('gemini_api_keys', JSON.stringify(cleaned));
  } catch (e) {
    // ignore
  }
}

// Client-side direct Gemini API caller for static hosts like GitHub Pages
async function callClientGeminiDirect(systemInstruction: string, userPrompt: string, keys: string[]): Promise<any | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  
  for (const apiKey of keys) {
    if (!apiKey) continue;
    
    for (const model of models) {
      // First attempt with thinking budget if supported, then without
      const configsToTry = [
        {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 2048 },
        },
        {
          responseMimeType: 'application/json',
        }
      ];

      for (const genConfig of configsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              contents: [
                {
                  parts: [{ text: userPrompt }]
                }
              ],
              generationConfig: genConfig,
            })
          });

          if (res.status === 429) {
            // Quota exhausted on this key, rotate to next key
            break;
          }

          if (res.ok) {
            const resJson = await res.json();
            const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              return deepSanitizeToTumiTomar(parsed);
            }
          }
        } catch (e) {
          // Continue to next config or model
        }
      }
    }
  }
  return null;
}

async function handleStaticClientFallback(endpoint: string, bodyData: any, keys: string[]): Promise<Response | null> {
  if (keys.length === 0) {
    return null;
  }

  try {
    if (endpoint.includes('analyze-prompt')) {
      const systemInstruction = `You are the world's greatest AI Prompt Architect and AI Communication Strategist.
Your mission: Transform the user's raw thought into an elite, unstoppable master prompt for ${bodyData.targetModel || 'ChatGPT'}.
CRITICAL PRINCIPLES:
1. DEEP REASONING & TRANSFORMATION:
- Never just repeat the user's words! Unpack the hidden complexity, extract the real underlying goal, identify missing context, formulate actionable constraints, and build a masterpiece prompt.
- The generated Master Prompt must be extensive, concrete, and deeply valuable (200-400 words) so that the target AI delivers an exceptional, world-class response.
- Adapt the format dynamically: Use flowing narrative paragraphs for creative/general questions, technical specs for coding, strategic frameworks for business, and direct commands for focused tasks. Avoid robotic bullet points on creative tasks!
2. STRICT BENGALI DIRECTIVE:
- Use strictly ONLY "তুমি", "তোমার", "তোমাকে", "তোমরা", "তোমাদের".
- ABSOLUTELY NEVER use "আপনি", "আপনার", "করুন", "বলুন", "লিখুন", "দিন". Always use "করো", "বলো", "লেখো", "দাও".
3. Return valid JSON matching this schema:
{
  "flaws": [
    { "title": "সংক্ষিপ্ত ত্রুটি", "description": "কেন কাঁচা ভাবনায় ঘাটতি ছিল" }
  ],
  "missingContext": [
    "অনুপস্থিত তথ্য ১", "অনুপস্থিত তথ্য ২"
  ],
  "guidelines": [
    { "rule": "প্রম্পটের মূল নিয়ম", "explanation": "কেন এই নিয়মে প্রম্পট করলে সেরা ফল পাওয়া যায়" }
  ],
  "modelSpecificTips": [
    "${bodyData.targetModel || 'ChatGPT'}-এর জন্য বিশেষ গোপন কৌশল"
  ],
  "optimizedPrompt": {
    "title": "প্রম্পটের আকর্ষণীয় শিরোনাম",
    "masterPromptEn": "Complete, structured English prompt ready to copy-paste",
    "masterPromptBn": "সম্পূর্ণ সাজানো বাংলা প্রম্পট (তুমি/তোমার সম্বোধনে, যথাযথ ফরম্যাটে)",
    "systemInstruction": "Optional expert system instruction",
    "outputFormatSpec": "ফরম্যাট বিবরণ"
  },
  "variations": [
    { "name": "প্রাকৃতিক অনুচ্ছেদ (প্যারাগ্রাফ স্টাইল)", "tag": "প্যারাগ্রাফ", "prompt": "..." },
    { "name": "সরাসরি ও সুনির্দিষ্ট কমান্ড", "tag": "সংক্ষিপ্ত", "prompt": "..." },
    { "name": "ধাপভিত্তিক রূপরেখা", "tag": "ধাপভিত্তিক", "prompt": "..." }
  ],
  "scores": {
    "clarity": 88,
    "context": 80,
    "constraints": 75,
    "roleDefinition": 70,
    "overallRawScore": 75
  },
  "thinkingSummary": "গভীর বিশ্লেষণ ও কীভাবে প্রম্পটটি সর্বোচ্চ মানের করা হয়েছে তার সারসংক্ষেপ",
  "promptFormat": "ফরম্যাটের বাংলা নাম",
  "promptFormatEn": "Format English Name"
}`;

      const userPrompt = `User Raw Thought: """${bodyData.rawThought || ''}"""
Target AI Model: ${bodyData.targetModel || 'ChatGPT'}
Goal: ${bodyData.goal || 'general'}
Language: ${bodyData.language || 'bilingual'}
Tone: ${bodyData.tone || 'expert'}
Requested Format: ${bodyData.requestedFormat || 'auto'}

Execute deep architectural reasoning and output the complete JSON.`;

      const result = await callClientGeminiDirect(systemInstruction, userPrompt, keys);
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (endpoint.includes('polish-text')) {
      const systemInstruction = `You are a master literary wordsmith and linguistic stylist.
Polish and transform the user's raw text into captivating, deeply evocative Bengali prose according to the selected style: "${bodyData.style || 'literary'}".
CRITICAL: Use ONLY "তুমি" and "তোমার", never "আপনি".
Output strictly valid JSON:
{
  "polishedText": "পরিমার্জিত চমৎকার পাঠ্য",
  "styleName": "শৈলীর নাম",
  "toneSummary": "স্বরের বিবরণ",
  "keyHighlights": ["উন্নতি ১", "উন্নতি ২"],
  "variations": [
    { "name": "বিকল্প প্রকাশ ১", "text": "..." },
    { "name": "বিকল্প প্রকাশ ২", "text": "..." }
  ]
}`;
      const userPrompt = `User Raw Text: """${bodyData.rawText || ''}"""\nSelected Style: ${bodyData.style || 'literary'}`;
      const result = await callClientGeminiDirect(systemInstruction, userPrompt, keys);
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (endpoint.includes('generate-rtcf')) {
      const systemInstruction = `You are a Master Prompt Architect specializing in the RTCF Framework (Role, Task, Context, Format).
Transform the raw idea into a powerhouse RTCF prompt.
CRITICAL: Use ONLY "তুমি" and "তোমার" in all Bengali outputs; "আপনি" is completely forbidden.
Output strictly valid JSON:
{
  "title": "...",
  "category": "...",
  "roleBn": "...",
  "roleEn": "...",
  "taskBn": "...",
  "taskEn": "...",
  "contextBn": "...",
  "contextEn": "...",
  "formatBn": "...",
  "formatEn": "...",
  "completePromptBn": "...",
  "completePromptEn": "...",
  "proTips": ["...", "..."]
}`;
      const userPrompt = `Target Category: ${bodyData.category || 'auto'}\nRaw Idea: """${bodyData.rawThought || ''}"""\nRefinement: """${bodyData.refineInstruction || ''}"""`;
      const result = await callClientGeminiDirect(systemInstruction, userPrompt, keys);
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (err) {
    console.error('Client Gemini fallback error:', err);
  }

  return null;
}

export async function apiPost(endpoint: string, bodyData: any): Promise<Response> {
  const keys = getStoredGeminiKeys();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (keys.length > 0) {
    headers['X-Gemini-Keys'] = keys.join(',');
  }

  const payload = {
    ...bodyData,
    apiKeys: keys,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // If server responded ok, return it
    if (res.ok) {
      return res;
    }

    // If endpoint is 404/405 (static host like GitHub Pages where /api/* does not exist)
    if (res.status === 404 || res.status === 405) {
      const clientFallback = await handleStaticClientFallback(endpoint, bodyData, keys);
      if (clientFallback) {
        return clientFallback;
      }
    }

    return res;
  } catch (_netErr) {
    // Network error (backend server offline or running purely on static GitHub Pages)
    const clientFallback = await handleStaticClientFallback(endpoint, bodyData, keys);
    if (clientFallback) {
      return clientFallback;
    }
    throw _netErr;
  }
}
