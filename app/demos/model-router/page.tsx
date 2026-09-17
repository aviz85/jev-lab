"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Language, t } from "@/lib/i18n";

const PRESETS = [
  "Write a poem about the ocean",
  "Debug this Python error: TypeError: 'NoneType' object is not subscriptable",
  "Explain quantum entanglement and provide peer-reviewed sources",
  "What's the capital of France?",
];

export default function ModelRouterPage() {
  const [lang, setLang] = useState<Language>("he");
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/model-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const routeColors: Record<string, string> = {
    flash: "bg-green-900/50 border-green-700 text-green-200",
    sonnet: "bg-blue-900/50 border-blue-700 text-blue-200",
    opus: "bg-purple-900/50 border-purple-700 text-purple-200",
    human: "bg-orange-900/50 border-orange-700 text-orange-200",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo4")}
        description={lang === "he" ? "ניתוב לרמת המודל הנכונה לפי מאפייני המשימה" : "Route to the right model tier based on task properties"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "הפסיקו לבזבז Opus על שאלות פשוטות. בדקו תחום, קושי, סיכון במקביל, אז נתבו לפי העלות. Flash למשימות פשוטות (1x), Sonnet למורכבות בינונית (3x), Opus לקריטי (10x). חסכו 70%+ בעלויות מודל." : "Stop wasting Opus on simple questions. Check domain, difficulty, risk in parallel, then route by cost. Flash for simple (1x), Sonnet for moderate (3x), Opus for critical (10x). Save 70%+ on model costs."}
        results={result && (
          <div className="space-y-6">
            <div className={`rounded-lg border p-6 ${routeColors[result.route]}`}>
              <div className="text-sm font-bold uppercase mb-2">Route</div>
              <div className="text-4xl font-bold mb-2">{result.route}</div>
              <div className="text-2xl">
                Cost: {result.relativeCost}x
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                <div className="text-gray-400">Domain</div>
                <div className="font-bold text-blue-400">{result.reasoning.domain}</div>
              </div>
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                <div className="text-gray-400">Difficulty</div>
                <div className="font-bold text-blue-400">{result.reasoning.difficulty.toFixed(1)}/3</div>
              </div>
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                <div className="text-gray-400">Risk</div>
                <div className="font-bold text-blue-400">{result.reasoning.risk.toFixed(1)}/3</div>
              </div>
              <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                <div className="text-gray-400">Needs Tools</div>
                <div className="font-bold text-blue-400">{Math.round(result.reasoning.needsTools * 100)}%</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Domain Distribution</h3>
              <ProbabilityChart
                probabilities={result.answers.domain.probabilities}
                selected={result.answers.domain.choice}
              />
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
                onClick={() => setPrompt(preset)}
                className="w-full rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt..."
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