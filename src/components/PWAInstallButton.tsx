import React, { useState } from 'react';
import { Download, Check, X, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'menu' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as standalone app, show subtle check badge or return null
  if (isInstalled) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>অ্যাপটি সফলভাবে ডিভাইসে ইনস্টল করা আছে</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Fallback guide if browser doesn't trigger beforeinstallprompt yet
      setShowIOSGuide(true);
    }
  };

  // Header Button Variant
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
          title="ডিভাইসে অ্যাপ ইনস্টল করুন"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
          <span className="hidden xs:inline">অ্যাপ ইনস্টল</span>
          <span className="xs:hidden">ইনস্টল</span>
        </button>

        {/* Guided Modal */}
        {showIOSGuide && (
          <InstallGuideModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Menu Drawer Item Variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`w-full p-4 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-slate-900 border border-blue-500/40 hover:border-cyan-400/80 text-left flex items-start gap-4 transition-all duration-300 shadow-md hover:shadow-cyan-500/20 active:scale-[0.98] cursor-pointer group ${className}`}
      >
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-bold text-white tracking-wide">
              মোবাইলে / পিসিতে অ্যাপ ইনস্টল করুন
            </span>
            <span className="text-[11px] font-semibold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60">
              PWA App
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            কোনো প্লে-স্টোর ছাড়াই হোম স্ক্রিনে সরাসরি ইনস্টল করে অ্যাপের মতো ফুল-স্ক্রিনে ব্যবহার করো।
          </p>
        </div>
      </button>

      {showIOSGuide && (
        <InstallGuideModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

// Clean Guided Modal for iOS / Desktop / Android
const InstallGuideModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-slate-700/90 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px]">
              <div className="w-full h-full bg-[#0b1120] rounded-[10px] flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white">
              {isIOS ? 'iPhone / iPad এ ইনস্টল করার নিয়ম' : 'মোবাইল বা কম্পিউটারে ইনস্টল'}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-blue-600/20 text-cyan-400 shrink-0 mt-0.5">
                <Share className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">১. Safari ব্রাউজারের নিচে থাকা Share বাটনে ট্যাপ করো।</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 shrink-0 mt-0.5">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">২. একটু নিচে স্ক্রল করে "Add to Home Screen" অপশনটি সিলেক্ট করো।</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-300 shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">৩. ওপরে "Add" চাপলেই হোমস্ক্রিনে অ্যাপ আইকন চলে আসবে!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-blue-600/20 text-cyan-400 shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">১. Chrome / Edge ব্রাউজারের ৩ ডট মেনুতে ক্লিক করো।</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 shrink-0 mt-0.5">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">২. "Install app" বা "Add to Home Screen" এ ক্লিক করো।</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-300 shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">৩. নিশ্চিত করলেই হোম স্ক্রিনে অ্যাপের লোগো তৈরি হয়ে যাবে!</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold cursor-pointer transition-opacity"
        >
          বুঝেছি, ধন্যবাদ
        </button>
      </div>
    </div>
  );
};
