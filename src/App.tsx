import React, { useState } from 'react';
import { Header } from './components/Header';
import { PromptArchitect } from './components/PromptArchitect';
import { TextPolisher } from './components/TextPolisher';
import { RTCFArchitect } from './components/RTCFArchitect';
import { SupportedModelId, TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('architect');
  const [selectedModelId, setSelectedModelId] = useState<SupportedModelId>('chatgpt');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 overflow-x-clip w-full max-w-full">
      {/* Top Header with Three-line Menu */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoClick={() => setActiveTab('architect')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-40 sm:pb-52 space-y-6 overflow-x-clip">
        {activeTab === 'architect' && (
          <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full">
            {/* Welcome / Hero Section */}
            <div className="text-center max-w-3xl mx-auto pt-2 pb-2 sm:py-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                তোমার মনের কথাকে রূপান্তর করো{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                  সবচেয়ে দামী মাস্টার প্রম্পটে
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 mt-2.5 leading-relaxed font-sans max-w-2xl mx-auto">
                ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity সহ ২০+ এআই চ্যাটবটকে কীভাবে কথা বললে সবচেয়ে বুদ্ধিদীপ্ত ও নিখুঁত উত্তর পাবে—তা এআই নিজে বিশ্লেষণ করে তৈরি করে দেবে।
              </p>
            </div>

            {/* Core Prompt Architect Workspace */}
            <PromptArchitect
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              lang="bn"
            />
          </div>
        )}

        {activeTab === 'rtcf' && (
          <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full">
            <RTCFArchitect />
          </div>
        )}

        {activeTab === 'polisher' && (
          <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-full">
            <TextPolisher />
          </div>
        )}
      </main>

      {/* Respectful Bottom Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a12] py-6 text-center text-xs text-slate-400 font-['Hind_Siliguri',sans-serif] mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Assistant — তোমার বুদ্ধিমত্তা, প্রম্পট পারফেকশন ও মুগ্ধকর লেখার বিশ্বস্ত প্ল্যাটফর্ম</span>
          <span className="text-xs text-slate-500">
            {activeTab === 'architect' 
              ? 'মাস্টার প্রম্পট আর্কিটেকচার ইঞ্জিন' 
              : activeTab === 'rtcf' 
                ? 'আন্তর্জাতিক RTCF প্রম্পট ফ্রেমওয়ার্ক ইঞ্জিন' 
                : 'মুগ্ধকর ভাষা ও সাহিত্যিক পরিমার্জন ইঞ্জিন'}
          </span>
        </div>
      </footer>
    </div>
  );
}
