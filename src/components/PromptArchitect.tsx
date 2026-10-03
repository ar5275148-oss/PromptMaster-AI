import React, { useState } from 'react';
import { 
  SupportedModelId, 
  PromptAnalysisResult 
} from '../types';
import { ALL_AI_MODELS } from '../data/modelsData';
import { deepSanitizeToTumiTomar } from '../utils/bengaliSanitizer';
import { synthesizeClientPromptArchitect } from '../utils/clientFallbackEngines';
import { apiPost, getStoredGeminiKeys } from '../utils/apiHelper';
import { ApiKeySettingsModal } from './ApiKeySettingsModal';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RotateCcw, 
  X, 
  ChevronRight, 
  ArrowUp,
  Share2,
  ExternalLink
} from 'lucide-react';

interface PromptArchitectProps {
  selectedModelId: SupportedModelId;
  onSelectModel: (id: SupportedModelId) => void;
  lang?: 'bn' | 'en';
}

interface ActiveTurn {
  id: string;
  submittedThought: string;
  modelId: SupportedModelId;
  modelName: string;
  analysisResult: PromptAnalysisResult | null;
  isGenerating: boolean;
  activePromptTab: 'bn' | 'en';
  copiedKey: string | null;
}

export const PromptArchitect: React.FC<PromptArchitectProps> = ({
  selectedModelId,
  onSelectModel,
  lang = 'bn',
}) => {
  const isBn = lang === 'bn';
  const selectedModel = ALL_AI_MODELS.find((m) => m.id === selectedModelId) || ALL_AI_MODELS[0];

  const [rawThought, setRawThought] = useState('');
  const [currentTurn, setCurrentTurn] = useState<ActiveTurn | null>(null);
  const [lastSubmittedThought, setLastSubmittedThought] = useState('');

  const [goal] = useState('general');
  const [tone] = useState('expert');
  const [outputLanguage] = useState<'bilingual' | 'en' | 'bn'>('bilingual');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Full Analysis & Master Prompt generation
  const handleAnalyzeAndGenerate = async (customThought?: string, customModelId?: SupportedModelId) => {
    const textToAnalyze = (customThought !== undefined ? customThought : rawThought).trim();
    const targetModelId = customModelId || selectedModelId;
    const targetModelObj = ALL_AI_MODELS.find((m) => m.id === targetModelId) || selectedModel;

    if (!textToAnalyze) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে তোমার মনের কথা বা প্রম্পট লেখো।' : 'Please enter your raw thought or prompt.');
      return;
    }

    if (customThought === undefined) {
      setRawThought('');
    }
    setErrorMessage(null);
    onSelectModel(targetModelId);
    setLastSubmittedThought(textToAnalyze);

    const turnId = Date.now().toString();
    const pendingTurn: ActiveTurn = {
      id: turnId,
      submittedThought: textToAnalyze,
      modelId: targetModelId,
      modelName: targetModelObj.name,
      analysisResult: null,
      isGenerating: true,
      activePromptTab: 'bn',
      copiedKey: null,
    };

    // আগের মডেলের প্রম্পট সরিয়ে সরাসরি নতুন মডেলের প্রম্পট নির্ধারণ
    setCurrentTurn(pendingTurn);
    setIsLoading(true);

    try {
      let dataToUse: PromptAnalysisResult;
      try {
        const res = await apiPost('/api/analyze-prompt', {
          rawThought: textToAnalyze,
          targetModel: targetModelObj.name,
          goal,
          language: outputLanguage,
          tone,
          requestedFormat: 'auto',
          useHighThinking: false,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            dataToUse = deepSanitizeToTumiTomar(json.data);
          } else {
            dataToUse = synthesizeClientPromptArchitect(textToAnalyze, targetModelId, goal, tone, 'auto');
          }
        } else {
          // If running statically on GitHub Pages or server returned non-200
          dataToUse = synthesizeClientPromptArchitect(textToAnalyze, targetModelId, goal, tone, 'auto');
        }
      } catch (_fetchErr) {
        // Offline / GitHub Pages static mode fallback
        dataToUse = synthesizeClientPromptArchitect(textToAnalyze, targetModelId, goal, tone, 'auto');
      }

      setCurrentTurn((prev) =>
        prev && prev.id === turnId
          ? { ...prev, analysisResult: dataToUse, isGenerating: false }
          : prev
      );
    } catch (err: any) {
      console.error('Error analyzing:', err);
      const fallbackResult = synthesizeClientPromptArchitect(textToAnalyze, targetModelId, goal, tone, 'auto');
      setCurrentTurn((prev) =>
        prev && prev.id === turnId
          ? { ...prev, analysisResult: fallbackResult, isGenerating: false }
          : prev
      );
    } finally {
      setIsLoading(false);
    }
  };

  // অন্য মডেল নির্বাচন করলে আগের মডেলের প্রম্পট সরে যাবে এবং নতুন মডেলে তৈরি হবে
  const handleSelectModel = (modelId: SupportedModelId) => {
    onSelectModel(modelId);
    const thoughtToUse = rawThought.trim() || (currentTurn ? currentTurn.submittedThought : '') || lastSubmittedThought;
    
    // আগের মডেলের প্রম্পট সাথে সাথে সরিয়ে ফেলা (Clear previous model's prompt)
    setCurrentTurn(null);

    if (thoughtToUse && !isLoading) {
      handleAnalyzeAndGenerate(thoughtToUse, modelId);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCurrentTurn((prev) => (prev ? { ...prev, copiedKey: key } : null));
    setTimeout(() => {
      setCurrentTurn((prev) => (prev ? { ...prev, copiedKey: null } : null));
    }, 2000);
  };

  const getActivePromptText = () => {
    if (!currentTurn || !currentTurn.analysisResult) return '';
    return currentTurn.activePromptTab === 'en'
      ? currentTurn.analysisResult.optimizedPrompt.masterPromptEn
      : currentTurn.analysisResult.optimizedPrompt.masterPromptBn;
  };

  const handleShare = async () => {
    const text = getActivePromptText();
    if (!text || !currentTurn) return;

    const shareTitle = `${currentTurn.modelName} মাস্টার প্রম্পট`;
    const shareUrl = window.location.href;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}:\n\n${text}\n\nপ্রম্পটটি তৈরি হয়েছে Assistant ইঞ্জিন থেকে:`,
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
    const text = getActivePromptText();
    if (!text || !currentTurn) return;
    const fullShare = `${currentTurn.modelName}-এর জন্য তৈরি চূড়ান্ত মাস্টার প্রম্পট:\n\n${text}\n\nসংগ্রহ করো: ${window.location.href}`;
    navigator.clipboard.writeText(fullShare);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Centerpiece: Model Name, Active Green Light & Lightweight Arrow Symbol */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-6 sm:pt-4 sm:pb-8 px-4">
        <div 
          onClick={() => setIsSpecsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsSpecsModalOpen(true); }}
          className="group inline-flex items-center justify-center gap-2.5 sm:gap-3.5 cursor-pointer select-none transition-transform active:scale-[0.98]"
          title="মডেলের সকল বৈশিষ্ট্য ও কাজের বিবরণ দেখতে ক্লিক করো"
        >
          {/* Active Green Light */}
          <span className="relative flex h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-400 shadow-[0_0_15px_#34d399]"></span>
          </span>

          {/* Model Name */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-sans drop-shadow-2xl group-hover:text-slate-200 transition-colors">
            {selectedModel.name.split('(')[0].trim()}
          </h2>

          <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400/80 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-200 stroke-[1.5] shrink-0" />
        </div>
      </div>

      {/* Clean Model Specs Pop-up Modal */}
      {isSpecsModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Hind_Siliguri',sans-serif]"
          onClick={() => setIsSpecsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-gradient-to-b from-[#11192b] via-[#0d1424] to-[#070b15] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/95 max-h-[85vh] overflow-y-auto pb-20 sm:pb-8 font-['Hind_Siliguri',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80 animate-pulse" />
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-['Hind_Siliguri',sans-serif]">
                    {selectedModel.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-['Hind_Siliguri',sans-serif]">
                  {selectedModel.company}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsSpecsModalOpen(false)}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="বন্ধ করো"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="py-6 space-y-6 text-left font-['Hind_Siliguri',sans-serif]">
              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide font-['Hind_Siliguri',sans-serif]">
                  মডেলের পরিচয় ও মূল কাজ:
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal font-['Hind_Siliguri',sans-serif]">
                  {selectedModel.taglineBn}। {selectedModel.secretFormulaBn}
                </p>
              </div>

              <div className="border-t border-slate-800/60" />

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide font-['Hind_Siliguri',sans-serif]">
                  কোন কাজের জন্য সবচেয়ে আদর্শ (Best For):
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal font-['Hind_Siliguri',sans-serif]">
                  {selectedModel.bestForBn}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSpecsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer font-['Hind_Siliguri',sans-serif]"
              >
                বুঝেছি, বন্ধ করো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean & Interactive Share Modal */}
      {isShareModalOpen && currentTurn && currentTurn.analysisResult && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Hind_Siliguri',sans-serif]"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-gradient-to-b from-[#11192b] via-[#0d1424] to-[#070b15] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/95 max-h-[90vh] overflow-y-auto font-['Hind_Siliguri',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-cyan-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    {isBn ? 'প্রম্পট শেয়ার করো' : 'Share Master Prompt'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentTurn.modelName} — {currentTurn.activePromptTab === 'en' ? 'ইংরেজি ভার্সন' : 'বাংলা ভার্সন'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="বন্ধ করো"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Snippet Preview */}
            <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-300 max-h-36 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
              {getActivePromptText().slice(0, 260)}...
            </div>

            {/* Direct Quick Share Options */}
            <div className="space-y-3.5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isBn ? 'সরাসরি শেয়ার মাধ্যম' : 'Direct Share Channels'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `${currentTurn.modelName} মাস্টার প্রম্পট:\n\n${getActivePromptText()}\n\nওয়েবসাইট: ${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold transition-all shadow-sm"
                >
                  <span>হোয়াটসঅ্যাপ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
                    `${currentTurn.modelName} মাস্টার প্রম্পট:\n\n${getActivePromptText()}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/40 text-[#38bdf8] text-xs font-semibold transition-all shadow-sm"
                >
                  <span>টেলিগ্রাম</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* X (Twitter) */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${currentTurn.modelName}-এর জন্য তৈরি মাস্টার প্রম্পট!\n\n${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
                >
                  <span>X (টুইটার)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Copy Full Link & Text Button */}
              <button
                type="button"
                onClick={handleCopyShareText}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-[0.99]"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>{isBn ? 'প্রম্পট ও লিংক কপি হয়েছে!' : 'Copied to Clipboard!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isBn ? 'পুরো প্রম্পট ও লিংক কপি করো' : 'Copy Full Prompt & Link'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                {isBn ? 'বন্ধ করো' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Classic & Clean ChatGPT Style Fixed Bottom Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b14] pt-2 pb-0 px-0 pointer-events-none shadow-[0_-20px_50px_#070b14]">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto bg-[#070b14] px-3 sm:px-6 space-y-2">
          
          {/* Error message if any */}
          {errorMessage && (
            <div className="p-2.5 bg-red-950/90 border border-red-800/85 rounded-xl flex items-center gap-2 text-xs text-red-200 shadow-2xl backdrop-blur-md animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Smart API Key notice banner if running without stored Gemini Key */}
          {getStoredGeminiKeys().length === 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-indigo-500/15 border border-amber-500/35 rounded-xl px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-sm font-['Hind_Siliguri',sans-serif]">
              <div className="flex items-center gap-2 overflow-hidden">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="truncate text-[11px] sm:text-xs">
                  গিটহাবে সর্বোচ্চ বুদ্ধিমত্তা ও আসল ডিপ-থিঙ্কিং এআই চালাতে তোমার ফ্রি API Key যুক্ত করো
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 font-semibold text-[11px] shrink-0 cursor-pointer transition-all active:scale-95"
              >
                🔑 এপিআই কি সেট করো
              </button>
            </div>
          )}

          {/* Classic Clean Model Selector - অন্য মডেল সিলেক্ট করলে আগের প্রম্পট সরে সরাসরি নতুন মডেলে জেনারেট হবে */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-transparent scrollbar-none no-scrollbar">
            {ALL_AI_MODELS.map((model) => {
              const isSelected = selectedModelId === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelectModel(model.id)}
                  className={`px-3.5 py-1 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                  title={`${model.name}-এর জন্য প্রম্পট জেনারেট করো`}
                >
                  {model.name.split('(')[0].trim()}
                </button>
              );
            })}
          </div>

          {/* Premium & Clean Chat Box Bar - সামান্য বড় ও আরামদায়ক সাইজ */}
          <div className="relative rounded-2xl sm:rounded-3xl bg-[#0c1322]/95 backdrop-blur-2xl border border-slate-700/70 shadow-[0_14px_40px_rgba(0,0,0,0.75)] p-3.5 sm:p-4.5 transition-all duration-300 focus-within:border-blue-500/80 focus-within:shadow-[0_0_35px_rgba(37,99,235,0.25)] ring-1 ring-white/5">
            <textarea
              value={rawThought}
              onChange={(e) => setRawThought(e.target.value)}
              rows={3}
              placeholder="তোমার মনের ভাবনা বা কী করতে চাও এখানে লেখো..."
              className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 px-2.5 py-1 text-base sm:text-[17px] text-slate-100 placeholder-slate-400/90 font-['Hind_Siliguri',sans-serif] leading-relaxed resize-none min-h-[70px] sm:min-h-[82px] max-h-[190px]"
            />

            {/* Bottom Row Inside Box */}
            <div className="flex items-center justify-between pt-2 px-1">
              <div>
                {rawThought.trim() && !isLoading ? (
                  <button
                    type="button"
                    onClick={() => setRawThought('')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer font-['Hind_Siliguri',sans-serif]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>মুছে ফেলো</span>
                  </button>
                ) : null}
              </div>

              {/* Premium Send Button */}
              <button
                type="button"
                onClick={() => handleAnalyzeAndGenerate()}
                disabled={isLoading || !rawThought.trim()}
                title="মাস্টার প্রম্পট তৈরি করো"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 ${
                  rawThought.trim() && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
                    : 'bg-slate-800/80 text-slate-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                ) : (
                  <ArrowUp className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Result Display - একক ফলাফল, কোনো বক্স নেই, সরাসরি ওয়েবসাইটে */}
      <div className="space-y-12 pb-36 sm:pb-48 font-['Hind_Siliguri',sans-serif]">
        {currentTurn && (
          <div key={currentTurn.id} className="space-y-8 border-b border-slate-800/80 pb-8 animate-in fade-in duration-300 font-['Hind_Siliguri',sans-serif]">
            
            {/* User's Input Displayed cleanly on Screen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-400 tracking-wide font-['Hind_Siliguri',sans-serif]">
                  {isBn ? 'তোমার বার্তা / প্রম্পট' : 'Your Prompt'}
                </h3>
                <span className="text-xs font-mono text-slate-400">{currentTurn.modelName}</span>
              </div>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal whitespace-pre-wrap font-['Hind_Siliguri',sans-serif]">
                {currentTurn.submittedThought}
              </p>
            </div>

            {currentTurn.isGenerating ? (
              <div className="flex items-center gap-3 py-6 text-slate-400">
                <Sparkles className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="text-sm font-['Hind_Siliguri',sans-serif] animate-pulse">
                  {isBn ? `${currentTurn.modelName}-এর জন্য মাস্টার প্রম্পট বিশ্লেষণ ও তৈরি হচ্ছে...` : `AI is analyzing and generating master prompt for ${currentTurn.modelName}...`}
                </span>
              </div>
            ) : currentTurn.analysisResult ? (
              <div className="space-y-8">

                {/* 1. Optimized Master Prompt Section - কোনো বক্স নেই, সরাসরি ওয়েবসাইটে প্রদর্শিত */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-xl sm:text-2xl font-bold text-white tracking-wide font-['Hind_Siliguri',sans-serif]">
                        {isBn ? `${currentTurn.modelName}-এর জন্য তৈরি চূড়ান্ত মাস্টার প্রম্পট` : `Optimized Master Prompt for ${currentTurn.modelName}`}
                      </h4>
                    </div>

                    {/* Language Switcher (বাংলা ও ইংরেজি ভার্সন) */}
                    <div className="inline-flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentTurn((prev) => (prev ? { ...prev, activePromptTab: 'bn' } : null))
                        }
                        className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                          currentTurn.activePromptTab === 'bn'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        বাংলা ভার্সন
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentTurn((prev) => (prev ? { ...prev, activePromptTab: 'en' } : null))
                        }
                        className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                          currentTurn.activePromptTab === 'en'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ইংরেজি ভার্সন
                      </button>
                    </div>
                  </div>

                  {/* Master Prompt Content - সরাসরি ওয়েবসাইটে টেক্সট আকারে */}
                  <div
                    className={`w-full text-slate-100 whitespace-pre-wrap leading-relaxed text-base sm:text-lg pt-1 ${
                      currentTurn.activePromptTab === 'bn'
                        ? "font-['Hind_Siliguri',sans-serif] font-normal"
                        : "font-mono text-indigo-200 text-sm sm:text-base tracking-wide"
                    }`}
                  >
                    {getActivePromptText()}
                  </div>

                  {/* প্রম্পট অ্যাকশন বোতাম (শেয়ার ও কপি) */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 flex-wrap">
                    {/* শেয়ার বাটন */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 shadow-md transition-all active:scale-95 cursor-pointer"
                      title="প্রম্পট শেয়ার করো"
                    >
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span>{isBn ? 'প্রম্পট শেয়ার করো' : 'Share Prompt'}</span>
                    </button>

                    {/* কপি বাটন */}
                    <button
                      type="button"
                      onClick={() => handleCopy(getActivePromptText(), 'active-prompt')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                      title="প্রম্পট কপি করো"
                    >
                      {currentTurn.copiedKey === 'active-prompt' ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>{isBn ? 'প্রম্পট কপি হয়েছে!' : 'Prompt Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-white" />
                          <span>{isBn ? 'প্রম্পট কপি করো' : 'Copy Prompt'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Flaws & Golden Guidelines - সরাসরি ওয়েবসাইটে */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-800/80">
                  
                  {/* Flaw Analysis */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5 text-red-500">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <h4 className="text-xl sm:text-2xl font-bold text-red-500 tracking-wide font-['Hind_Siliguri',sans-serif]">
                        {isBn ? 'কথায় কোথায় ভুল বা দুর্বলতা ছিল' : 'Flaw Analysis'}
                      </h4>
                    </div>
                    <div className="space-y-3.5">
                      {currentTurn.analysisResult.flaws?.map((flaw, i) => (
                        <div key={i} className="space-y-1">
                          <p className="font-bold text-base sm:text-lg text-slate-200 font-['Hind_Siliguri',sans-serif]">{flaw.title}</p>
                          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-['Hind_Siliguri',sans-serif]">{flaw.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Golden Guidelines */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-2.5 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <h4 className="text-xl sm:text-2xl font-bold text-emerald-500 tracking-wide font-['Hind_Siliguri',sans-serif]">
                        {isBn ? 'সর্বোচ্চ মান পাওয়ার নিয়মাবলী' : 'Golden Guidelines'}
                      </h4>
                    </div>
                    <div className="space-y-3.5">
                      {currentTurn.analysisResult.guidelines?.map((guide, i) => (
                        <div key={i} className="space-y-1">
                          <p className="font-bold text-base sm:text-lg text-slate-200 font-['Hind_Siliguri',sans-serif]">{guide.rule}</p>
                          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-['Hind_Siliguri',sans-serif]">{guide.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        )}

        {currentTurn && (
          <div className="flex justify-center pt-4 pb-2">
            <button
              type="button"
              onClick={() => {
                setCurrentTurn(null);
                setLastSubmittedThought('');
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0e1628] hover:bg-[#16223b] border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold shadow-lg transition-all duration-200 cursor-pointer font-['Hind_Siliguri',sans-serif] group"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400 group-hover:-rotate-90 transition-transform duration-300" />
              <span>{isBn ? 'ফলাফল মুছে ফেলো' : 'Clear Result'}</span>
            </button>
          </div>
        )}
      </div>

      {/* API Key Rotation & Settings Modal */}
      <ApiKeySettingsModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
      />
    </div>
  );
};
