import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { choice, noul, score } from "@typesafe-ai/sdk";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  locale?: "he" | "en";
}

interface Condition {
  id: string;
  label: string;
  active: boolean;
  severity: "low" | "medium" | "high" | "critical";
  why: string;
}

const MAYA_SYSTEM_PROMPT_HE = `אתה מיה, נציגת הצלחת לקוחות עבור מוצר SaaS לחיוב. אתה מנומס, מקצועי ומועיל. תמיד מנסה לפתור בעיות של לקוחות תוך שמירה על גישה חיובית. כשצריך, אתה יכולה להסביר מדיניות החברה ולהציע פתרונות.`;

const MAYA_SYSTEM_PROMPT_EN = `You are Maya, a Customer Success representative for a SaaS billing product. You are polite, professional, and helpful. You always try to solve customer issues while maintaining a positive approach. When necessary, you can explain company policy and offer solutions.`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as ChatRequest;
    const { messages, locale = "en" } = body;

    // 1. Call OpenRouter for Maya's response
    const chatStartTime = Date.now();
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const chatModel = process.env.CHAT_MODEL || "google/gemini-3.8-flash";

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build messages with system prompt
    const systemPrompt = locale === "he" ? MAYA_SYSTEM_PROMPT_HE : MAYA_SYSTEM_PROMPT_EN;
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== "system"),
    ];

    const chatResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jev-lab.vercel.app",
        "X-Title": "Jev Lab Subtext Radar",
      },
      body: JSON.stringify({
        model: chatModel,
        messages: chatMessages,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${chatResponse.status}` },
        { status: 500 }
      );
    }

    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices[0].message.content;
    const chatLatency = Date.now() - chatStartTime;

    // 2. Append assistant reply
    const updatedMessages = [...messages, { role: "assistant" as const, content: assistantMessage }];

    // 3. Call Jev with full transcript
    const jevStartTime = Date.now();
    const client = getTypeSafeClient();

    const jevResponse = await client.systemOne({
      state: {
        scenario: "saas_billing_support",
        transcript: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        turn: Math.floor(updatedMessages.filter(m => m.role === "user").length),
      },
      model: MODEL,
      questions: {
        user_intent: choice(
          "What is the primary intent of the user in this conversation?",
          {
            refund: "Requesting a refund",
            cancel: "Wants to cancel service",
            info: "Seeking information",
            escalate_human: "Wants to speak to a human",
            competitor_probe: "Appears to be researching competitors",
            other: "Other intent",
          }
        ),
        emotional_posture: choice(
          "What is the user's emotional posture?",
          {
            collaborative: "Collaborative and friendly",
            frustrated: "Frustrated but reasonable",
            hostile: "Hostile or aggressive",
            manipulative: "Manipulative or deceptive",
            detached: "Detached or indifferent",
          }
        ),
        negotiation_move: choice(
          "What negotiation move is the user making?",
          {
            ask: "Politely asking",
            demand: "Demanding",
            threaten: "Threatening consequences",
            bait: "Baiting or testing limits",
            stall: "Stalling or delaying",
            concede: "Conceding or accepting",
            none: "No negotiation move",
          }
        ),
        hidden_agenda: noul(
          "Does the user have an unstated agenda beyond their literal request?"
        ),
        churn_risk: noul(
          "Is the user likely to cancel their subscription soon?"
        ),
        refund_pressure: noul(
          "Is the user pushing for a refund or money back?"
        ),
        social_engineering: noul(
          "Is the user trying to extract policy exceptions, credentials, or special treatment through manipulation?"
        ),
        agent_deflection: noul(
          "Is Maya deflecting or soft-blocking the user's request?"
        ),
        rapport_building: noul(
          "Is genuine rapport forming between the user and Maya?"
        ),
        urgency: score(
          "What is the urgency level expressed by the user?",
          [
            "Calm - no urgency",
            "Mild - some time sensitivity",
            "High - urgent need",
            "Crisis - immediate critical need",
          ]
        ),
        trust_in_agent: score(
          "What is the user's level of trust in Maya?",
          [
            "Distrust - suspicious or hostile",
            "Wary - cautious and uncertain",
            "Neutral - no strong feelings",
            "Trusting - believes Maya will help",
          ]
        ),
        leverage: score(
          "What level of leverage does the user have?",
          [
            "No leverage - no threats or power",
            "Mild - minor complaints or concerns",
            "Strong - credible threats (reviews, social)",
            "Nuclear - legal threats or public escalation",
          ]
        ),
      },
    });

    const jevLatency = Date.now() - jevStartTime;
    const answers = jevResponse.answers;

    // 4. Evaluate conditions
    const conditions: Condition[] = [];

    // ESCALATE_HUMAN
    const shouldEscalateHuman =
      answers.emotional_posture.choice === "hostile" ||
      (answers.churn_risk.noul > 0.75 && answers.urgency.score >= 2) ||
      answers.user_intent.confidence < 0.55;

    conditions.push({
      id: "ESCALATE_HUMAN",
      label: locale === "he" ? "העבר לנציג אנושי" : "Escalate to Human",
      active: shouldEscalateHuman,
      severity: "critical",
      why: shouldEscalateHuman
        ? locale === "he"
          ? "הלקוח עויין או בסיכון גבוה לנטישה"
          : "Customer is hostile or high churn risk"
        : locale === "he"
        ? "אין צורך בהעברה כרגע"
        : "No escalation needed",
    });

    // OFFER_RETENTION
    const shouldOfferRetention =
      answers.churn_risk.noul > 0.6 &&
      (answers.user_intent.choice === "cancel" || answers.user_intent.choice === "refund") &&
      !shouldEscalateHuman;

    conditions.push({
      id: "OFFER_RETENTION",
      label: locale === "he" ? "הצע הנחה לשימור" : "Offer Retention Deal",
      active: shouldOfferRetention,
      severity: "high",
      why: shouldOfferRetention
        ? locale === "he"
          ? "סיכון גבוה לנטישה - הצע תמריצים"
          : "High churn risk - offer incentives"
        : locale === "he"
        ? "אין סיכון משמעותי לנטישה"
        : "No significant churn risk",
    });

    // WATCH_SOCIAL_ENG
    const shouldWatchSocialEng = answers.social_engineering.noul > 0.55;

    conditions.push({
      id: "WATCH_SOCIAL_ENG",
      label: locale === "he" ? "זהה הנדסה חברתית" : "Social Engineering Alert",
      active: shouldWatchSocialEng,
      severity: "medium",
      why: shouldWatchSocialEng
        ? locale === "he"
          ? "ניסיון אפשרי למניפולציה"
          : "Possible manipulation attempt"
        : locale === "he"
        ? "אין סימנים למניפולציה"
        : "No manipulation signs",
    });

    // COMPETITOR_MODE
    const shouldCompetitorMode =
      answers.user_intent.choice === "competitor_probe" ||
      (answers.hidden_agenda.noul > 0.6 && answers.user_intent.choice === "info");

    conditions.push({
      id: "COMPETITOR_MODE",
      label: locale === "he" ? "מצב מחקר מתחרים" : "Competitor Research Mode",
      active: shouldCompetitorMode,
      severity: "low",
      why: shouldCompetitorMode
        ? locale === "he"
          ? "סימנים למחקר תחרותי"
          : "Signs of competitive research"
        : locale === "he"
        ? "אין סימנים למחקר תחרותי"
        : "No competitive research signs",
    });

    // GREEN_PATH
    const shouldGreenPath =
      answers.emotional_posture.choice === "collaborative" &&
      answers.trust_in_agent.score >= 2 &&
      !shouldEscalateHuman;

    conditions.push({
      id: "GREEN_PATH",
      label: locale === "he" ? "מסלול ירוק - הכל חלק" : "Green Path - All Good",
      active: shouldGreenPath,
      severity: "low",
      why: shouldGreenPath
        ? locale === "he"
          ? "שיחה חיובית ושיתופית"
          : "Positive, collaborative conversation"
        : locale === "he"
        ? "יש מתחים או אתגרים"
        : "Some tensions or challenges",
    });

    return NextResponse.json({
      assistantMessage,
      messages: updatedMessages,
      jev: {
        answers,
        model: MODEL,
      },
      conditions,
      latency: {
        chatMs: chatLatency,
        jevMs: jevLatency,
        totalMs: chatLatency + jevLatency,
      },
      usage: {
        chat: chatData.usage || {},
        jev: jevResponse.usage,
      },
    });
  } catch (error) {
    console.error("Subtext chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
