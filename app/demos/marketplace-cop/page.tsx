"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { Language, t } from "@/lib/i18n";

const PRESETS = [
  { title: "iPhone 13 Pro Replica", description: "Brand new, same quality as original. Buy now!" },
  { title: "Handmade Ceramic Mug", description: "Beautiful handcrafted coffee mug, food-safe glaze." },
  { title: "Leave 5⭐ review = $10 gift card", description: "Premium headphones with noise cancellation." },
];

export default function MarketplaceCopPage() {
  const [lang, setLang] = useState<Language>("he");
  const [title, setTitle] = useState(PRESETS[0].title);
  const [description, setDescription] = useState(PRESETS[0].description);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/marketplace-cop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const actionColors: Record<string, string> = {
    allow: "bg-green-900/50 border-green-700 text-green-200",
    review: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
    block: "bg-red-900/50 border-red-700 text-red-200",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo5")}
        description={lang === "he" ? "אכיפת מדיניות תוכן אוטומטית" : "Automated content policy enforcement"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "מכפילים פריטים מזויפים, ביקורות מתוגמלות, תוכן אסור. בדקו הכל במקביל בשיחה אחת. קוד משקלל חומרה → allow/review/block. מהיר מספיק לקנה מידה, זול מספיק לכל רישום." : "Counterfeit items, incentivized reviews, prohibited content multiply. Check everything in parallel in one call. Code weights severity → allow/review/block. Fast enough to scale, cheap enough for every listing."}
        results={result && (
          <div className="space-y-6">
            <div className={`rounded-lg border p-6 ${actionColors[result.action]}`}>
              <div className="text-sm font-bold uppercase mb-2">Action</div>
              <div className="text-4xl font-bold">{result.action}</div>
              <div className="mt-2 text-sm">
                Violation Score: {Math.round(result.violationScore * 100)}%
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Flags</h3>
              <div className="space-y-2">
                {Object.entries(result.flags).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{key}</span>
                    <span className={value ? "text-red-400" : "text-green-400"}>
                      {value ? "⚠️ Yes" : "✓ No"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Severity</h3>
              <ConfidenceBar
                value={result.answers.severity.score / 3}
                label={`${result.answers.severity.score.toFixed(1)} / 3`}
              />
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Category</h3>
              <div className="text-lg font-bold text-blue-400">
                {result.answers.category.choice}
                <span className="text-sm text-gray-400 ml-2">
                  ({Math.round(result.answers.category.confidence * 100)}% confidence)
                </span>
              </div>
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">{t(lang, "presets")}</label>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTitle(preset.title);
                  setDescription(preset.description);
                }}
                className="w-full rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 transition-colors"
              >
                <div className="font-medium">{preset.title}</div>
                <div className="text-xs text-gray-500">{preset.description}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-2 text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-2 text-gray-100"
              rows={3}
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t(lang, "loading") : t(lang, "run")}
          </button>
        </div>
      </DemoLayout>
    </div>
  );
}