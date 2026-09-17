import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { choice } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { claim, evidence } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { claim, evidence },
      model: MODEL,
      questions: {
        verdict: choice(
          "How well does `evidence` support the statement in `claim`?",
          {
            supports: "The evidence fully supports the claim",
            partially: "The evidence partially supports the claim",
            contradicts: "The evidence contradicts the claim",
            unrelated: "The evidence is unrelated to the claim",
          }
        ),
      },
    });

    const verdict = response.answers.verdict;
    const needsReview = verdict.confidence < 0.75;

    let status: "approved" | "review" | "rejected";
    if (needsReview) {
      status = "review";
    } else if (verdict.choice === "contradicts") {
      status = "rejected";
    } else if (verdict.choice === "supports") {
      status = "approved";
    } else {
      status = "review";
    }

    return NextResponse.json({
      verdict: verdict.choice,
      confidence: verdict.confidence,
      probabilities: verdict.probabilities,
      status,
      needsReview,
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Citation check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}