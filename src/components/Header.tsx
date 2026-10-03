import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  BookOpen, 
  Layers, 
  X, 
  ChevronRight, 
  Check, 
  Zap, 
  SlidersHorizontal,
  Key
} from 'lucide-react';
import { TabType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { ApiKeySettingsModal } from './ApiKeySettingsModal';

interface HeaderProps {
  onLogoClick?: () => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogoClick,
  activeTab = 'architect',
  setActiveTab,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsApiKeyModalOpen(false);
      }
    };
    if (isMenuOpen || isApiKeyModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, isApiKeyModalOpen]);

  const handleSelectTab = (tab: TabType) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    setIsMenuOpen(false);
  };

  const getSubheaderTitle = () => {
    if (activeTab === 'architect') return 'মাস্টার প্রম্পট আর্কিটেক্ট';
    if (activeTab === 'polisher') return 'কথা গুছিয়ে নাও';
    if (activeTab === 'rtcf') return 'RTCF ফ্রেমওয়ার্ক জেনারেটর';
    return 'Assistant';
  };

  const getActiveBadgeText = () => {
    if (activeTab === 'architect') return 'মাস্টার প্রম্পট মোড';
    if (activeTab === 'polisher') return 'লেখা গুছানোর মোড';
    if (activeTab === 'rtcf') return 'RTCF ফ্রেমওয়ার্ক মোড';
    return 'Assistant';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#070b14]/95 border-b border-slate-800/80 shadow-md font-['Hind_Siliguri',sans-serif]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: Logo & Assistant Name */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
              onClick={() => {
                if (onLogoClick) onLogoClick();
              }}
            >
              {/* AI Assistant Logo */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/25">
                <div className="w-full h-full bg-[#0b1120] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-cyan-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                </div>
              </div>

              {/* Name: Assistant */}
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-white font-['Hind_Siliguri',sans-serif] leading-tight">
                  Assistant
                </span>
                <span className="text-[10px] sm:text-[11px] text-cyan-400/90 font-medium tracking-wide hidden xs:inline">
                  {getSubheaderTitle()}
                </span>
              </div>
            </div>

            {/* Right Side: PWA Install Button, Active Mode Indicator & Three-Line Menu Button */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* PWA App Install Button in Header */}
              <PWAInstallButton variant="header" />

              {/* Current Active Mode Subtle Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {getActiveBadgeText()}
                </span>
              </div>

              {/* থ্রি লাইন অপশন (Three-line Menu Button) */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-100 shadow-md hover:shadow-cyan-500/10 transition-all active:scale-95 cursor-pointer group"
                title="মেনু খুলুন — সব ফিচার ও অপশন দেখুন"
                aria-label="মেনু অপশন"
                aria-expanded={isMenuOpen}
              >
                {/* আইকনিক ৩টি অনুভূমিক লাইন (Clean 3 Horizontal Lines) */}
                <div className="flex flex-col justify-center items-center gap-1 w-4 h-3.5">
                  <span className="w-4 h-[2px] bg-slate-200 group-hover:bg-cyan-400 rounded-full transition-colors" />
                  <span className="w-4 h-[2px] bg-slate-200 group-hover:bg-cyan-400 rounded-full transition-colors" />
                  <span className="w-4 h-[2px] bg-slate-200 group-hover:bg-cyan-400 rounded-full transition-colors" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide text-white group-hover:text-cyan-300">
                  মেনু
                </span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* থ্রি লাইন মেনুতে ক্লিক করলে প্রদর্শিত ফুল স্ক্রিন/স্লাইড মেনু ড্রয়ার (Ultra-Luxury & Clean Hub) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl animate-in fade-in duration-300 flex justify-end font-['Hind_Siliguri',sans-serif]"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md h-full bg-gradient-to-b from-[#0d1527]/98 via-[#090f1d]/98 to-[#050912]/98 border-l border-slate-700/80 shadow-[0_0_80px_rgba(0,0,0,0.95)] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 ring-1 ring-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Section */}
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/25">
                    <div className="w-full h-full bg-[#0b1120] rounded-[14px] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide flex items-center gap-1.5">
                      <span>ফিচার হাব ও মেনু</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      পছন্দের ফিচার বেছে নিয়ে ব্যবহার করো
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/60 shadow-sm"
                  title="মেনু বন্ধ করো"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Install App CTA in Menu Drawer */}
              <div>
                <PWAInstallButton variant="menu" />
              </div>

              {/* Menu Items List */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>উপলব্ধ ফিচারসমূহ</span>
                  <span className="text-[11px] text-cyan-400 lowercase font-normal">৩টি মোড</span>
                </div>

                {/* Option 1: মাস্টার প্রম্পট আর্কিটেক্ট (Blue Theme) */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('architect')}
                  className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative group overflow-hidden ${
                    activeTab === 'architect'
                      ? 'bg-gradient-to-r from-blue-950/60 to-[#0c1a36]/80 border-blue-500/90 shadow-[0_8px_30px_rgba(37,99,235,0.25)] ring-1 ring-blue-400/40'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-blue-500/40 shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-105 duration-300 ${
                    activeTab === 'architect'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20'
                      : 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                        মাস্টার প্রম্পট আর্কিটেক্ট
                      </span>
                      {activeTab === 'architect' ? (
                        <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/80 shadow-sm">
                          <Check className="w-3 h-3 text-cyan-400" />
                          সক্রিয়
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-normal">
                      ChatGPT, Claude, Gemini সহ ২০+ এআইয়ের জন্য নিখুঁত মাস্টার প্রম্পট তৈরি করো।
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-blue-300/90 px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-800/50">
                        ২০+ মডেল সাপোর্ট
                      </span>
                    </div>
                  </div>
                </button>

                {/* Option 2: RTCF প্রম্পট ফ্রেমওয়ার্ক (Cyber Emerald Theme) */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('rtcf')}
                  className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative group overflow-hidden ${
                    activeTab === 'rtcf'
                      ? 'bg-gradient-to-r from-emerald-950/60 to-[#09221d]/80 border-emerald-500/90 shadow-[0_8px_30px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-500/40 shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-105 duration-300 ${
                    activeTab === 'rtcf'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/20'
                      : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                        RTCF প্রম্পট ফ্রেমওয়ার্ক
                      </span>
                      {activeTab === 'rtcf' ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 shadow-sm">
                          <Check className="w-3 h-3 text-emerald-400" />
                          সক্রিয়
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-normal">
                      ওয়েবসাইট তৈরি, ছবি জেনারেশন বা জটিল কাজের জন্য Role, Task, Context, Format ফ্রেমওয়ার্ক।
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-300/90 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/50">
                        আন্তর্জাতিক স্ট্যান্ডার্ড
                      </span>
                    </div>
                  </div>
                </button>

                {/* Option 3: কথা গুছিয়ে নাও (Golden Amber Theme) */}
                <button
                  type="button"
                  onClick={() => handleSelectTab('polisher')}
                  className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative group overflow-hidden ${
                    activeTab === 'polisher'
                      ? 'bg-gradient-to-r from-amber-950/60 to-[#261b0c]/80 border-amber-500/90 shadow-[0_8px_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-amber-500/40 shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-105 duration-300 ${
                    activeTab === 'polisher'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 ring-1 ring-white/20'
                      : 'bg-amber-600/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                        কথা গুছিয়ে নাও
                      </span>
                      {activeTab === 'polisher' ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-300 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 shadow-sm">
                          <Check className="w-3 h-3 text-amber-400" />
                          সক্রিয়
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-normal">
                      এলোমেলো মনের ভাবনাকে সাহিত্যিক, বিনয়ী ও মুগ্ধকর ভাষায় তাৎক্ষণিক সাজিয়ে নাও।
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-amber-300/90 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/50">
                         মুগ্ধকর রূপান্তর
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {/* API Key Settings Button in Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsApiKeyModalOpen(true);
                }}
                className="w-full text-left p-4 rounded-3xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors block">
                      এপিআই কি অটো-রোটেশন সেটিংস
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      একাধিক জেমিনি কি যুক্ত করো
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              {/* Extra Highlights Banner */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2.5 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>স্মার্ট অটোমেশন ফিচার</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  যে কোনো লেখার গভীরতা বুঝে নিয়ে স্বয়ংক্রিয়ভাবে সর্বোত্তম আউটপুট নিশ্চিত করতে সিস্টেম সবসময় সক্রিয়।
                </p>
              </div>

            </div>

            {/* Drawer Bottom Action */}
            <div className="pt-5 border-t border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 border border-slate-700/80 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg"
              >
                মেনু বন্ধ করো
              </button>
            </div>

          </div>
        </div>
      )}

      {/* API Key Settings Modal */}
      <ApiKeySettingsModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
      />
    </>
  );
};
