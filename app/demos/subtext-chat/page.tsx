"use client";

import { useState, useRef, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { Language, t } from "@/lib/i18n";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { ProbabilityChart } from "@/components/ProbabilityChart";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface JevAnswer {
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  noul?: number;
  score?: number;
  levels?: string[];
}

interface Condition {
  id: string;
  label: string;
  active: boolean;
  severity: "low" | "medium" | "high" | "critical";
  why: string;
}

interface RadarData {
  answers: Record<string, JevAnswer>;
  conditions: Condition[];
  latency: {
    chatMs: number;
    jevMs: number;
    totalMs: number;
  };
  usage: any;
}

interface RadarHistory {
  turn: number;
  data: RadarData;
}

const PRESETS_EN = [
  { label: "Soft complaint about double charge", message: "Hi Maya, I noticed I was charged twice this month. Can you help me understand what happened?" },
  { label: "Polite but threatening churn", message: "I've been a customer for 2 years but the recent price increase is making me reconsider. Are there any options for me?" },
  { label: "Vague competitor research", message: "Hi, just browsing. How does your pricing compare to other solutions? What's your enterprise tier like?" },
  { label: "Free chat", message: "" },
];

const PRESETS_HE = [
  { label: "תלונה רכה על חיוב כפול", message: "היי מיה, שמתי לב שחויבתי פעמיים החודש. את יכולה לעזור לי להבין מה קרה?" },
  { label: "נימוסי אבל מאיים בעזיבה", message: "אני לקוח כבר שנתיים אבל העלייה במחיר גורמת לי לשקול מחדש. יש לי איזה אופציות?" },
  { label: "מחקר מתחרים מעורפל", message: "היי, רק מסתכל. איך התמחור שלכם משתווה לפתרונות אחרים? מה יש לכם ברמת ארגוני?" },
  { label: "צ׳אט חופשי", message: "" },
];

export default function SubtextChatPage() {
  const [lang, setLang] = useState<Language>("he");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radarHistory, setRadarHistory] = useState<RadarHistory[]>([]);
  const [conditionChanges, setConditionChanges] = useState<Array<{ turn: number; condition: string; active: boolean }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presets = lang === "he" ? PRESETS_HE : PRESETS_EN;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    const messageToSend = input.trim();
    
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subtext-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, locale: lang }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error || `API error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      setMessages(data.messages);

      const newRadarData: RadarData = {
        answers: data.jev.answers,
        conditions: data.conditions,
        latency: data.latency,
        usage: data.usage,
      };

      const turn = Math.floor(data.messages.filter((m: Message) => m.role === "user").length);
      setRadarHistory((prev) => [...prev, { turn, data: newRadarData }]);

      // Track condition changes
      if (radarHistory.length > 0) {
        const prevConditions = radarHistory[radarHistory.length - 1].data.conditions;
        data.conditions.forEach((cond: Condition) => {
          const prevCond = prevConditions.find((c: Condition) => c.id === cond.id);
          if (prevCond && prevCond.active !== cond.active) {
            setConditionChanges((prev) => [
              ...prev,
              { turn, condition: cond.label, active: cond.active },
            ]);
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(errorMsg);
      setInput(messageToSend);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentRadar = radarHistory.length > 0 ? radarHistory[radarHistory.length - 1].data : null;

  const severityColors: Record<string, string> = {
    low: "border-blue-600 bg-blue-900/20",
    medium: "border-yellow-600 bg-yellow-900/20",
    high: "border-orange-600 bg-orange-900/20",
    critical: "border-red-600 bg-red-900/20",
  };

  return (
    <div className="min-h-screen lab-grid">
      <NavBar lang={lang} onLanguageToggle={() => setLang(lang === "he" ? "en" : "he")} />

      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 text-blue-400 glow">
            {t(lang, "demo9")}
          </h1>
          <p className="text-gray-400">
            {lang === "he"
              ? "צ׳אט עם מיה מתמיכת לקוחות + רדאר סאבטקסט חי שמזהה כוונות, רגשות ותנאים"
              : "Chat with Maya from customer support + live subtext radar detecting intent, emotion, and conditions"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: Chat */}
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-900/30 bg-gray-900/50 p-6 backdrop-blur-sm h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-blue-300">
                  {lang === "he" ? "צ׳אט עם מיה" : "Chat with Maya"}
                </h2>
                <div className="text-xs text-gray-500 font-mono">
                  gemini-3.8-flash
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 && (
                  <div className="text-center mt-16">
                    <div className="text-gray-500 mb-3">
                      {lang === "he"
                        ? "בחר הקדמה או התחל לכתוב..."
                        : "Choose a preset or start typing..."}
                    </div>
                    <div className="text-xs text-gray-600">
                      {lang === "he"
                        ? "דורש OPENROUTER_API_KEY ב־Vercel"
                        : "Requires OPENROUTER_API_KEY in Vercel"}
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-100 border border-gray-700"
                      }`}
                    >
                      <div className="text-xs mb-1 opacity-70">
                        {msg.role === "user"
                          ? lang === "he"
                            ? "אתה"
                            : "You"
                          : "Maya"}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-4 py-2">
                      <div className="text-xs mb-1 opacity-70">Maya</div>
                      <div className="text-sm">
                        {lang === "he" ? "מקלידה..." : "Typing..."}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="space-y-2">
                {error && (
                  <div className="rounded-lg border border-red-600 bg-red-900/20 px-4 py-3 flex items-start gap-3">
                    <span className="text-red-400 text-lg">⚠️</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-red-300 mb-1">
                        {lang === "he" ? "שגיאה" : "Error"}
                      </div>
                      <div className="text-sm text-red-200">
                        {error.includes("OPENROUTER_API_KEY") ? (
                          <>
                            {lang === "he" ? (
                              <>
                                <strong>OPENROUTER_API_KEY</strong> לא מוגדר. יש להגדיר את המפתח ב־Vercel.
                              </>
                            ) : (
                              <>
                                <strong>OPENROUTER_API_KEY</strong> not configured. Please set the key in Vercel.
                              </>
                            )}
                          </>
                        ) : (
                          error
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    lang === "he"
                      ? "כתוב הודעה... (Enter לשליחה)"
                      : "Type a message... (Enter to send)"
                  }
                  className="w-full rounded-lg border border-blue-900/30 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading
                    ? lang === "he"
                      ? "שולח..."
                      : "Sending..."
                    : lang === "he"
                    ? "שלח"
                    : "Send"}
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="rounded-xl border border-blue-900/30 bg-gray-900/50 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                {lang === "he" ? "תרחישים להתחלה" : "Starting Scenarios"}
              </h3>
              <div className="grid gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (preset.message) {
                        setInput(preset.message);
                      }
                    }}
                    className="rounded border border-blue-900/30 bg-gray-800/50 px-3 py-2 text-left text-sm text-gray-300 hover:border-blue-700 hover:bg-gray-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Subtext Radar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-900/30 bg-gray-900/50 p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 text-purple-300">
                {lang === "he" ? "🎯 רדאר סאבטקסט" : "🎯 Subtext Radar"}
              </h2>

              {!currentRadar && (
                <div className="text-center text-gray-500 py-16">
                  {lang === "he"
                    ? "הרדאר יופעל לאחר ההודעה הראשונה"
                    : "Radar will activate after first message"}
                </div>
              )}

              {currentRadar && (
                <div className="space-y-6">
                  {/* Conditions Panel */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                      {lang === "he" ? "מנוע תנאים" : "Conditions Engine"}
                    </h3>
                    <div className="space-y-2">
                      {currentRadar.conditions.map((cond) => (
                        <div
                          key={cond.id}
                          className={`rounded-lg border-2 p-3 transition-all ${
                            cond.active
                              ? `${severityColors[cond.severity]} pulse-glow`
                              : "border-gray-800 bg-gray-900/30 opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold text-sm ${cond.active ? "glow" : ""}`}>
                              {cond.active ? "✓" : "○"} {cond.label}
                            </span>
                            <span className="text-xs uppercase text-gray-500">
                              {cond.severity}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{cond.why}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nouls */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                      {lang === "he" ? "סיכויים (Nouls)" : "Probabilities (Nouls)"}
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(currentRadar.answers)
                        .filter(([_, answer]) => answer.noul !== undefined)
                        .map(([key, answer]) => (
                          <ConfidenceBar
                            key={key}
                            label={key.replace(/_/g, " ")}
                            value={answer.noul!}
                          />
                        ))}
                    </div>
                  </div>

                  {/* Choices */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                      {lang === "he" ? "בחירות" : "Choices"}
                    </h3>
                    {Object.entries(currentRadar.answers)
                      .filter(([_, answer]) => answer.choice !== undefined)
                      .map(([key, answer]) => (
                        <div key={key} className="mb-4">
                          <div className="text-xs text-gray-500 mb-2 uppercase">
                            {key.replace(/_/g, " ")}
                          </div>
                          <ProbabilityChart
                            probabilities={answer.probabilities!}
                            selected={answer.choice}
                          />
                        </div>
                      ))}
                  </div>

                  {/* Scores */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">
                      {lang === "he" ? "ציונים" : "Scores"}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(currentRadar.answers)
                        .filter(([_, answer]) => answer.score !== undefined)
                        .map(([key, answer]) => (
                          <div
                            key={key}
                            className="rounded border border-blue-900/30 bg-gray-900/30 p-3"
                          >
                            <div className="text-xs text-gray-400 mb-1">
                              {key.replace(/_/g, " ")}
                            </div>
                            <div className="text-xl font-bold text-blue-400">
                              {answer.score?.toFixed(1)}/{(answer.levels?.length || 4) - 1}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                    <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        {lang === "he" ? "זמן צ׳אט" : "Chat Latency"}
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {currentRadar.latency.chatMs}ms
                      </div>
                    </div>
                    <div className="rounded border border-blue-900/30 bg-gray-900/30 p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        {lang === "he" ? "זמן Jev" : "Jev Latency"}
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {currentRadar.latency.jevMs}ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Condition Timeline */}
            {conditionChanges.length > 0 && (
              <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-4 backdrop-blur-sm">
                <h3 className="text-sm font-bold mb-3 text-yellow-400 uppercase">
                  {lang === "he" ? "ציר זמן שינויי תנאים" : "Condition Change Timeline"}
                </h3>
                <div className="space-y-2">
                  {conditionChanges.slice(-5).map((change, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-300 flex items-center gap-2"
                    >
                      <span className="font-mono text-gray-500">Turn {change.turn}:</span>
                      <span className={change.active ? "text-green-400" : "text-red-400"}>
                        {change.active ? "▲" : "▼"}
                      </span>
                      <span>{change.condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why it matters */}
            <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold mb-2 text-yellow-400 uppercase tracking-wide">
                {t(lang, "whyItMatters")}
              </h3>
              <p className="text-sm text-gray-300">
                {lang === "he"
                  ? "במקום לסמוך רק על מה שנאמר, Jev מנתח את השכבה התחתונה - כוונות נסתרות, רגשות אמיתיים, ותנאים שצריך להפעיל. מנוע תנאים מפעיל פעולות (העברה, הנחה, התראה) לפי אירועים. זה הפער בין מה שהלקוח אומר למה שהוא רוצה באמת."
                  : "Instead of trusting only what's said, Jev analyzes the subtext layer - hidden agendas, true emotions, and conditions that should trigger. The conditions engine activates actions (escalate, discount, alert) based on events. This is the gap between what the customer says and what they really want."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
