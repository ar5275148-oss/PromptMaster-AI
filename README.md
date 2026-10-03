# Assistant — Universal AI Prompt Architect & Studio 🚀

> বিশ্বমানের এআই মাস্টার প্রম্পট আর্কিটেক্ট, RTCF ফ্রেমওয়ার্ক জেনারেটর এবং কথা গুছিয়ে নেওয়ার সর্বাধুনিক বাংলা এআই প্ল্যাটফর্ম।

![Assistant App](public/pwa-512x512.png)

---

## 🌟 মূল ফিচারসমূহ

1. **মাস্টার প্রম্পট আর্কিটেক্ট (Prompt Architect):**
   - ChatGPT, Claude, Gemini, DeepSeek, Midjourney সহ ২০+ এআই চ্যাটবটের জন্য অপ্টিমাইজড মাস্টার প্রম্পট তৈরি।
2. **RTCF ফ্রেমওয়ার্ক জেনারেটর (RTCF Architect):**
   - যেকোনো প্রোজেক্টের জন্য Role, Task, Context, Format ফ্রেমওয়ার্ক ড্রাফট ও এআই দিয়ে পারফেক্ট করা।
3. **কথা গুছিয়ে নাও (Text Polisher):**
   - এলোমেলো চিন্তা বা অনুভূতিকে প্রফেশনাল, সাহিত্যিক, বিনয়ী ও মুগ্ধকর ভাষায় সাজিয়ে নেওয়া।
4. **PWA অ্যাপ সাপোর্ট (Installable App):**
   - যেকোনো মোবাইল বা পিসিতে সরাসরি অ্যাপের মতো ইনস্টল করে ফুলস্ক্রিনে ব্যবহার করার সুবিধা।

---

## 🚀 গিটহাব ও গিটহাব পেইজে রান করার নিয়ম (GitHub & GitHub Pages Setup)

তুমি খুব সহজেই এই সম্পূর্ণ প্রজেক্টটি গিটহাবে আপলোড করে **GitHub Pages**-এর মাধ্যমে ফ্রিতে ওয়েবসাইট হিসেবে সারা বিশ্বের জন্য লাইভ চালাতে পারো:

### ধাপ ১: গিটহাবে নতুন রিপোজিটরি তৈরি
1. [GitHub](https://github.com/) এ গিয়ে **New repository** তৈরি করো (যেমন: `assistant-ai`)।
2. রিপোজিটরিটি Public রাখো।

### ধাপ ২: কোড গিটহাবে পুশ (Push) করো
টার্মিনালে প্রজেক্ট ফোল্ডারে এসে নিচের কমান্ডগুলো চালাও:
```bash
git init
git add .
git commit -m "Initial commit for Assistant AI"
git branch -M main
git remote add origin https://github.com/তোমার_ইউজারনেম/assistant-ai.git
git push -u origin main
```

### ধাপ ৩: GitHub Pages সক্রিয় করো
1. তোমার গিটহাব রিপোজিটরির **Settings** ট্যাবে যাও।
2. বাম পাশের মেনু থেকে **Pages** এ ক্লিক করো।
3. **Build and deployment** সেকশনের **Source** ড্রপডাউনে **"GitHub Actions"** নির্বাচন করো।
4. ব্যস! আমাদের প্রজেক্টে যুক্ত থাকা `.github/workflows/deploy.yml` স্বয়ংক্রিয়ভাবে প্রজেক্টটি বিল্ড করে লাইভ করে দেবে।
5. কয়েক মিনিটের মধ্যেই তোমার সাইটের লাইভ লিংক তৈরি হয়ে যাবে (যেমন: `https://তোমার_ইউজারনেম.github.io/assistant-ai/`)।

> 💡 **নোট:** GitHub Pages-এ সাইটটি লাইভ হওয়ার পর তুমি সাইটের মেনুতে গিয়ে **"এপিআই কি অটো-রোটেশন সেটিংস"**-এ তোমার Gemini API Key যুক্ত করে নিতে পারো। এতে ব্রাউজার থেকেই সরাসরি এআই কাজ করবে!

---

## 💻 লোকাল কম্পিউটারে রান করার নিয়ম (Local Setup)

### ১. ডিপেন্ডেন্সি ইনস্টল করো
```bash
npm install
```

### ২. এনভায়রনমেন্ট ফাইল তৈরি
একটি `.env` ফাইল তৈরি করে তোমার API Key যুক্ত করো:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### ৩. ডেভেলপমেন্ট সার্ভার চালু করো
```bash
npm run dev
```
ব্রাউজারে `http://localhost:3000` এ প্রবেশ করলেই অ্যাপটি চালু হয়ে যাবে!

### ৪. প্রোডাকশন বিল্ড তৈরি
```bash
npm run build
```

---

## 📱 মোবাইল ও কম্পিউটারে ইনস্টল করার নিয়ম (PWA)

- **অ্যান্ড্রয়েড / ক্রোম:** ব্রাউজারে অ্যাপটি খুলে ওপরের **"অ্যাপ ইনস্টল"** বাটনে ট্যাপ করো অথবা ব্রাউজারের ৩-ডট মেনু থেকে **"Install app"** / **"Add to Home screen"** সিলেক্ট করো।
- **আইফোন (iOS Safari):** Safari-এর নিচে থাকা **Share** আইকনে ট্যাপ করে **"Add to Home Screen"** সিলেক্ট করো।

---

## 🛠️ ব্যবহৃত টেকনোলজি

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Build Tool:** Vite 8, `vite-plugin-pwa`, Workbox
- **Backend (Optional):** Express, Node.js, TSX, `@google/genai`

---
Developed with ❤️ by Assistant Team.
