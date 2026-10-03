// Enforces "তুমি, তোমার" style across all Bengali texts and eliminates "আপনি/আপনার/করুন" etc.
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

export function sanitizeToTumiTomar(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let result = text;
  for (const [regex, replacement] of FORMAL_TO_INFORMAL_MAP) {
    result = result.replace(regex, replacement);
  }
  return result;
}

export function deepSanitizeToTumiTomar<T>(data: T): T {
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
