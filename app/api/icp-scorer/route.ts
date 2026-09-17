import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { score, noul } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { company, icp, weights } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { company, ideal_customer_profile: icp },
      model: MODEL,
      questions: {
        industry_fit: score(
          "How well does `company` match the industry in `ideal_customer_profile`?",
          [
            "Poor fit",
            "Somewhat related",
            "Good fit",
            "Excellent fit",
          ]
        ),
        maturity: score(
          "How mature is `company` according to `ideal_customer_profile` requirements?",
          [
            "Early stage",
            "Growing",
            "Established",
            "Enterprise",
          ]
        ),
        buyer_relevance: score(
          "How relevant is the offering to `company` based on `ideal_customer_profile`?",
          [
            "Not relevant",
            "Somewhat relevant",
            "Very relevant",
            "Critical need",
          ]
        ),
        pain_alignment: score(
          "How well aligned are `company`'s problems with what `ideal_customer_profile` describes?",
          [
            "Misaligned",
            "Some alignment",
            "Well aligned",
            "Perfect match",
          ]
        ),
        purchase_intent: noul(
          "Does `company` show signals of purchase intent based on `ideal_customer_profile`?"
        ),
      },
    });

    const answers = response.answers;

    const defaultWeights = {
      industry_fit: 0.25,
      maturity: 0.2,
      buyer_relevance: 0.3,
      pain_alignment: 0.25,
    };

    const appliedWeights = weights || defaultWeights;

    const normalize = (score: number) => score / 3;

    const compositeScore =
      normalize(answers.industry_fit.score) * appliedWeights.industry_fit +
      normalize(answers.maturity.score) * appliedWeights.maturity +
      normalize(answers.buyer_relevance.score) * appliedWeights.buyer_relevance +
      normalize(answers.pain_alignment.score) * appliedWeights.pain_alignment;

    const totalScore = compositeScore * 100;

    let recommendation: "high-priority" | "qualified" | "nurture" | "disqualify";
    if (totalScore >= 75 && answers.purchase_intent.noul > 0.6) {
      recommendation = "high-priority";
    } else if (totalScore >= 60) {
      recommendation = "qualified";
    } else if (totalScore >= 40) {
      recommendation = "nurture";
    } else {
      recommendation = "disqualify";
    }

    return NextResponse.json({
      answers,
      scores: {
        industry_fit: answers.industry_fit.score,
        maturity: answers.maturity.score,
        buyer_relevance: answers.buyer_relevance.score,
        pain_alignment: answers.pain_alignment.score,
      },
      weights: appliedWeights,
      compositeScore: totalScore,
      purchaseIntent: answers.purchase_intent.noul,
      recommendation,
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("ICP scorer error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}