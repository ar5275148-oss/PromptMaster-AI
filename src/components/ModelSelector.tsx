import React, { useState } from 'react';
import { ALL_AI_MODELS } from '../data/modelsData';
import { SupportedModelId } from '../types';
import { Bot, Check, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ModelSelectorProps {
  selectedModelId: SupportedModelId;
  onSelectModel: (id: SupportedModelId) => void;
  lang: 'bn' | 'en';
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  lang,
}) => {
  const isBn = lang === 'bn';
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedModel = ALL_AI_MODELS.find((m) => m.id === selectedModelId) || ALL_AI_MODELS[0];

  const categories = [
    { id: 'all', labelBn: 'সব মডেল (২০টি)', labelEn: 'All Models (20)' },
    { id: 'flagship', labelBn: 'ফ্ল্যাগশিপ চ্যাটবট', labelEn: 'Flagship' },
    { id: 'reasoning', labelBn: 'ডিপ রিজনিং ও অংক', labelEn: 'Reasoning' },
    { id: 'search', labelBn: 'সার্চ ও রিসার্চ', labelEn: 'Search & RAG' },
    { id: 'open', labelBn: 'ওপেন সোর্স', labelEn: 'Open Weights' },
    { id: 'enterprise', labelBn: 'এন্টারপ্রাইজ', labelEn: 'Enterprise' },
    { id: 'image', labelBn: 'ইমেজ ও ভিজুয়াল', labelEn: 'Visual / Image' },
  ];

  const filteredModels = ALL_AI_MODELS.filter((m) => {
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bestFor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#0b1120] border border-slate-800/80 rounded-2xl p-4 sm:p-5 transition-all">
      {/* Top Active Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              {isBn ? 'লক্ষ্য এআই চ্যাটবট নির্বাচন করো' : 'Target AI Chatbot Selected'}
            </span>
            <span className="text-slate-600 font-mono text-xs">/</span>
            <span className="text-xs text-blue-400 font-medium font-mono">{selectedModel.name}</span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-200 mt-0.5">
            {isBn ? selectedModel.taglineBn : selectedModel.tagline}
          </h2>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-all hover:border-blue-500/50"
        >
          <span>{isExpanded ? (isBn ? 'সংক্ষেপ করো' : 'Collapse') : (isBn ? 'সব এআই দেখো (২০টি)' : 'Change Model (20)')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Model Chips Carousel (Always visible quick bar) */}
      {!isExpanded && (
        <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {ALL_AI_MODELS.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/80 text-blue-300 font-semibold shadow-sm shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
                <span>{model.name.split(' ')[0]}</span>
                {isSelected && <Check className="w-3 h-3 text-blue-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded Model Directory */}
      {isExpanded && (
        <div className="pt-4 space-y-4 animate-in fade-in duration-200">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-xs no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    filterCategory === cat.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.labelBn}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'মডেল খুঁজুন (যেমন: Claude, DeepSeek)...' : 'Search AI model...'}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80"
              />
            </div>
          </div>

          {/* Models Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredModels.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsExpanded(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-900/20'
                      : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <span className="text-xs font-bold text-slate-200">{model.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-medium text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">
                        {isBn ? 'সক্রিয়' : 'Active'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {model.company}
                  </p>
                  
                  <div className="mt-2 text-[11px] text-slate-300 font-sans line-clamp-2">
                    {isBn ? model.bestForBn : model.bestFor}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Secret Sauce Callout */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
        <Bot className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300 mr-1.5">
            {isBn ? `${selectedModel.name}-এর গোপন সূত্র:` : `${selectedModel.name} Secret Formula:`}
          </span>
          <span className="text-slate-300/90 leading-relaxed font-sans">
            {isBn ? selectedModel.secretFormulaBn : selectedModel.secretFormula}
          </span>
        </div>
      </div>
    </div>
  );
};
