import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { choice, noul, score } from "@typesafe-ai/sdk";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { ticket: message },
      model: MODEL,
      questions: {
        topic: choice("What is the main topic of `ticket`?", {
          billing: "Payments, refunds, invoices",
          technical: "Bugs, outages, integrations",
          account: "Login, settings, profile",
          orders: "Shipping, tracking, returns",
          other: "General inquiries",
        }),
        urgency: noul("Does `ticket` express urgency or time sensitivity?"),
        frustration: score("How frustrated is the sender of `ticket`?", [
          "Calm and neutral",
          "Somewhat concerned",
          "Frustrated",
          "Very angry",
        ]),
        refund_requested: noul("Does `ticket` request a refund?"),
        credentials_exposed: noul(
          "Does `ticket` contain exposed credentials, passwords, or API keys?"
        ),
        identity_mismatch: noul(
          "Does `ticket` show signs of impersonation or identity mismatch?"
        ),
        unexpected_reward: noul(
          "Does `ticket` mention unexpected rewards, prizes, or giveaways?"
        ),
      },
    });

    const answers = response.answers;
    const spamSignals = [
      { name: "credentials", value: answers.credentials_exposed.noul },
      { name: "identity_mismatch", value: answers.identity_mismatch.noul },
      { name: "unexpected_reward", value: answers.unexpected_reward.noul },
    ];

    const spamRisk =
      spamSignals.reduce((sum, s) => sum + s.value, 0) / spamSignals.length;

    let route: string;
    if (spamRisk > 0.6 || answers.topic.confidence < 0.5) {
      route = "quarantine";
    } else if (answers.urgency.noul > 0.8 && answers.frustration.score > 2) {
      route = "human";
    } else if (answers.topic.choice === "billing") {
      route = "billing";
    } else if (answers.topic.choice === "orders") {
      route = "orders";
    } else if (answers.topic.choice === "account") {
      route = "account";
    } else {
      route = "general";
    }

    return NextResponse.json({
      answers,
      spamSignals,
      spamRisk,
      route,
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Inbox triage error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}