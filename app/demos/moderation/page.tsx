"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { Language, t } from "@/lib/i18n";

const PRESETS = [
  "This is the best product ever! You should definitely buy it!",
  "I hate you all and you should all die in a fire.",
  "My phone number is 555-0123 and my SSN is 123-45-6789.",
  "Just mix bleach and ammonia for the best cleaning solution!",
];

export default function ModerationPage() {
  const [lang, setLang] = useState<Language>("he");
  const [message, setMessage] = useState(PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
    warn: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
    review: "bg-orange-900/50 border-orange-700 text-orange-200",
    block: "bg-red-900/50 border-red-700 text-red-200",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo7")}
        description={lang === "he" ? "מטריצת מודרציה בזמן אמת" : "Real-time content moderation matrix"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "בדקו טוקסיות, הטרדה, ספאם, PII, עצות מסוכנות במקביל. מטריצה: חומרה × ביטחון → allow/warn/review/block. מהיר מספיק לזמן אמת, מדויק מספיק לקנה מידה." : "Check toxicity, harassment, spam, PII, unsafe advice in parallel. Matrix: severity × confidence → allow/warn/review/block. Fast enough for real-time, accurate enough to scale."}
        results={result && (
          <div className="space-y-6">
            <div className={`rounded-lg border p-6 ${actionColors[result.action]}`}>
              <div className="text-sm font-bold uppercase mb-2">Action</div>
              <div className="text-4xl font-bold">{result.action}</div>
              <div className="mt-2 text-sm">
                Max Violation: {Math.round(result.maxViolation * 100)}% | 
                Severity: {result.severity.toFixed(1)}/3
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Violations</h3>
              <div className="space-y-3">
                {result.violations.map((v: any) => (
                  <ConfidenceBar
                    key={v.type}
                    value={v.value}
                    label={v.type}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-4">
                <div className="text-xs text-gray-400 mb-1">Severity Score</div>
                <div className="text-2xl font-bold text-blue-400">
                  {result.severity.toFixed(2)}
                </div>
              </div>
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-4">
                <div className="text-xs text-gray-400 mb-1">Confidence</div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(result.confidence * 100)}%
                </div>
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
                onClick={() => setMessage(preset)}
                className="w-full rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to moderate..."
            className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-3 text-gray-100"
            rows={4}
          />

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