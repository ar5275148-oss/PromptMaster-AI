import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Check, X, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { getStoredGeminiKeys, saveStoredGeminiKeys } from '../utils/apiHelper';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(getStoredGeminiKeys());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddKey = () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    if (keys.includes(trimmed)) {
      setNewKeyInput('');
      return;
    }
    const updated = [...keys, trimmed];
    setKeys(updated);
    saveStoredGeminiKeys(updated);
    setNewKeyInput('');
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleRemoveKey = (index: number) => {
    const updated = keys.filter((_, idx) => idx !== index);
    setKeys(updated);
    saveStoredGeminiKeys(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleSaveAll = () => {
    saveStoredGeminiKeys(keys);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 font-['Hind_Siliguri',sans-serif] animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-gradient-to-b from-[#0d1527] via-[#090f1d] to-[#050912] border border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.2)] p-4 sm:p-7 relative overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Key className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-white tracking-wide truncate">
                এপিআই কি অটো-রোটেশন সেটিংস
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                একাধিক জেমিনি এপিআই কি যুক্ত করো
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700/60 shrink-0"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="py-4 sm:py-5 space-y-4 sm:space-y-5">
          
          {/* Info Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/25 flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-cyan-200/90 leading-relaxed">
              <strong className="text-cyan-300 font-semibold block mb-0.5 sm:mb-1">অটো-রোটেশন সুবিধা:</strong>
              একাধিক কি যোগ করলে কোটা শেষ হলে সিস্টেম স্বয়ংক্রিয়ভাবে পরবর্তী কি-তে সুইচ করবে।
            </div>
          </div>

          {/* Add Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              নতুন জেমিনি এপিআই কি যোগ করো
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddKey();
                }}
                placeholder="AIzaSy..."
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={handleAddKey}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>যুক্ত করো</span>
              </button>
            </div>
          </div>

          {/* Keys List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>সংরক্ষিত কি ({keys.length}টি)</span>
              {keys.length > 0 && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  সক্রিয় পুল
                </span>
              )}
            </div>

            {keys.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-1">
                <AlertCircle className="w-7 h-7 text-slate-500 mx-auto mb-1.5 opacity-60" />
                <p className="font-semibold text-slate-300">কোনো অতিরিক্ত কি যোগ করা হয়নি।</p>
                <p className="text-[11px] text-slate-500">ডিফল্ট সিস্টেম কি দিয়ে সচল রয়েছে।</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {keys.map((k, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-mono text-slate-300 truncate">
                        {k.substring(0, 6)}••••••{k.substring(k.length - 4)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveKey(index)}
                      className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-all cursor-pointer shrink-0"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
          {savedMessage ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>সফলভাবে সংরক্ষিত!</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 text-center sm:text-left">
              লোকালস্টোরেজে নিরাপদে সংরক্ষিত।
            </span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
            >
              বন্ধ করো
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>সংরক্ষণ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
