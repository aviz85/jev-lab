import { NextRequest } from "next/server";
import { evaluateIdea, type MoneyHackResult } from "@/lib/moneyHackFinder";

interface RequestBody {
  mode: "seed" | "lucky";
  idea?: string;
  threshold?: number;
  maxRounds?: number;
  variantsPerRound?: number;
  lang?: "en" | "he";
}

interface Variant {
  idea: string;
  result: MoneyHackResult;
}

async function generateVariants(
  seedIdea: string | null,
  count: number,
  round: number,
  previousBest: Variant | null,
  lang: "en" | "he"
): Promise<string[]> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const chatModel = process.env.CHAT_MODEL || "google/gemini-3.8-flash";

  if (!openRouterKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  let prompt: string;
  
  if (!seedIdea && !previousBest) {
    prompt = lang === "he"
      ? `תיצור ${count} רעיונות money hack שונים לגמרי שכל אחד:
- מייצג רצון ברור של קונה
- יש לו נתיב קצר לתשלום
- ניתן למכירה השבוע
- פשוט מספיק שאדם זר יבין תוך 30 שניות

הצע רעיונות מגוונים (בוטים, תבניות, שירותים, אוטומציה). כל רעיון בשורה נפרדת, ללא מספור.`
      : `Generate ${count} completely different money hack ideas where each one:
- Has a clear buyer want
- Has a short path to payment
- Can be sold this week
- Is simple enough for a stranger to understand in 30 seconds

Suggest diverse ideas (bots, templates, services, automation). Each idea on a separate line, no numbering.`;
  } else if (previousBest) {
    const tips = previousBest.result.simplifyTips.slice(0, 3).join("; ");
    prompt = lang === "he"
      ? `הרעיון הטוב ביותר עד כה:
"${previousBest.idea}"

תוצאה: ${previousBest.result.outcome} (ביטחון: ${previousBest.result.confidence.toFixed(2)})
${tips ? `טיפים לשיפור: ${tips}` : ""}

תיצור ${count} גרסאות משופרות של הרעיון הזה שמטפלות בטיפים ומפשטות את הגישה. כל גרסה בשורה נפרדת, ללא מספור.`
      : `Best idea so far:
"${previousBest.idea}"

Result: ${previousBest.result.outcome} (confidence: ${previousBest.result.confidence.toFixed(2)})
${tips ? `Improvement tips: ${tips}` : ""}

Generate ${count} improved variations of this idea that address the tips and simplify the approach. Each variation on a separate line, no numbering.`;
  } else {
    prompt = lang === "he"
      ? `הרעיון הבסיסי:
"${seedIdea}"

תיצור ${count} גרסאות שמנסות להפוך את הרעיון הזה ל-money hack פשוט:
- רצון ברור של קונה
- נתיב קצר לתשלום
- ניתן למכירה השבוע
- פשוט מספיק שאדם זר יבין תוך 30 שניות

כל גרסה בשורה נפרדת, ללא מספור.`
      : `Base idea:
"${seedIdea}"

Generate ${count} variations that try to turn this into a simple money hack:
- Clear buyer want
- Short path to payment
- Sellable this week
- Simple enough for a stranger to understand in 30 seconds

Each variation on a separate line, no numbering.`;
  }

  const chatResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jev-lab.vercel.app",
      "X-Title": "Jev Lab Money Hack Finder",
    },
    body: JSON.stringify({
      model: chatModel,
      messages: [
        {
          role: "system",
          content: lang === "he"
            ? "אתה מומחה ב-money hacks - רעיונות פשוטים שניתן למכור מהר."
            : "You are an expert in money hacks - simple ideas that can be sold quickly."
        },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!chatResponse.ok) {
    throw new Error(`OpenRouter API error: ${chatResponse.status}`);
  }

  const chatData = await chatResponse.json();
  const content = chatData.choices[0].message.content;
  
  const ideas = content
    .split("\n")
    .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((line: string) => line.length > 10);

  return ideas.slice(0, count);
}

function rankVariants(variants: Variant[]): Variant[] {
  const outcomeOrder: Record<string, number> = {
    hack: 4,
    maybe: 3,
    need_info: 2,
    nope: 1,
  };

  return [...variants].sort((a, b) => {
    const aOrder = outcomeOrder[a.result.outcome] || 0;
    const bOrder = outcomeOrder[b.result.outcome] || 0;
    
    if (aOrder !== bOrder) return bOrder - aOrder;
    
    if (a.result.confidence !== b.result.confidence) {
      return b.result.confidence - a.result.confidence;
    }
    
    const aCash = a.result.scores.cash_velocity || 0;
    const bCash = b.result.scores.cash_velocity || 0;
    if (aCash !== bCash) return bCash - aCash;
    
    const aComplexity = a.result.scores.complexity_for_buyer || 0;
    const bComplexity = b.result.scores.complexity_for_buyer || 0;
    return aComplexity - bComplexity;
  });
}

function meetsThreshold(variant: Variant, threshold: number): boolean {
  return variant.result.outcome === "hack" || 
    (variant.result.outcome === "maybe" && variant.result.confidence >= threshold);
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: RequestBody = await request.json();
        const {
          mode,
          idea,
          threshold = 0.7,
          maxRounds = 3,
          variantsPerRound = 5,
          lang = "en",
        } = body;

        if (mode === "seed" && !idea?.trim()) {
          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  type: "error",
                  error: "Missing idea for seed mode",
                }) +
                "\n\n"
            )
          );
          controller.close();
          return;
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  type: "error",
                  error: "OPENROUTER_API_KEY not configured. This demo requires OpenRouter for generating variations.",
                }) +
                "\n\n"
            )
          );
          controller.close();
          return;
        }

        let bestVariant: Variant | null = null;
        let allRoundHistory: Array<{ round: number; variants: Variant[]; best: Variant }> = [];

        for (let round = 1; round <= maxRounds; round++) {
          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  type: "round_start",
                  round,
                  maxRounds,
                }) +
                "\n\n"
            )
          );

          const seedIdea = mode === "seed" && round === 1 ? idea ?? null : null;
          const ideas = await generateVariants(
            seedIdea,
            variantsPerRound,
            round,
            bestVariant,
            lang
          );

          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  type: "variants_generated",
                  round,
                  count: ideas.length,
                }) +
                "\n\n"
            )
          );

          const variants: Variant[] = [];
          
          for (let i = 0; i < ideas.length; i++) {
            const ideaText = ideas[i];
            const result = await evaluateIdea(ideaText, lang);
            variants.push({ idea: ideaText, result });

            controller.enqueue(
              encoder.encode(
                "data: " +
                  JSON.stringify({
                    type: "variant_scored",
                    round,
                    variantIndex: i + 1,
                    total: ideas.length,
                    idea: ideaText,
                    result,
                  }) +
                  "\n\n"
              )
            );
          }

          const rankedVariants = rankVariants(variants);
          const roundBest = rankedVariants[0];

          if (!bestVariant || 
              rankVariants([roundBest, bestVariant])[0].idea === roundBest.idea) {
            bestVariant = roundBest;
          }

          allRoundHistory.push({
            round,
            variants: rankedVariants,
            best: roundBest,
          });

          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  type: "round_complete",
                  round,
                  variants: rankedVariants,
                  best: roundBest,
                  globalBest: bestVariant,
                }) +
                "\n\n"
            )
          );

          if (meetsThreshold(bestVariant, threshold)) {
            controller.enqueue(
              encoder.encode(
                "data: " +
                  JSON.stringify({
                    type: "done",
                    reason: "threshold_met",
                    round,
                    winner: bestVariant,
                    history: allRoundHistory,
                  }) +
                  "\n\n"
              )
            );
            controller.close();
            return;
          }

          const prevBestScore = bestVariant.result.confidence;
          const currentBestScore = roundBest.result.confidence;
          if (round > 1 && Math.abs(currentBestScore - prevBestScore) < 0.05) {
            controller.enqueue(
              encoder.encode(
                "data: " +
                  JSON.stringify({
                    type: "done",
                    reason: "plateau",
                    round,
                    winner: bestVariant,
                    history: allRoundHistory,
                  }) +
                  "\n\n"
              )
            );
            controller.close();
            return;
          }
        }

        controller.enqueue(
          encoder.encode(
            "data: " +
              JSON.stringify({
                type: "done",
                reason: "max_rounds",
                winner: bestVariant,
                history: allRoundHistory,
              }) +
              "\n\n"
          )
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            "data: " +
              JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }) +
              "\n\n"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
