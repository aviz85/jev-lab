"use client";

import { useState, useRef, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { DemoLayout } from "@/components/DemoLayout";
import { Language, t } from "@/lib/i18n";

interface AtomAnswer {
  noul?: number;
  score?: number;
  choice?: string;
  confidence?: number;
}

interface MoneyHackResult {
  outcome: "hack" | "maybe" | "nope" | "need_info";
  confidence: number;
  explanationEn: string;
  explanationHe: string;
  atoms: Record<string, AtomAnswer>;
  simplifyTips: string[];
  scores: {
    complexity_for_buyer?: number;
    cash_velocity?: number;
    time_to_first_shekel?: number;
  };
  hack_shape?: string;
  lowConfidenceAtoms: string[];
  latency?: number;
}

interface Variant {
  idea: string;
  result: MoneyHackResult;
}

interface RoundData {
  round: number;
  variants: Variant[];
  best: Variant;
}

const PRESETS_EN = [
  "AI bot that auto-books salon appointments via WhatsApp for ₪99/month",
  "1-click invoice generator for freelancers, ₪49 one-time",
  "Template pack: 10 ready-made client proposals, ₪199",
];

const PRESETS_HE = [
  "בוט AI שמזמין תורים בסלון אוטומטית דרך WhatsApp ב-₪99 לחודש",
  "מחולל חשבוניות בלחיצה אחת לפרילנסרים, ₪49 חד פעמי",
  "חבילת תבניות: 10 הצעות מחיר מוכנות ללקוחות, ₪199",
];

const ATOM_LABELS: Record<string, { en: string; he: string }> = {
  buyer_want_one_sentence: { en: "Clear buyer want", he: "רצון קונה ברור" },
  stranger_gets_it_30s: { en: "Graspable in 30s", he: "מובן ב-30 שניות" },
  is_simple: { en: "Simple method", he: "שיטה פשוטה" },
  audience_exists: { en: "Audience exists", he: "קהל קיים" },
  path_to_paid_short: { en: "Short path to paid", he: "נתיב קצר לתשלום" },
  payment_path_clear: { en: "Payment clear", he: "תשלום ברור" },
  sellable_this_week: { en: "Sellable this week", he: "ניתן למכור השבוע" },
  needs_new_product: { en: "Needs new product", he: "צריך מוצר חדש" },
  confidence_ship_this_week: { en: "Ship this week", he: "שליחה השבוע" },
  ai_accelerates_value: { en: "AI accelerates", he: "AI מאיץ" },
  ai_is_necessary: { en: "AI necessary", he: "AI הכרחי" },
  buyer_pays_for_simplicity: { en: "Pays for simplicity", he: "משלם עבור פשטות" },
  delivery_light: { en: "Light delivery", he: "אספקה קלה" },
  still_too_many_steps: { en: "Too many steps", he: "יותר מדי צעדים" },
  builder_only_vs_mass: { en: "Builder-only", he: "למתכנתים בלבד" },
  needs_more_idea_detail: { en: "Need more detail", he: "צריך פירוט" },
  complexity_for_buyer: { en: "Buyer complexity", he: "מורכבות לקונה" },
  cash_velocity: { en: "Cash velocity", he: "מהירות כסף" },
  time_to_first_shekel: { en: "First shekel time", he: "זמן לשקל ראשון" },
  hack_shape: { en: "Hack shape", he: "צורת hack" },
};

function AtomDisplay({
  atomKey,
  atom,
  lang,
  isLowConf,
}: {
  atomKey: string;
  atom: AtomAnswer;
  lang: Language;
  isLowConf: boolean;
}) {
  const label = ATOM_LABELS[atomKey] || { en: atomKey, he: atomKey };
  const displayLabel = lang === "he" ? label.he : label.en;

  return (
    <div
      className={`rounded border p-2 text-xs ${
        isLowConf
          ? "border-yellow-600 bg-yellow-900/20"
          : "border-gray-700 bg-gray-800/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-gray-300 font-medium">{displayLabel}</span>
        {atom.confidence != null && (
          <span
            className={`text-xs font-mono ${
              isLowConf ? "text-yellow-400" : "text-gray-400"
            }`}
          >
            {(atom.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {atom.noul != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">noul</span>
            <span className="font-mono text-blue-400">
              {(atom.noul * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                atom.noul >= 0.55
                  ? "bg-green-500"
                  : atom.noul >= 0.4
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${atom.noul * 100}%` }}
            />
          </div>
        </div>
      )}

      {atom.score != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">score</span>
            <span className="font-mono text-purple-400">
              {atom.score.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{ width: `${(atom.score / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {atom.choice != null && (
        <div className="mt-1">
          <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-200 border border-blue-700">
            {atom.choice}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MoneyHackFinderPage() {
  const [lang, setLang] = useState<Language>("he");
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [threshold, setThreshold] = useState(0.7);
  const [maxRounds, setMaxRounds] = useState(3);
  const [variantsPerRound, setVariantsPerRound] = useState(5);
  
  const [currentRound, setCurrentRound] = useState(0);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [currentVariants, setCurrentVariants] = useState<Variant[]>([]);
  const [winner, setWinner] = useState<Variant | null>(null);
  const [doneReason, setDoneReason] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const presets = lang === "he" ? PRESETS_HE : PRESETS_EN;

  const outcomeColors: Record<string, string> = {
    hack: "bg-green-900/50 text-green-200 border-green-700",
    maybe: "bg-blue-900/50 text-blue-200 border-blue-700",
    nope: "bg-red-900/50 text-red-200 border-red-700",
    need_info: "bg-gray-900/50 text-gray-200 border-gray-700",
  };

  const handleRun = async (mode: "seed" | "lucky") => {
    if (mode === "seed" && !idea.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentRound(0);
    setRoundData([]);
    setCurrentVariants([]);
    setWinner(null);
    setDoneReason(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/money-hack-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          idea: mode === "seed" ? idea : undefined,
          threshold,
          maxRounds,
          variantsPerRound,
          lang,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;
          
          const jsonStr = line.slice(6);
          const event = JSON.parse(jsonStr);

          if (event.type === "error") {
            setError(event.error);
            setLoading(false);
            return;
          }

          if (event.type === "round_start") {
            setCurrentRound(event.round);
            setCurrentVariants([]);
          }

          if (event.type === "variant_scored") {
            setCurrentVariants((prev) => [
              ...prev,
              { idea: event.idea, result: event.result },
            ]);
          }

          if (event.type === "round_complete") {
            setRoundData((prev) => [
              ...prev,
              {
                round: event.round,
                variants: event.variants,
                best: event.best,
              },
            ]);
          }

          if (event.type === "done") {
            setWinner(event.winner);
            setDoneReason(event.reason);
            setLoading(false);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar
        lang={lang}
        onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")}
      />
      <DemoLayout
        lang={lang}
        title={t(lang, "demo17")}
        description={
          lang === "he"
            ? "לולאת אבולוציה אוטומטית עם Flash לייצר גרסאות ו-Jev לשפוט כל אחת באטומים"
            : "Automated evolution loop with Flash generating variants and Jev judging each with atoms"
        }
        whyItMatters={
          lang === "he"
            ? "במקום לנחש האם רעיון הוא money hack, תנו ל-AI לייצר עשרות גרסאות ולשפוט כל אחת עם אטומים. Jev שואל שאלות ספציפיות (רצון ברור? נתיב קצר לתשלום? ניתן למכירה השבוע?) והקוד מרכיב את התשובות לפסק דין. כל סיבוב מחזיר את הטובים ביותר עד שרעיון עובר את הסף."
            : "Instead of guessing if an idea is a money hack, let AI generate dozens of variations and judge each with atoms. Jev asks specific questions (clear want? short path to paid? sellable this week?) and code composes the answers into a verdict. Each round refines the best until an idea passes threshold."
        }
        results={
          (winner || roundData.length > 0) && (
            <div className="space-y-6">
              {winner && (
                <div className="rounded-lg border-2 border-green-700 bg-green-900/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">
                      {lang === "he" ? "🏆 זוכה" : "🏆 Winner"}
                    </h3>
                    <div
                      className={`rounded border px-3 py-1 text-sm font-bold uppercase ${outcomeColors[winner.result.outcome]}`}
                    >
                      {winner.result.outcome}
                    </div>
                  </div>
                  <p className="text-gray-100 mb-4">{winner.idea}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {lang === "he" ? "ביטחון:" : "Confidence:"}
                      </span>
                      <span className="font-mono text-green-400">
                        {(winner.result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-gray-300">
                      {lang === "he"
                        ? winner.result.explanationHe
                        : winner.result.explanationEn}
                    </div>
                    {winner.result.simplifyTips.length > 0 && (
                      <div className="mt-3">
                        <div className="text-gray-400 mb-1">
                          {lang === "he" ? "טיפים:" : "Tips:"}
                        </div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          {winner.result.simplifyTips.map((tip, idx) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {winner.result.atoms &&
                      Object.keys(winner.result.atoms).length > 0 && (
                        <details className="mt-4 group">
                          <summary className="cursor-pointer text-gray-400 hover:text-gray-300 text-xs font-medium">
                            {lang === "he"
                              ? `📊 אטומי שיפוט (${Object.keys(winner.result.atoms).length})`
                              : `📊 Judgment Atoms (${Object.keys(winner.result.atoms).length})`}
                          </summary>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {Object.entries(winner.result.atoms).map(
                              ([key, atom]) => (
                                <AtomDisplay
                                  key={key}
                                  atomKey={key}
                                  atom={atom}
                                  lang={lang}
                                  isLowConf={winner.result.lowConfidenceAtoms?.includes(
                                    key
                                  )}
                                />
                              )
                            )}
                          </div>
                        </details>
                      )}
                  </div>
                  {doneReason && (
                    <div className="mt-4 text-xs text-gray-500">
                      {lang === "he" ? "סיבה: " : "Reason: "}
                      {doneReason === "threshold_met"
                        ? lang === "he"
                          ? "עבר את הסף"
                          : "Threshold met"
                        : doneReason === "plateau"
                          ? lang === "he"
                            ? "השיפור התייצב"
                            : "Score plateaued"
                          : lang === "he"
                            ? "הגיע למקסימום סיבובים"
                            : "Max rounds reached"}
                    </div>
                  )}
                </div>
              )}

              {roundData.map((round) => (
                <div
                  key={round.round}
                  className="rounded-lg border border-blue-900/30 bg-gray-900/50 p-4"
                >
                  <h4 className="text-sm font-bold mb-3 text-blue-400">
                    {lang === "he" ? "סיבוב" : "Round"} {round.round}
                  </h4>
                  <div className="space-y-2">
                    {round.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        className={`rounded border p-3 ${
                          idx === 0
                            ? "border-blue-600 bg-blue-900/20"
                            : "border-gray-700 bg-gray-800/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 text-sm text-gray-200">
                            {variant.idea}
                          </div>
                          <div
                            className={`rounded border px-2 py-1 text-xs font-bold uppercase whitespace-nowrap ${outcomeColors[variant.result.outcome]}`}
                          >
                            {variant.result.outcome}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>
                            {lang === "he" ? "ביטחון:" : "Conf:"}{" "}
                            {(variant.result.confidence * 100).toFixed(0)}%
                          </span>
                          {variant.result.scores.complexity_for_buyer !=
                            null && (
                            <span>
                              {lang === "he" ? "מורכבות:" : "Complexity:"}{" "}
                              {variant.result.scores.complexity_for_buyer.toFixed(
                                1
                              )}
                              /3
                            </span>
                          )}
                          {variant.result.scores.cash_velocity != null && (
                            <span>
                              {lang === "he" ? "מהירות כסף:" : "Cash:"}{" "}
                              {variant.result.scores.cash_velocity.toFixed(1)}
                              /3
                            </span>
                          )}
                          {variant.result.latency && (
                            <span>{variant.result.latency}ms</span>
                          )}
                        </div>
                        {variant.result.atoms &&
                          Object.keys(variant.result.atoms).length > 0 && (
                            <details className="mt-3 group">
                              <summary className="cursor-pointer text-gray-400 hover:text-gray-300 text-xs font-medium">
                                {lang === "he"
                                  ? `📊 אטומים (${Object.keys(variant.result.atoms).length})`
                                  : `📊 Atoms (${Object.keys(variant.result.atoms).length})`}
                              </summary>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {Object.entries(variant.result.atoms).map(
                                  ([key, atom]) => (
                                    <AtomDisplay
                                      key={key}
                                      atomKey={key}
                                      atom={atom}
                                      lang={lang}
                                      isLowConf={variant.result.lowConfidenceAtoms?.includes(
                                        key
                                      )}
                                    />
                                  )
                                )}
                              </div>
                            </details>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {loading && currentVariants.length > 0 && (
                <div className="rounded-lg border border-yellow-900/30 bg-yellow-900/10 p-4">
                  <h4 className="text-sm font-bold mb-3 text-yellow-400">
                    {lang === "he" ? "סיבוב נוכחי" : "Current Round"}{" "}
                    {currentRound}
                  </h4>
                  <div className="space-y-2">
                    {currentVariants.map((variant, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-gray-700 bg-gray-800/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 text-sm text-gray-200">
                            {variant.idea}
                          </div>
                          <div
                            className={`rounded border px-2 py-1 text-xs font-bold uppercase ${outcomeColors[variant.result.outcome]}`}
                          >
                            {variant.result.outcome}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {lang === "he" ? "ביטחון:" : "Conf:"}{" "}
                          {(variant.result.confidence * 100).toFixed(0)}%
                        </div>
                        {variant.result.atoms &&
                          Object.keys(variant.result.atoms).length > 0 && (
                            <details className="mt-2 group" open>
                              <summary className="cursor-pointer text-gray-400 hover:text-gray-300 text-xs font-medium mb-2">
                                {lang === "he"
                                  ? `📊 אטומים חיים (${Object.keys(variant.result.atoms).length})`
                                  : `📊 Live Atoms (${Object.keys(variant.result.atoms).length})`}
                              </summary>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(variant.result.atoms).map(
                                  ([key, atom]) => (
                                    <AtomDisplay
                                      key={key}
                                      atomKey={key}
                                      atom={atom}
                                      lang={lang}
                                      isLowConf={variant.result.lowConfidenceAtoms?.includes(
                                        key
                                      )}
                                    />
                                  )
                                )}
                              </div>
                            </details>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-600 bg-red-900/20 px-4 py-3">
              <div className="text-sm font-bold text-red-300 mb-1">
                {lang === "he" ? "שגיאה" : "Error"}
              </div>
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-400">
              {t(lang, "presets")}
            </label>
            <div className="grid gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setIdea(preset)}
                  className="rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 hover:bg-gray-800 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={
              lang === "he"
                ? "תאר רעיון money hack בסיסי או השאר ריק ל-I'm Feeling Lucky..."
                : "Describe a basic money hack idea or leave empty for I'm Feeling Lucky..."
            }
            className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            rows={3}
            disabled={loading}
          />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {lang === "he" ? "סף (maybe)" : "Threshold (maybe)"}
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                disabled={loading}
                className="w-full rounded border border-blue-900/30 bg-gray-800 px-3 py-2 text-sm text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {lang === "he" ? "מקסימום סיבובים" : "Max Rounds"}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxRounds}
                onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                disabled={loading}
                className="w-full rounded border border-blue-900/30 bg-gray-800 px-3 py-2 text-sm text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                {lang === "he" ? "גרסאות לסיבוב" : "Variants/Round"}
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={variantsPerRound}
                onChange={(e) => setVariantsPerRound(parseInt(e.target.value))}
                disabled={loading}
                className="w-full rounded border border-blue-900/30 bg-gray-800 px-3 py-2 text-sm text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRun("seed")}
              disabled={loading || !idea.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && idea.trim()
                ? lang === "he"
                  ? "מחפש..."
                  : "Finding..."
                : lang === "he"
                  ? "מצא hacks"
                  : "Find Hacks"}
            </button>
            <button
              onClick={() => handleRun("lucky")}
              disabled={loading}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && !idea.trim()
                ? lang === "he"
                  ? "מרגיש בר מזל..."
                  : "Feeling Lucky..."
                : lang === "he"
                  ? "אני מרגיש בר מזל"
                  : "I'm Feeling Lucky"}
            </button>
          </div>

          {loading && (
            <button
              onClick={handleStop}
              className="w-full rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              {lang === "he" ? "עצור" : "Stop"}
            </button>
          )}

          {loading && (
            <div className="rounded-lg border border-yellow-900/30 bg-yellow-900/10 p-3">
              <div className="text-xs text-yellow-400">
                {lang === "he"
                  ? `סיבוב ${currentRound} מתוך ${maxRounds} • כבר ${currentVariants.length} גרסאות נשפטו`
                  : `Round ${currentRound} of ${maxRounds} • ${currentVariants.length} variants judged so far`}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-xs text-gray-400">
            <div className="font-bold mb-2 text-gray-300">
              {lang === "he" ? "איך זה עובד:" : "How it works:"}
            </div>
            <ol className="space-y-1">
              <li>
                {lang === "he"
                  ? "1. Flash (Gemini) מייצר גרסאות של הרעיון"
                  : "1. Flash (Gemini) generates variations of the idea"}
              </li>
              <li>
                {lang === "he"
                  ? "2. Jev שופט כל אחת עם אטומים (רצון ברור? נתיב קצר? ניתן למכירה?)"
                  : "2. Jev judges each with atoms (clear want? short path? sellable?)"}
              </li>
              <li>
                {lang === "he"
                  ? "3. הקוד מרכיב פסק דין: hack / maybe / nope / need_info"
                  : "3. Code composes verdict: hack / maybe / nope / need_info"}
              </li>
              <li>
                {lang === "he"
                  ? "4. סיבוב הבא משפר את הטובים ביותר עד שעוברים סף"
                  : "4. Next round refines the best until threshold is met"}
              </li>
            </ol>
          </div>
        </div>
      </DemoLayout>
    </div>
  );
}
