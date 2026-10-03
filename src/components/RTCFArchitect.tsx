import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  Share2, 
  Edit3, 
  ExternalLink, 
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2
} from 'lucide-react';
import { RTCFResult } from '../types';
import { deepSanitizeToTumiTomar } from '../utils/bengaliSanitizer';
import { synthesizeClientRTCF } from '../utils/clientFallbackEngines';
import { apiPost } from '../utils/apiHelper';

export const RTCFArchitect: React.FC = () => {
  // Main input state
  const [rawThought, setRawThought] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle for RTCF Writing Option (placed below the chatbox, without any emoji)
  const [isRTCFDrawerOpen, setIsRTCFDrawerOpen] = useState(false);

  // 4 RTCF Pillars (Role, Task, Context, Format)
  const [roleText, setRoleText] = useState('');
  const [taskText, setTaskText] = useState('');
  const [contextText, setContextText] = useState('');
  const [formatText, setFormatText] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptCategory, setPromptCategory] = useState('');
  const [proTips, setProTips] = useState<string[]>([]);

  // UI State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const rtcfWorkspaceRef = useRef<HTMLDivElement>(null);

  // Check if any RTCF content exists
  const hasRTCFContent = Boolean(
    roleText.trim() || taskText.trim() || contextText.trim() || formatText.trim()
  );

  // Consolidated Master Prompt
  const masterPromptBn = `【রোল (Role)】\n${roleText || 'প্রযোজ্য নয়'}\n\n【টাস্ক (Task)】\n${taskText || 'প্রযোজ্য নয়'}\n\n【কনটেক্সট (Context)】\n${contextText || 'প্রযোজ্য নয়'}\n\n【ফরম্যাট (Format)】\n${formatText || 'প্রযোজ্য নয়'}`;

  // Process / Generate RTCF
  const handleProcessRTCF = async (overrideThought?: string, actionType: 'generate' | 'enhance' = 'generate') => {
    const textToSend = (overrideThought !== undefined ? overrideThought : rawThought).trim();

    if (!textToSend && !hasRTCFContent) {
      setErrorMessage('অনুগ্রহ করে তোমার আইডিয়া বা প্রম্পটের বিবরণ এখানে লেখো।');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      let data: RTCFResult;
      try {
        const res = await apiPost('/api/generate-rtcf', {
          rawThought: textToSend || (actionType === 'enhance' ? 'ব্যবহারকারীর ড্রাফট করা RTCF প্রম্পটটি আরও উন্নত ও নিখুঁত করো।' : ''),
          category: 'auto',
          customFields: hasRTCFContent ? {
            role: roleText,
            task: taskText,
            context: contextText,
            format: formatText,
          } : undefined,
          refineInstruction: actionType === 'enhance' ? 'ড্রাফট করা রোল, টাস্ক, কনটেক্সট এবং ফরম্যাটকে আরও গভীর, প্রফেশনাল ও সুনির্দিষ্ট করে উন্নত করো।' : textToSend,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            data = deepSanitizeToTumiTomar(json.data) as RTCFResult;
          } else {
            data = synthesizeClientRTCF(textToSend, { role: roleText, task: taskText, context: contextText, format: formatText });
          }
        } else {
          data = synthesizeClientRTCF(textToSend, { role: roleText, task: taskText, context: contextText, format: formatText });
        }
      } catch (_fetchErr) {
        data = synthesizeClientRTCF(textToSend, { role: roleText, task: taskText, context: contextText, format: formatText });
      }
      
      // Populate RTCF Pillars
      setRoleText(data.roleBn);
      setTaskText(data.taskBn);
      setContextText(data.contextBn);
      setFormatText(data.formatBn);
      setPromptTitle(data.title || 'RTCF মাস্টার প্রম্পট');
      setPromptCategory(data.category || 'সাধারণ');
      setProTips(data.proTips || []);

      // Automatically open and scroll to RTCF workspace
      setIsRTCFDrawerOpen(true);
      setTimeout(() => {
        rtcfWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 120);

    } catch (err: any) {
      console.error('RTCF Error:', err);
      const fallbackData = synthesizeClientRTCF(textToSend, { role: roleText, task: taskText, context: contextText, format: formatText });
      setRoleText(fallbackData.roleBn);
      setTaskText(fallbackData.taskBn);
      setContextText(fallbackData.contextBn);
      setFormatText(fallbackData.formatBn);
      setPromptTitle(fallbackData.title || 'RTCF মাস্টার প্রম্পট');
      setPromptCategory(fallbackData.category || 'সাধারণ');
      setProTips(fallbackData.proTips || []);
      setIsRTCFDrawerOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleClearAll = () => {
    setRawThought('');
    setRoleText('');
    setTaskText('');
    setContextText('');
    setFormatText('');
    setPromptTitle('');
    setProTips([]);
  };

  return (
    <div className="space-y-7 font-['Hind_Siliguri',sans-serif] max-w-4xl mx-auto">
      
      {/* 1. Distinctive Cyber Emerald & Mint Teal Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <h2 className="text-2xl sm:text-4xl md:text-[40px] font-black text-white tracking-tight leading-tight">
          RTCF প্রম্পট আর্কিটেক্ট —{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(16,185,129,0.3)]">
            নিখুঁত ও প্রফেশনাল রূপ
          </span>
        </h2>
        <p className="text-xs sm:text-sm md:text-[15px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
          যেকোনো এআইয়ের কাছে মনের মতো ওয়েবসাইট তৈরি, ছবি জেনারেশন বা জটিল কাজের জন্য আন্তর্জাতিক মানের কার্যকর প্রম্পট সাজিয়ে নাও।
        </p>
      </div>

      {/* 2. Main Distinct Emerald/Teal Chat/Input Box */}
      <div className="max-w-4xl mx-auto space-y-3">
        {errorMessage && (
          <div className="p-3.5 bg-red-950/90 border border-red-800/80 rounded-2xl text-xs sm:text-sm text-red-200 shadow-xl flex items-center justify-between gap-2 backdrop-blur-md animate-in fade-in">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white cursor-pointer p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative rounded-3xl bg-gradient-to-b from-[#081514]/98 via-[#061010]/98 to-[#030808]/98 backdrop-blur-3xl border border-emerald-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.08)] p-4 sm:p-6 transition-all duration-300 focus-within:border-emerald-500/80 focus-within:shadow-[0_0_40px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/10">
          <textarea
            value={rawThought}
            onChange={(e) => setRawThought(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (rawThought.trim() && !isLoading) {
                  handleProcessRTCF(rawThought, 'generate');
                }
              }
            }}
            rows={4}
            placeholder="এখানে তোমার ইচ্ছেমতো বর্ণনা করো (যেমন: একটি রেস্টুরেন্টের ওয়েবসাইট, সাইবারপাঙ্ক শহরের আর্ট ছবি, বা নতুন ব্যবসার প্ল্যান)..."
            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-base sm:text-[17px] text-slate-100 placeholder-slate-400/80 leading-relaxed resize-none min-h-[100px] max-h-[280px]"
          />

          <div className="flex items-center justify-between pt-3.5 border-t border-emerald-950/80 mt-1">
            <div>
              {rawThought.trim() && !isLoading ? (
                <button
                  type="button"
                  onClick={() => setRawThought('')}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-xl hover:bg-emerald-950/60 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>মুছে ফেলো</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 hidden sm:inline tracking-wide font-normal">
                  Enter চাপলে প্রম্পট তৈরি হবে • Shift+Enter নতুন লাইন
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleProcessRTCF(rawThought, 'generate')}
              disabled={isLoading || (!rawThought.trim() && !hasRTCFContent)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg ${
                (rawThought.trim() || hasRTCFContent) && !isLoading
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white shadow-emerald-600/30 ring-1 ring-white/10'
                  : 'bg-slate-900/90 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>RTCF প্রম্পট তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>RTCF প্রম্পট তৈরি করো</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. RTCF লেখার অপশন বাটন (Distinct Emerald/Teal palette, ZERO emoji) */}
        <div className="flex items-center justify-center pt-1.5">
          <button
            type="button"
            onClick={() => {
              const nextState = !isRTCFDrawerOpen;
              setIsRTCFDrawerOpen(nextState);
              if (nextState) {
                setTimeout(() => {
                  rtcfWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] border shadow-md ${
              isRTCFDrawerOpen
                ? 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/50 shadow-emerald-500/15'
                : 'bg-gradient-to-r from-slate-900/95 to-[#081816]/95 hover:from-slate-850 hover:to-[#0c221f] text-emerald-200 hover:text-white border-emerald-900/50 hover:border-emerald-500/60 shadow-black/40'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRTCFDrawerOpen ? 'RTCF লেখার অপশন বন্ধ করুন' : 'RTCF লেখার অপশন খুলুন'}</span>
            {isRTCFDrawerOpen ? <ChevronUp className="w-4 h-4 text-emerald-300" /> : <ChevronDown className="w-4 h-4 text-emerald-300" />}
          </button>
        </div>
      </div>

      {/* 4. DEDICATED INDIVIDUAL RTCF WRITING BOXES (Emerald & Teal theme) */}
      {isRTCFDrawerOpen && (
        <div 
          ref={rtcfWorkspaceRef}
          className="max-w-4xl mx-auto space-y-6 pt-3 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          {/* Main Section Header Clearly Outside */}
          <div className="flex items-center justify-between px-1 pb-2 border-b border-emerald-950/80">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                RTCF কাস্টম প্রম্পট লিখুন
              </h3>
              <p className="text-xs text-slate-400">
                প্রতিটি অংশে তোমার প্রয়োজনীয় বিবরণ লেখো এবং এআই দিয়ে আরও উন্নত করে নাও।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRTCFDrawerOpen(false)}
              className="text-xs font-medium text-slate-400 hover:text-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-950/50 transition-colors cursor-pointer border border-transparent hover:border-emerald-900/60"
            >
              বন্ধ করুন
            </button>
          </div>

          {/* 4 Individual Spacious Boxes with Titles Outside */}
          <div className="space-y-6">
            
            {/* Box 1: Role */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span>Role (ভূমিকা / পারসোনা):</span>
                </span>
                {roleText && (
                  <button
                    type="button"
                    onClick={() => handleCopy(roleText, 'copy-role')}
                    className="text-xs text-emerald-300/80 hover:text-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'copy-role' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'copy-role' ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                )}
              </div>
              <div className="relative rounded-3xl bg-gradient-to-b from-[#081514]/98 to-[#040c0b]/98 backdrop-blur-3xl border border-emerald-900/40 shadow-[0_14px_45px_rgba(0,0,0,0.7)] p-4 sm:p-5 transition-all duration-300 focus-within:border-emerald-500/80 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/10">
                <textarea
                  value={roleText}
                  onChange={(e) => setRoleText(e.target.value)}
                  rows={3}
                  placeholder="যেমন: তুমি একজন বিশ্বমানের সিনিয়র সফটওয়্যার আর্কিটেক্ট ও ফুল-স্ট্যাক ইঞ্জিনিয়ার..."
                  className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm sm:text-base text-slate-100 placeholder-slate-400/80 leading-relaxed resize-none min-h-[85px]"
                />
              </div>
            </div>

            {/* Box 2: Task */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-bold text-teal-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
                  <span>Task (মূল কাজ / উদ্দেশ্য):</span>
                </span>
                {taskText && (
                  <button
                    type="button"
                    onClick={() => handleCopy(taskText, 'copy-task')}
                    className="text-xs text-teal-300/80 hover:text-teal-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'copy-task' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'copy-task' ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                )}
              </div>
              <div className="relative rounded-3xl bg-gradient-to-b from-[#081514]/98 to-[#040c0b]/98 backdrop-blur-3xl border border-teal-900/40 shadow-[0_14px_45px_rgba(0,0,0,0.7)] p-4 sm:p-5 transition-all duration-300 focus-within:border-teal-500/80 focus-within:shadow-[0_0_30px_rgba(45,212,191,0.22)] ring-1 ring-teal-500/10">
                <textarea
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  rows={3}
                  placeholder="যেমন: একটি রেসপনসিভ আধুনিক ওয়েবসাইট তৈরি করার স্টেপ-বাই-স্টেপ আর্কিটেকচার ও কোড দাও..."
                  className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm sm:text-base text-slate-100 placeholder-slate-400/80 leading-relaxed resize-none min-h-[85px]"
                />
              </div>
            </div>

            {/* Box 3: Context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span>Context (প্রেক্ষাপট ও টেকনিক্যাল শর্ত):</span>
                </span>
                {contextText && (
                  <button
                    type="button"
                    onClick={() => handleCopy(contextText, 'copy-context')}
                    className="text-xs text-cyan-300/80 hover:text-cyan-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'copy-context' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'copy-context' ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                )}
              </div>
              <div className="relative rounded-3xl bg-gradient-to-b from-[#081514]/98 to-[#040c0b]/98 backdrop-blur-3xl border border-cyan-900/40 shadow-[0_14px_45px_rgba(0,0,0,0.7)] p-4 sm:p-5 transition-all duration-300 focus-within:border-cyan-500/80 focus-within:shadow-[0_0_30px_rgba(34,211,238,0.22)] ring-1 ring-cyan-500/10">
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  rows={3}
                  placeholder="যেমন: React, Tailwind CSS ব্যবহার হবে, ক্লিন কোড ও মোবাইল রেসপনসিভনেস নিশ্চিত করতে হবে..."
                  className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm sm:text-base text-slate-100 placeholder-slate-400/80 leading-relaxed resize-none min-h-[85px]"
                />
              </div>
            </div>

            {/* Box 4: Format */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#6ee7b7]" />
                  <span>Format (আউটপুট ফরম্যাট ও নিয়ম):</span>
                </span>
                {formatText && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formatText, 'copy-format')}
                    className="text-xs text-emerald-300/80 hover:text-emerald-100 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'copy-format' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'copy-format' ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                )}
              </div>
              <div className="relative rounded-3xl bg-gradient-to-b from-[#081514]/98 to-[#040c0b]/98 backdrop-blur-3xl border border-emerald-900/40 shadow-[0_14px_45px_rgba(0,0,0,0.7)] p-4 sm:p-5 transition-all duration-300 focus-within:border-emerald-400/80 focus-within:shadow-[0_0_30px_rgba(52,211,153,0.22)] ring-1 ring-emerald-500/10">
                <textarea
                  value={formatText}
                  onChange={(e) => setFormatText(e.target.value)}
                  rows={3}
                  placeholder="যেমন: ১) ফাইল স্ট্রাকচার, ২) পূর্ণাঙ্গ কম্পোনেন্ট কোড ব্লক, ৩) রান ও টেস্ট করার গাইড..."
                  className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm sm:text-base text-slate-100 placeholder-slate-400/80 leading-relaxed resize-none min-h-[85px]"
                />
              </div>
            </div>

          </div>

          {/* Action Bar (Clear & AI Enhance) */}
          <div className="flex items-center justify-between pt-3 px-1">
            <div>
              {hasRTCFContent && (
                <button
                  type="button"
                  onClick={() => {
                    setRoleText('');
                    setTaskText('');
                    setContextText('');
                    setFormatText('');
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-200 transition-colors py-2 px-3.5 rounded-xl hover:bg-emerald-950/60 cursor-pointer border border-transparent hover:border-emerald-900/60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>মুছে ফেলো</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleProcessRTCF('', 'enhance')}
              disabled={isLoading || !hasRTCFContent}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-xl ${
                hasRTCFContent && !isLoading
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white shadow-emerald-600/30 ring-1 ring-white/10'
                  : 'bg-slate-900/90 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>এআই দিয়ে উন্নত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>এআই দিয়ে আরও উন্নত করো</span>
                </>
              )}
            </button>
          </div>

          {/* Master Output & Copy Box */}
          {hasRTCFContent && (
            <div className="pt-4 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>একত্রে সম্পূর্ণ মাস্টার RTCF প্রম্পট:</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-slate-400 hover:text-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>সব মুছে ফেলো</span>
                </button>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-[#030908] border border-emerald-900/50 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-sans shadow-inner ring-1 ring-emerald-500/10">
                {masterPromptBn}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/80 cursor-pointer transition-colors shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>শেয়ার করো</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(masterPromptBn, 'master-copy')}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:opacity-95 text-white shadow-lg shadow-emerald-600/30 active:scale-[0.98] cursor-pointer"
                >
                  {copiedKey === 'master-copy' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>সম্পূর্ণ প্রম্পট কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>সম্পূর্ণ RTCF প্রম্পট কপি করো</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Pro Tips */}
          {proTips.length > 0 && (
            <div className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-900/40 text-xs sm:text-sm text-slate-300 space-y-2 shadow-sm">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ব্যবহারের কার্যকারী টিপস:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                {proTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsShareOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-gradient-to-b from-[#081816] to-[#030908] border border-emerald-800/80 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/80">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>RTCF প্রম্পট শেয়ার করো</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsShareOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${masterPromptBn}\n\n— Assistant RTCF প্রম্পট (${window.location.href})`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#25D366]/15 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/25 transition-colors"
              >
                <span>হোয়াটসঅ্যাপ</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(masterPromptBn)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#0088cc]/15 text-[#38bdf8] text-xs font-semibold hover:bg-[#0088cc]/25 transition-colors"
              >
                <span>টেলিগ্রাম</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${masterPromptBn.slice(0, 200)}...\n\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                <span>টুইটার (X)</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(masterPromptBn);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-600/25"
            >
              {shareCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{shareCopied ? 'কপি হয়েছে!' : 'পুরো প্রম্পট কপি করো'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
