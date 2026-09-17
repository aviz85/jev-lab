"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { Language, t } from "@/lib/i18n";

const SAMPLE_QUESTIONS = [
  "How do I delete my account?",
  "What happens to my data after deletion?",
  "Can I use automated bots?",
  "Who owns the content I post?",
];

export default function ToSFinderPage() {
  const [lang, setLang] = useState<Language>("he");
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tos-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo6")}
        description={lang === "he" ? "חיפוש סמנטי על פני שורות מסמך" : "Semantic search across document lines"}
        metrics={result ? { latency: result.latency, tokens: result.usage.input_tokens + result.usage.output_tokens } : undefined}
        whyItMatters={lang === "he" ? "במקום אינדקס וקטורי, העבירו את כל השורות כאופציות Choice. מצאו את השורה הטובה ביותר בבקשה אחת. מושלם למסמכים מובנים: תנאי שימוש, מדיניות, חוקים. 218 שורות בקריאה אחת." : "Instead of a vector index, pass all lines as Choice options. Find the best line in one request. Perfect for structured docs: ToS, policies, laws. 218 lines in one call."}
        results={result && (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-900/30 bg-blue-900/20 p-6">
              <div className="text-sm text-gray-400 mb-2">Line {result.lineNumber}</div>
              <div className="text-lg font-medium text-blue-300">
                {result.selectedLine}
              </div>
            </div>

            <ConfidenceBar
              value={result.confidence}
              label="Selection Confidence"
              threshold={0.7}
            />

            <div>
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                Document Contains Answer
              </h3>
              <ConfidenceBar
                value={result.containsAnswer}
                label={`${Math.round(result.containsAnswer * 100)}%`}
              />
            </div>

            <details className="rounded-lg border border-gray-700 bg-gray-900/30 p-4">
              <summary className="cursor-pointer text-sm font-bold text-gray-400 uppercase">
                Full Document (40 lines)
              </summary>
              <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
                {result.document.split('\n').map((line: string, idx: number) => (
                  <div
                    key={idx}
                    className={`text-sm px-2 py-1 rounded ${
                      idx + 1 === result.lineNumber
                        ? "bg-blue-900/30 border-l-2 border-blue-500 text-blue-300"
                        : "text-gray-400"
                    }`}
                  >
                    <span className="text-gray-600 mr-2">{idx + 1}.</span>
                    {line}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">{t(lang, "presets")}</label>
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setQuestion(q)}
                className="w-full rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the ToS..."
            className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-3 text-gray-100"
            rows={3}
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