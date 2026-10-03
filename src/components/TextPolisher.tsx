import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Share2, 
  ExternalLink, 
  X,
  Feather,
  Award,
  Heart,
  Zap,
  Smile
} from 'lucide-react';
import { PolisherStyleId, PolishedTextResult } from '../types';
import { deepSanitizeToTumiTomar } from '../utils/bengaliSanitizer';
import { synthesizeClientPolishedText } from '../utils/clientFallbackEngines';
import { apiPost } from '../utils/apiHelper';

interface StyleOption {
  id: PolisherStyleId;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'literary',
    label: 'সাহিত্যিক',
    hint: 'রবীন্দ্রনাথ ও জীবনানন্দ ঘরানার গভীর উপমা, ছন্দ ও কাব্যিক সুর',
    icon: <Feather className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'eloquent',
    label: 'মার্জিত',
    hint: 'রুচিশীল, শ্রদ্ধাপূর্ণ ও প্রভাববিস্তারী পরিশীলিত ভাষা',
    icon: <Award className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    id: 'heartfelt',
    label: 'আন্তরিক',
    hint: 'হৃদয়ের গভীর থেকে আসা খাঁটি আবেগ ও অনুভূতির ছোঁয়া',
    icon: <Heart className="w-3.5 h-3.5 text-rose-400" />,
  },
  {
    id: 'punchy',
    label: 'সংক্ষিপ্ত',
    hint: 'সোশ্যাল মিডিয়া বা ক্যাপশনের জন্য তীক্ষ্ণ ও আকর্ষণীয় বাক্য',
    icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
  },
  {
    id: 'lucid',
    label: 'সহজ-সরল',
    hint: 'কোনো জটিলতা ছাড়াই সাবলীল ও প্রাঞ্জল সহজ প্রকাশ',
    icon: <Smile className="w-3.5 h-3.5 text-emerald-400" />,
  },
];

