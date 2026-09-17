import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { noul, choice, score } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { listing: { title, description } },
      model: MODEL,
      questions: {
        prohibited_item: noul(
          "Is the item in `listing` prohibited (weapons, drugs, illegal content)?"
        ),
        counterfeit_signal: noul(
          "Does `listing` show signs of counterfeit or replica products?"
        ),
        review_bait: noul(
          "Does `listing` offer incentives for positive reviews or ratings?"
        ),
        category: choice("What category best fits `listing`?", {
          electronics: "Electronics, gadgets, tech",
          fashion: "Clothing, accessories, fashion",
          home: "Home goods, furniture, decor",
          health: "Health, beauty, wellness",
          other: "Other categories",
        }),
        severity: score(
          "If there are policy violations in `listing`, how severe are they?",
          [
            "No violations",
            "Minor issues",
            "Moderate violations",
            "Serious violations",
          ]
        ),
      },
    });

    const answers = response.answers;

    const violationScore =
      (answers.prohibited_item.noul * 3 +
        answers.counterfeit_signal.noul * 2 +
        answers.review_bait.noul * 1.5) /
      6.5;

    let action: "allow" | "review" | "block";
    if (
      answers.prohibited_item.noul > 0.7 ||
      (violationScore > 0.6 && answers.severity.score >= 2)
    ) {
      action = "block";
    } else if (
      violationScore > 0.4 ||
      answers.severity.score >= 1.5 ||
      answers.category.confidence < 0.6
    ) {
      action = "review";
    } else {
      action = "allow";
    }

    return NextResponse.json({
      answers,
      violationScore,
      action,
      flags: {
        prohibited: answers.prohibited_item.noul > 0.5,
        counterfeit: answers.counterfeit_signal.noul > 0.5,
        reviewBait: answers.review_bait.noul > 0.5,
      },
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Marketplace cop error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}