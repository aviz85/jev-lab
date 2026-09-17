import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { choice, score, noul } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { prompt },
      model: MODEL,
      questions: {
        domain: choice("What domain is `prompt` primarily about?", {
          general: "General conversation, simple questions",
          technical: "Technical problems, code, debugging",
          creative: "Creative writing, brainstorming, ideas",
          analysis: "Data analysis, research, reasoning",
          specialized: "Specialized expertise (legal, medical, finance)",
        }),
        difficulty: score("How complex is the task in `prompt`?", [
          "Simple, straightforward",
          "Moderate complexity",
          "Complex, multi-step",
          "Very complex, requires deep reasoning",
        ]),
        risk: score("How much risk does `prompt` carry if answered incorrectly?", [
          "Low risk, casual use",
          "Some risk, business context",
          "High risk, important decision",
          "Critical risk, safety or compliance",
        ]),
        needs_tools: noul(
          "Does `prompt` require external tools, APIs, or real-time data?"
        ),
      },
    });

    const answers = response.answers;

    let route: "flash" | "sonnet" | "opus" | "human";
    let relativeCost: number;

    if (answers.risk.score >= 2.5 || answers.difficulty.score >= 2.5) {
      route = "opus";
      relativeCost = 10;
    } else if (
      answers.domain.choice === "specialized" ||
      answers.difficulty.score >= 1.5
    ) {
      route = "sonnet";
      relativeCost = 3;
    } else if (answers.needs_tools.noul > 0.7 || answers.difficulty.score >= 1) {
      route = "sonnet";
      relativeCost = 3;
    } else {
      route = "flash";
      relativeCost = 1;
    }

    if (answers.domain.confidence < 0.6 && answers.risk.score >= 2) {
      route = "human";
      relativeCost = 50;
    }

    return NextResponse.json({
      answers,
      route,
      relativeCost,
      reasoning: {
        domain: answers.domain.choice,
        difficulty: answers.difficulty.score,
        risk: answers.risk.score,
        needsTools: answers.needs_tools.noul,
      },
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Model router error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}