"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { MetricCard } from "@/components/MetricCard";
import { Language, t } from "@/lib/i18n";
import { demos } from "@/lib/demos";
import Link from "next/link";

export default function Home() {
  const [lang, setLang] = useState<Language>("he");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "he" ? "en" : "he"));
  };

  return (
    <div className="min-h-screen">
      <NavBar lang={lang} onLanguageToggle={toggleLanguage} />

      <main className="lab-grid min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-4 glow">
              <span className="text-blue-400">{t(lang, "title")}</span>
            </h1>
            <p className="text-2xl text-gray-400 mb-2">{t(lang, "subtitle")}</p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              {t(lang, "description")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-16">
            <MetricCard
              label={t(lang, "modelUsed")}
              value="jev-latest"
              icon="⚡"
            />
            <MetricCard
              label={t(lang, "demos")}
              value={demos.length}
              unit="interactive"
              icon="🧪"
            />
            <MetricCard
              label="System One"
              value="Primitives"
              icon="🔬"
            />
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-blue-300">
              {t(lang, "demos")}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {demos.map((demo) => (
                <Link
                  key={demo.id}
                  href={demo.path}
                  className="group relative overflow-hidden rounded-xl border border-blue-900/30 bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-500/50 hover:bg-gray-900/70"
                >
                  <div className="mb-4 text-5xl">{demo.icon}</div>
                  <h3 className="mb-2 text-xl font-bold text-blue-400 group-hover:glow">
                    {t(lang, demo.titleKey)}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {lang === "he" ? demo.descriptionHe : demo.descriptionEn}
                  </p>
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-900/30 bg-gray-900/30 p-8 backdrop-blur-sm text-center">
            <h3 className="text-2xl font-bold mb-4 text-blue-300">
              {lang === "he" ? "על המעבדה" : "About the Lab"}
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              {lang === "he"
                ? "מעבדת Jev בנויה עם TypeSafe System One - גישה חדשה לבינה מלאכותית שבה קוד שולט ו-AI מחזיר משפטים מובנים. Jev = מודל החלטות, לא מודל טקסט. כל הדגמה מציגה דפוס אמיתי: ניתוב, אימות, ניקוד, ושערים. לא צעצוע צ'אט - פרימיטיבים שניתן לתכנת. TypeSafe יצאו מסתר ספטמבר 2026, ~$40M seed."
                : "Jev Lab is built with TypeSafe System One—a new approach where code stays in control and AI returns structured judgments. Jev = decision model, not text generation. Each demo shows a real pattern: routing, verification, scoring, and gates. Not a chat toy—programmable primitives. TypeSafe exited stealth Sep 2026, ~$40M seed (DCVC)."}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="https://docs.typesafe.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {lang === "he" ? "מסמכים →" : "Documentation →"}
              </a>
              <a
                href="https://twitter.com/typesafeai"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-blue-600 px-6 py-3 font-medium text-blue-400 hover:bg-blue-600/10 transition-colors"
              >
                @typesafeai
              </a>
            </div>
          </div>

          <footer className="mt-16 text-center text-sm text-gray-500">
            <p className="mb-2">
              {lang === "he"
                ? "נבנה עם TypeSafe System One (Jev) על ידי @aviz85"
                : "Built with TypeSafe System One (Jev) by @aviz85"}
            </p>
            <p>
              {lang === "he"
                ? "לא קשור רשמית ל-TypeSafe AI | מעבדת אוהדים עצמאית"
                : "Not officially affiliated with TypeSafe AI | Independent fan lab"}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {lang === "he"
                ? "מייסדים: @CompleteSkeptic, Erik Gafni, Sasha Sheng | משמש ב-Vercel (@cramforce)"
                : "Founders: @CompleteSkeptic, Erik Gafni, Sasha Sheng | Used by Vercel (@cramforce)"}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
