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
    for (const model of models) {
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
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        });

        if (res.status === 429) {
          // Quota exhausted on this key, rotate to next model/key
          continue;
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
        // Continue to next model/key
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
      const systemInstruction = `You are the world's greatest AI Prompt Architect. Transform the raw thought into an elite master prompt for ${bodyData.targetModel || 'ChatGPT'}. Use ONLY "তুমি" and "তোমার" in all Bengali outputs; "আপনি" is completely forbidden. Output valid JSON with keys: flaws, missingContext, guidelines, modelSpecificTips, optimizedPrompt { title, masterPromptEn, masterPromptBn, systemInstruction, outputFormatSpec }, variations, scores, thinkingSummary, promptFormat, promptFormatEn.`;
      const userPrompt = `User Raw Query: """${bodyData.rawThought || ''}"""\nTarget AI: ${bodyData.targetModel || 'ChatGPT'}\nGoal: ${bodyData.goal || 'general'}\nTone: ${bodyData.tone || 'expert'}\nRequested Format: ${bodyData.requestedFormat || 'auto'}`;
      const result = await callClientGeminiDirect(systemInstruction, userPrompt, keys);
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (endpoint.includes('polish-text')) {
      const systemInstruction = `You are a master literary wordsmith. Polish and transform the raw text into captivating Bengali prose. Style: "${bodyData.style || 'literary'}". Use ONLY "তুমি" and "তোমার", never "আপনি". Output JSON: { polishedText, styleName, toneSummary, keyHighlights, variations }`;
      const userPrompt = `User Raw Text: """${bodyData.rawText || ''}"""\nStyle: ${bodyData.style || 'literary'}`;
      const result = await callClientGeminiDirect(systemInstruction, userPrompt, keys);
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (endpoint.includes('generate-rtcf')) {
      const systemInstruction = `You are a Master Prompt Architect specializing in the RTCF Framework (Role, Task, Context, Format). Use ONLY "তুমি" and "তোমার" in Bengali. Output JSON: { title, category, roleBn, roleEn, taskBn, taskEn, contextBn, contextEn, formatBn, formatEn, completePromptBn, completePromptEn, proTips }`;
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
