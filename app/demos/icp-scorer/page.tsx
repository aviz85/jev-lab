"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { Language, t } from "@/lib/i18n";

const DEFAULT_COMPANY = "Series B SaaS company building API observability for microservices teams";
const DEFAULT_ICP = "Growing engineering teams (50-500 devs) at B2B SaaS companies struggling with distributed tracing and service health visibility";

export default function ICPScorerPage() {
  const [lang, setLang] = useState<Language>("he");
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [icp, setIcp] = useState(DEFAULT_ICP);
  const [weights, setWeights] = useState({
    industry_fit: 0.25,
    maturity: 0.2,
    buyer_relevance: 0.3,
    pain_alignment: 0.25,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [storedAnswers, setStoredAnswers] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/icp-scorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, icp, weights }),
      });
      const data = await response.json();
      setResult(data);
      setStoredAnswers(data.answers);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: string, value: number) => {
    const newWeights = { ...weights, [key]: value };
    setWeights(newWeights);
    
    if (storedAnswers) {
      const normalize = (score: number) => score / 3;
      const compositeScore =
        normalize(storedAnswers.industry_fit.score) * newWeights.industry_fit +
        normalize(storedAnswers.maturity.score) * newWeights.maturity +
        normalize(storedAnswers.buyer_relevance.score) * newWeights.buyer_relevance +
        normalize(storedAnswers.pain_alignment.score) * newWeights.pain_alignment;
      
      const totalScore = compositeScore * 100;
      let recommendation: string;
      if (totalScore >= 75 && result.purchaseIntent > 0.6) {
        recommendation = "high-priority";
      } else if (totalScore >= 60) {
        recommendation = "qualified";
      } else if (totalScore >= 40) {
        recommendation = "nurture";
      } else {
        recommendation = "disqualify";
      }
      
      setResult({
        ...result,
        compositeScore: totalScore,
        weights: newWeights,
        recommendation,
      });
    }
  };

  const recColors: Record<string, string> = {
    "high-priority": "bg-green-900/50 border-green-700 text-green-200",
    "qualified": "bg-blue-900/50 border-blue-700 text-blue-200",
    "nurture": "bg-yellow-900/50 border-yellow-700 text-yellow-200",
    "disqualify": "bg-red-900/50 border-red-700 text-red-200",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo8")}
        description={lang === "he" ? "ניקוד מורכב עם משקלים ניתנים לכוונון" : "Composite scoring with adjustable weights"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "שאלו 4 מאפייני ICP פעם אחת, שמרו את המשפטים גולמיים. קוד משקלל אותם לניקוד סופי. כוונן משקלים בזמן אמת ללא קריאה מחדש ל-API. המשפטים הופכים לתכונות ML. יצירת תכונות אוטומטית עבור מודלים מסורתיים." : "Ask 4 ICP dimensions once, store raw judgments. Code weights them into final score. Adjust weights in real-time without re-calling API. Judgments become ML features. Automated feature engineering for classical models."}
        results={result && (
          <div className="space-y-6">
            <div className={`rounded-lg border p-6 ${recColors[result.recommendation]}`}>
              <div className="text-sm font-bold uppercase mb-2">Recommendation</div>
              <div className="text-3xl font-bold mb-2">{result.recommendation}</div>
              <div className="text-2xl">{Math.round(result.compositeScore)} / 100</div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase flex items-center justify-between">
                <span>Score Components</span>
                <span className="text-xs font-normal text-gray-500">Adjust weights ↓</span>
              </h3>
              {Object.entries(result.scores).map(([key, score]: [string, any]) => (
                <div key={key} className="mb-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-300">{key.replace(/_/g, " ")}</span>
                    <span className="font-mono text-blue-400">{score.toFixed(1)}/3</span>
                  </div>
                  <ConfidenceBar value={score / 3} label="" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={weights[key as keyof typeof weights]}
                    onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    Weight: {weights[key as keyof typeof weights].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Purchase Intent</h3>
              <ConfidenceBar
                value={result.purchaseIntent}
                label={`${Math.round(result.purchaseIntent * 100)}%`}
              />
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Company Description</label>
            <textarea
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-2 text-gray-100"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Ideal Customer Profile</label>
            <textarea
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
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