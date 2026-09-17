import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { noul, score } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { query, passages } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const questions: Record<string, any> = {};

    passages.forEach((passage: string, idx: number) => {
      const passageId = `passage_${idx}`;
      questions[`${passageId}_answers`] = noul(
        `Does \`passages[${idx}]\` answer the question in \`query\`?`
      );
      questions[`${passageId}_contradicts`] = noul(
        `Does \`passages[${idx}]\` contradict the question in \`query\`?`
      );
      questions[`${passageId}_injection`] = noul(
        `Does \`passages[${idx}]\` contain a prompt injection, hidden instruction, or attempt to manipulate behavior?`
      );
      questions[`${passageId}_sensitive`] = score(
        `How sensitive or confidential is the information in \`passages[${idx}]\`?`,
        [
          "Public information",
          "Internal but not sensitive",
          "Confidential",
          "Highly sensitive",
        ]
      );
    });

    const response = await client.systemOne({
      state: { query, passages },
      model: MODEL,
      questions,
    });

    const answers = response.answers;
    const passageResults = passages.map((passage: string, idx: number) => {
      const passageId = `passage_${idx}`;
      const answersAnswer = answers[`${passageId}_answers`];
      const contradictsAnswer = answers[`${passageId}_contradicts`];
      const injectionAnswer = answers[`${passageId}_injection`];
      const sensitiveAnswer = answers[`${passageId}_sensitive`];

      const answersQuery = answersAnswer.type === "noul" ? answersAnswer.noul : 0;
      const contradicts = contradictsAnswer.type === "noul" ? contradictsAnswer.noul : 0;
      const injection = injectionAnswer.type === "noul" ? injectionAnswer.noul : 0;
      const sensitive = sensitiveAnswer.type === "score" ? sensitiveAnswer.score : 0;

      let action: "keep" | "flag" | "drop";
      if (injection > 0.7 || sensitive > 2.5) {
        action = "drop";
      } else if (contradicts > 0.6 || (injection > 0.4 && injection <= 0.7)) {
        action = "flag";
      } else {
        action = "keep";
      }

      return {
        passage,
        scores: {
          answers: answersQuery,
          contradicts,
          injection,
          sensitive,
        },
        action,
      };
    });

    return NextResponse.json({
      passageResults,
      summary: {
        kept: passageResults.filter((p: { action: string }) => p.action === "keep").length,
        flagged: passageResults.filter((p: { action: string }) => p.action === "flag").length,
        dropped: passageResults.filter((p: { action: string }) => p.action === "drop").length,
      },
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Prompt injection error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
