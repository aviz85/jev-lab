import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { noul, score } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { message },
      model: MODEL,
      questions: {
        toxicity: noul("Does `message` contain toxic or hateful language?"),
        harassment: noul("Does `message` harass or threaten others?"),
        spam: noul("Is `message` spam or unwanted promotion?"),
        pii_exposure: noul(
          "Does `message` expose personal identifiable information (PII)?"
        ),
        unsafe_advice: noul(
          "Does `message` provide dangerous or unsafe advice?"
        ),
        severity: score("How severe are any violations in `message`?", [
          "No violations",
          "Minor issues",
          "Moderate violations",
          "Severe violations",
        ]),
      },
    });

    const answers = response.answers;

    const violations = [
      { type: "toxicity", value: answers.toxicity.noul },
      { type: "harassment", value: answers.harassment.noul },
      { type: "spam", value: answers.spam.noul },
      { type: "pii", value: answers.pii_exposure.noul },
      { type: "unsafe", value: answers.unsafe_advice.noul },
    ];

    const maxViolation = Math.max(...violations.map((v) => v.value));
    const severity = answers.severity.score;
    const confidence = answers.severity.confidence;

    let action: "allow" | "warn" | "review" | "block";
    if (severity >= 2.5 && maxViolation > 0.7) {
      action = "block";
    } else if (severity >= 2 || maxViolation > 0.6) {
      action = "review";
    } else if (severity >= 1 || maxViolation > 0.4) {
      action = "warn";
    } else {
      action = "allow";
    }

    if (confidence < 0.6 && maxViolation > 0.5) {
      action = "review";
    }

    return NextResponse.json({
      answers,
      violations,
      action,
      maxViolation,
      severity,
      confidence,
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}