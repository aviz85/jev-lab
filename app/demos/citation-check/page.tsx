"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Language, t } from "@/lib/i18n";

const PRESETS = [
  {
    claim: "The product ships within 24 hours",
    evidence: "All orders are processed and shipped within one business day."
  },
  {
    claim: "Users get unlimited storage",
    evidence: "Premium accounts include 1TB of cloud storage."
  },
  {
    claim: "The platform supports 50+ languages",
    evidence: "Currently available in English, Spanish, French, German, and Chinese."
  },
];

export default function CitationCheckPage() {
  const [lang, setLang] = useState<Language>("he");
  const [claim, setClaim] = useState(PRESETS[0].claim);
  const [evidence, setEvidence] = useState(PRESETS[0].evidence);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/citation-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, evidence }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    approved: "bg-green-900/50 border-green-700 text-green-200",
    review: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
    rejected: "bg-red-900/50 border-red-700 text-red-200",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo3")}
        description={lang === "he" ? "אימות טענות מול ראיות עם סף ביטחון" : "Verify claims against evidence with confidence thresholds"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "תפסו ציטוטים שגויים או הלוצינציות לפני שהם מגיעים לייצור. בדיקה אוטומטית אם הציטוט תומך בטענה. ביטחון נמוך → סקירה אנושית. חוסך זמן עריכה ומגן על אמינות." : "Catch wrong citations or hallucinations before they reach production. Automatically check if the quote supports the claim. Low confidence → human review. Saves editing time and protects credibility."}
        results={result && (
          <div className="space-y-6">
            <div className={`rounded-lg border p-6 ${statusColors[result.status]}`}>
              <div className="text-sm font-bold uppercase mb-2">Status</div>
              <div className="text-3xl font-bold">{result.status}</div>
              {result.needsReview && (
                <div className="mt-2 text-sm opacity-80">⚠️ Needs human review</div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Verdict</h3>
              <div className="text-xl font-bold text-blue-400 mb-4">{result.verdict}</div>
              <ProbabilityChart probabilities={result.probabilities} selected={result.verdict} />
            </div>

            <ConfidenceBar
              value={result.confidence}
              label="Confidence"
              threshold={0.75}
            />
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
                  setClaim(preset.claim);
                  setEvidence(preset.evidence);
                }}
                className="w-full rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 transition-colors"
              >
                <div className="font-medium">{preset.claim}</div>
                <div className="text-xs text-gray-500 mt-1">{preset.evidence}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Claim</label>
            <input
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-2 text-gray-100"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Evidence</label>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
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