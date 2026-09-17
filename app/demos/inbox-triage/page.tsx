"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { Language, t } from "@/lib/i18n";

const PRESETS = [
  "Help! My payouts have been failing for 3 days. Need immediate fix!",
  "Can you help me reset my password? Thanks.",
  "URGENT: Account hacked! Someone is making charges!",
  "Hi, I was wondering if you offer enterprise pricing?",
];

export default function InboxTriagePage() {
  const [lang, setLang] = useState<Language>("he");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/inbox-triage", {
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

  const routeColors: Record<string, string> = {
    quarantine: "bg-red-900/50 text-red-200 border-red-700",
    human: "bg-orange-900/50 text-orange-200 border-orange-700",
    billing: "bg-blue-900/50 text-blue-200 border-blue-700",
    orders: "bg-green-900/50 text-green-200 border-green-700",
    account: "bg-purple-900/50 text-purple-200 border-purple-700",
    general: "bg-gray-900/50 text-gray-200 border-gray-700",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo1")}
        description={
          lang === "he"
            ? "ניתוח טריאז׳ מקבילי עם שאלות מרובות וניתוב מבוסס ביטחון"
            : "Parallel triage analysis with multiple questions and confidence-gated routing"
        }
        metrics={
          result
            ? {
                latency: result.latency,
                tokens: result.usage.input_tokens + result.usage.output_tokens,
              }
            : undefined
        }
        whyItMatters={
          lang === "he"
            ? "במקום לשלוח כל כרטיס למודל גדול, בדקו מספר מאפיינים במקביל (נושא, דחיפות, ספאם) בבקשה אחת זולה. הקוד מכליל את התשובות לניתוב. עלות: 95% פחות. זמן: 90% מהר יותר."
            : "Instead of sending every ticket to a big model, check multiple properties in parallel (topic, urgency, spam) in one cheap request. Code combines the answers into routing. Cost: 95% less. Time: 90% faster."
        }
        results={
          result && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                  Route Decision
                </h3>
                <div
                  className={`rounded-lg border p-4 ${routeColors[result.route] || routeColors.general}`}
                >
                  <div className="text-2xl font-bold uppercase">
                    {result.route}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                  Topic
                </h3>
                <ProbabilityChart
                  probabilities={result.answers.topic.probabilities}
                  selected={result.answers.topic.choice}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                  Spam Risk: {Math.round(result.spamRisk * 100)}%
                </h3>
                {result.spamSignals.map((signal: any) => (
                  <ConfidenceBar
                    key={signal.name}
                    value={signal.value}
                    label={signal.name.replace(/_/g, " ")}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Urgency:</span>{" "}
                  <span className="font-mono text-blue-400">
                    {Math.round(result.answers.urgency.noul * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Frustration:</span>{" "}
                  <span className="font-mono text-blue-400">
                    {result.answers.frustration.score.toFixed(1)}/3
                  </span>
                </div>
              </div>
            </div>
          )
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">{t(lang, "presets")}</label>
            <div className="grid gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(preset)}
                  className="rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 hover:bg-gray-800 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter support ticket message..."
            className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            rows={4}
          />

          <button
            onClick={handleRun}
            disabled={loading || !message.trim()}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t(lang, "loading") : t(lang, "run")}
          </button>
        </div>
      </DemoLayout>
    </div>
  );
}