export const TextPolisher: React.FC = () => {
  const [rawText, setRawText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<PolisherStyleId>('literary');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [result, setResult] = useState<PolishedTextResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handlePolishText = async (overrideText?: string, overrideStyle?: PolisherStyleId) => {
    const textToProcess = (overrideText !== undefined ? overrideText : rawText).trim();
    const styleToUse = overrideStyle || selectedStyle;

    if (!textToProcess) {
      setErrorMessage('অনুগ্রহ করে তোমার লেখা বা মনের ভাবনাটি এখানে লেখো।');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      let sanitizedData: PolishedTextResult;
      try {
        const res = await apiPost('/api/polish-text', {
          rawText: textToProcess,
          style: styleToUse,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            sanitizedData = deepSanitizeToTumiTomar(json.data);
          } else {
            sanitizedData = synthesizeClientPolishedText(textToProcess, styleToUse);
          }
        } else {
          sanitizedData = synthesizeClientPolishedText(textToProcess, styleToUse);
        }
      } catch (_fetchErr) {
        sanitizedData = synthesizeClientPolishedText(textToProcess, styleToUse);
      }

      setResult(sanitizedData);
    } catch (err: any) {
      console.error('Error polishing text:', err);
      const fallbackResult = synthesizeClientPolishedText(textToProcess, styleToUse);
      setResult(fallbackResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStyle = (styleId: PolisherStyleId) => {
    setSelectedStyle(styleId);
    // যদি ইতোমধ্যে লেখা থাকে ও রেজাল্ট থাকে, তাহলে নতুন সিলেক্ট করা অপশনে সাথে সাথে তৈরি হবে
    if (rawText.trim() && result && !isLoading) {
      handlePolishText(rawText, styleId);
    }
  };

  const getDisplayedText = () => {
    if (!result) return '';
    return result.polishedText;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async () => {
    const text = getDisplayedText();
    if (!text) return;

    const shareTitle = 'গুছানো ও মুগ্ধকর লেখা';
    const shareUrl = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${text}\n\n— Assistant দিয়ে গুছিয়ে নেওয়া লেখা`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
        return;
      }
    }

    setIsShareModalOpen(true);
  };

  const handleCopyShareText = () => {
    const text = getDisplayedText();
    if (!text) return;
    const fullShare = `${text}\n\n— Assistant দিয়ে গুছিয়ে নেওয়া লেখা (${window.location.href})`;
    navigator.clipboard.writeText(fullShare);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const activeStyleItem = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

  return (
    <div className="space-y-6 font-['Hind_Siliguri',sans-serif]">
      {/* Feature Intro - "মুগ্ধকর লেখা ও ভাষা রূপান্তর" বাদ দেওয়া হয়েছে */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          কথা গুছিয়ে নাও —{' '}
          <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
            মুগ্ধ হবে সকলে
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          তোমার যেকোনো এলোমেলো লেখা, মনের ভাব বা খসড়া এখানে দাও। নিচের অপশন থেকে যেকোনো একটি ধরন বেছে নিলে এআই সেই রূপেই সুন্দর করে কথাটি সাজিয়ে দেবে।
        </p>
      </div>

      {/* স্টাইল অপশনসমূহ (Style Options) - যে কোনো একটি সিলেক্ট করলে সেই অনুযায়ী রূপান্তর হবে */}
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-slate-300">লেখার ধরন বেছে নাও:</span>
          <span className="text-[11px] text-amber-400/90 font-medium hidden sm:inline">
            সিলেক্ট করলে সরাসরি সেই ধরনে গুছিয়ে দেবে
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STYLE_OPTIONS.map((style) => {
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleSelectStyle(style.id)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title={style.hint}
              >
                {style.icon}
                <span>{style.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Box Card */}
      <div className="max-w-4xl mx-auto space-y-3">
        {errorMessage && (
          <div className="p-3 bg-red-950/90 border border-red-800/80 rounded-xl text-xs text-red-200 shadow-lg flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="relative rounded-3xl bg-[#0c1322]/95 backdrop-blur-2xl border border-slate-700/80 shadow-[0_14px_45px_rgba(0,0,0,0.7)] p-4 sm:p-5 transition-all focus-within:border-amber-500/70 focus-within:shadow-[0_0_30px_rgba(245,158,11,0.18)]">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            placeholder="এখানে তোমার মনের কথা, আবেগ, বার্তা, স্ট্যাটাস বা যেকোনো অগোছালো লেখা লেখো বা পেস্ট করো..."
            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-lg text-slate-100 placeholder-slate-400 leading-relaxed resize-none min-h-[95px] max-h-[260px]"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-1">
            <div>
              {rawText.trim() && !isLoading ? (
                <button
                  type="button"
                  onClick={() => setRawText('')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>মুছে ফেলো</span>
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handlePolishText()}
              disabled={isLoading || !rawText.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                rawText.trim() && !isLoading
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>{activeStyleItem.label} রূপ তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>{activeStyleItem.label} ভাষায় গুছিয়ে দাও</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display Section - সরাসরি নির্বাচিত ধরনে পরিচ্ছন্ন রূপ */}
      {result && (
        <div className="max-w-4xl mx-auto space-y-4 pt-2 animate-in fade-in duration-300">
          {/* Top Status & Reset Button */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                {activeStyleItem.icon}
                <span>{result.styleName || activeStyleItem.label} রূপে গুছানো</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setRawText('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-800 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>নতুন লেখা</span>
            </button>
          </div>

          {/* The Clean Polished Text - সরাসরি সুন্দর টাইপোগ্রাফিতে প্রদর্শিত */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0b1222]/90 border border-slate-800 shadow-2xl relative">
            <p className="text-lg sm:text-xl text-slate-100 leading-relaxed font-normal whitespace-pre-wrap selection:bg-amber-500/30">
              {getDisplayedText()}
            </p>
          </div>

          {/* Action Buttons: Copy & Share */}
          <div className="flex items-center justify-end gap-2.5 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 shadow-md transition-all active:scale-95 cursor-pointer"
              title="লেখা শেয়ার করো"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>লেখা শেয়ার করো</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(getDisplayedText(), 'polished-text')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition-all active:scale-95 cursor-pointer"
              title="লেখা কপি করো"
            >
              {copiedKey === 'polished-text' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>লেখা কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>লেখা কপি করো</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && result && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-gradient-to-b from-[#11192b] via-[#0d1424] to-[#070b15] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    লেখা শেয়ার করো
                  </h3>
                  <p className="text-xs text-slate-400">
                    {result.styleName || activeStyleItem.label} রূপে গুছিয়ে নেওয়া লেখা
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {getDisplayedText().slice(0, 260)}...
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `${getDisplayedText()}\n\n— Assistant দিয়ে গুছিয়ে নেওয়া লেখা (${window.location.href})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold transition-all shadow-sm"
                >
                  <span>হোয়াটসঅ্যাপ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
                    getDisplayedText()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/40 text-[#38bdf8] text-xs font-semibold transition-all shadow-sm"
                >
                  <span>টেলিগ্রাম</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${getDisplayedText().slice(0, 200)}...\n\n${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
                >
                  <span>X (টুইটার)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyShareText}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:opacity-90 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>লেখা ও লিংক কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>পুরো লেখা ও লিংক কপি করো</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
