import { choice, noul, score } from "@typesafe-ai/sdk";
import { getTypeSafeClient, MODEL } from "./typesafe";

const NOUL_YES = 0.55;
const NOUL_NO = 0.4;
const LOW_CONF = 0.45;
const COMPLEXITY_SIMPLE_MAX = 1.15;
const COMPLEXITY_COURSE_MIN = 2.4;

const THESIS_NOTES = [
  "Sell more by SIMPLIFYING methods so people happily pay.",
  "Money hacks with AI must be simple enough that a stranger gets the offer fast.",
  "Prefer short path interested→paid, light delivery, sellable this week.",
  "Cut steps; do not build a complex product before the first shekel.",
];

export interface MoneyHackState {
  idea: string;
  thesis: string[];
  thesis_one_liner: string;
  optional_fields: Record<string, string | number | boolean | null>;
  evaluation_goal: string;
}

export function buildMoneyHackState(idea: string): MoneyHackState {
  const text = (idea || "").trim();
  const lower = text.toLowerCase();

  const optional: Record<string, string | number | boolean | null> = {};

  const priceMatch = text.match(
    /(?:₪|ILS|NIS|\$|USD|€|EUR)\s*[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s*(?:₪|ILS|NIS|\$|USD|€|EUR|shekel|שקל)/i
  );
  if (priceMatch && priceMatch[0]) optional.mentioned_price = priceMatch[0].trim();

  if (/\bai\b|artificial intelligence|gpt|llm|chatgpt|claude|jev/i.test(text)) {
    optional.claims_ai = true;
  }
  if (/whatsapp|telegram|instagram|facebook|tiktok|email|sms/i.test(lower)) {
    const channelMatch = text.match(
      /whatsapp|telegram|instagram|facebook|tiktok|email|sms/i
    );
    if (channelMatch && channelMatch[0]) optional.channel_hint = channelMatch[0];
  }
  if (/\b(salon|clinic|restaurant|shop|store|agency|freelancer|coach|course)\b/i.test(text)) {
    const audienceMatch = text.match(
      /\b(salon|clinic|restaurant|shop|store|agency|freelancer|coach|course)s?\b/i
    );
    if (audienceMatch && audienceMatch[0]) optional.audience_hint = audienceMatch[0];
  }

  return {
    idea: text,
    thesis: THESIS_NOTES,
    thesis_one_liner:
      "Simplify the method until people happily pay; AI must accelerate, not complicate.",
    optional_fields: optional,
    evaluation_goal:
      "Judge whether this is a simple money hack worth shipping this week.",
  };
}

export function buildMoneyHackQuestions() {
  return {
    buyer_want_one_sentence: noul(
      "Is the buyer want for `idea` clear enough to state in one plain sentence?",
      {
        true: "Yes — a specific buyer want is obvious in one sentence.",
        false: "No — buyer want is fuzzy, multi-purpose, or missing.",
      }
    ),
    stranger_gets_it_30s: noul(
      "Would a stranger understand what is being sold from `idea` in about 30 seconds?",
      {
        true: "Yes — offer is graspable in ~30s.",
        false: "No — needs explanation, jargon, or a long pitch.",
      }
    ),
    is_simple: noul(
      "Is `idea` fundamentally simple for the buyer (few moving parts, easy to grasp)?",
      {
        true: "Yes — simple method/offer.",
        false: "No — complex, multi-module, or overwhelming.",
      }
    ),
    audience_exists: noul(
      "Does a reachable paying audience for `idea` already exist (not invent-a-market)?",
      {
        true: "Yes — a known group already buys similar outcomes.",
        false: "No — audience is speculative or nonexistent.",
      }
    ),
    path_to_paid_short: noul(
      "Is the path from interested → paid for `idea` short (few steps, little friction)?",
      {
        true: "Yes — short checkout / booking / pay path.",
        false: "No — long funnel, many steps, or unclear how they pay.",
      }
    ),
    payment_path_clear: noul(
      "Is it clear HOW the buyer pays (price + mechanism: link, invoice, WhatsApp, etc.)?",
      {
        true: "Yes — payment path is clear or obvious.",
        false: "No — pricing or payment mechanism is unclear.",
      }
    ),
    sellable_this_week: noul(
      "Could you sell `idea` THIS WEEK without building a complex product first?",
      {
        true: "Yes — can offer/sell with what exists or a thin MVP.",
        false: "No — needs heavy build before first sale.",
      }
    ),
    needs_new_product: noul(
      "Does `idea` require building a substantial NEW product before any money comes in?",
      {
        true: "Yes — new product/platform must be built first.",
        false: "No — can sell with templates, services, or thin wrappers.",
      }
    ),
    confidence_ship_this_week: noul(
      "Would a pragmatic seller confidently try to ship/sell `idea` within 7 days?",
      {
        true: "Yes — shippable this week with high confidence.",
        false: "No — too unfinished, unclear, or heavy for this week.",
      }
    ),
    ai_accelerates_value: noul(
      "Does AI meaningfully enable or accelerate the value or delivery of `idea`?",
      {
        true: "Yes — AI is a real accelerator for value/delivery.",
        false: "No — AI is cosmetic, optional, or irrelevant.",
      }
    ),
    ai_is_necessary: noul(
      "Is AI actually necessary for `idea` to work well (vs nice-to-have buzzword)?",
      {
        true: "Yes — without AI the offer is much weaker or impractical.",
        false: "No — works fine without AI; AI is optional branding.",
      }
    ),
    buyer_pays_for_simplicity: noul(
      "Would people pay for `idea` mainly because it is simpler than DIY/alternatives?",
      {
        true: "Yes — they pay to skip complexity / hassle.",
        false: "No — simplicity is not the buying reason (or offer isn't simpler).",
      }
    ),
    delivery_light: noul(
      "Is delivery AFTER sale light for the seller (not heavy custom services forever)?",
      {
        true: "Yes — light/repeatable delivery.",
        false: "No — heavy bespoke delivery per buyer.",
      }
    ),
    still_too_many_steps: noul(
      "Does the method in `idea` still have too many steps that should be cut?",
      {
        true: "Yes — still too many steps; simplify further.",
        false: "No — step count is already lean enough.",
      }
    ),
    builder_only_vs_mass: noul(
      "Is `idea` only sellable to builders/techies, not to a mass non-technical buyer?",
      {
        true: "Yes — builder/tech-only audience.",
        false: "No — ordinary non-technical buyers can buy/use it.",
      }
    ),
    needs_more_idea_detail: noul(
      "Is the `idea` text too vague to judge whether it is a good money hack?",
      {
        true: "Yes — too vague; need more detail.",
        false: "No — enough detail to judge.",
      }
    ),
    complexity_for_buyer: score(
      "How complex is `idea` for the BUYER to understand and use?",
      [
        "One-click simple — almost no learning.",
        "Easy — minutes to get value.",
        "Moderate — needs a short walkthrough.",
        "Needs a course to learn — heavy cognitive load.",
      ]
    ),
    cash_velocity: score(
      "If `idea` works, how fast could cash arrive?",
      [
        "Slow — months / long sales cycle.",
        "Medium — weeks.",
        "Fast — days.",
        "Very fast — same day / next day possible.",
      ]
    ),
    time_to_first_shekel: score(
      "How soon could the FIRST shekel arrive if you start on `idea` now?",
      [
        "Distant — months of build/sales before first payment.",
        "Weeks — need setup then sell.",
        "This week — realistic first payment within ~7 days.",
        "Today/tomorrow — can take money almost immediately.",
      ]
    ),
    hack_shape: choice(
      "What shape is this money hack closest to?",
      {
        product: "A sellable product (digital/physical) buyers can buy.",
        service: "A service you deliver (done-for-you / done-with-you).",
        content_offer: "Content / course / template pack sold as an offer.",
        automation: "An automation / bot / AI workflow sold or monetized.",
        unclear: "Unclear — shape not identifiable from the idea text.",
      }
    ),
  };
}

interface JevAnswer {
  noul?: number;
  choice?: string;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  levels?: string[];
}

type JevAnswers = Record<string, JevAnswer>;

export interface MoneyHackResult {
  outcome: "hack" | "maybe" | "nope" | "need_info";
  confidence: number;
  explanationEn: string;
  explanationHe: string;
  atoms: Record<string, Partial<JevAnswer>>;
  simplifyTips: string[];
  scores: {
    complexity_for_buyer?: number;
    cash_velocity?: number;
    time_to_first_shekel?: number;
  };
  hack_shape?: string;
  lowConfidenceAtoms: string[];
  idea: string;
  lang: string;
  latency?: number;
  source?: string;
  usage?: any;
}

function snapshotAtoms(answers: JevAnswers): Record<string, Partial<JevAnswer>> {
  const atoms: Record<string, Partial<JevAnswer>> = {};
  for (const [k, a] of Object.entries(answers || {})) {
    if (!a || typeof a !== "object") continue;
    if (typeof a.noul === "number") {
      atoms[k] = {
        noul: Math.round(a.noul * 1000) / 1000,
        confidence:
          typeof a.confidence === "number"
            ? Math.round(a.confidence * 1000) / 1000
            : undefined,
      };
    } else if (a.choice != null) {
      atoms[k] = {
        choice: String(a.choice),
        confidence:
          typeof a.confidence === "number"
            ? Math.round(a.confidence * 1000) / 1000
            : undefined,
      };
    } else if (typeof a.score === "number") {
      atoms[k] = {
        score: Math.round(a.score * 1000) / 1000,
        confidence:
          typeof a.confidence === "number"
            ? Math.round(a.confidence * 1000) / 1000
            : undefined,
      };
    }
  }
  return atoms;
}

export function composeMoneyHack(
  answers: JevAnswers,
  idea: string,
  lang: "en" | "he" = "en",
  meta: { claimsAi?: boolean } = {}
): MoneyHackResult {
  const n = (key: string) =>
    typeof answers[key]?.noul === "number" ? answers[key].noul : null;
  const ch = (key: string) => answers[key]?.choice ?? null;
  const sc = (key: string) =>
    typeof answers[key]?.score === "number" ? answers[key].score : null;
  const conf = (key: string) =>
    typeof answers[key]?.confidence === "number"
      ? answers[key].confidence
      : null;

  const atoms = snapshotAtoms(answers);
  const claimsAi =
    meta.claimsAi === true ||
    /\bai\b|artificial intelligence|gpt|llm/i.test(idea || "");

  const yes = (key: string) => (n(key) ?? 0) >= NOUL_YES;
  const no = (key: string) => {
    const v = n(key);
    return v != null && v < NOUL_NO;
  };
  const lowConf = (key: string) => {
    const c = conf(key);
    return c != null && c < LOW_CONF;
  };

  const simplifyTips: string[] = [];
  const lowConfKeys: string[] = [];

  const decisiveKeys = [
    "buyer_want_one_sentence",
    "stranger_gets_it_30s",
    "path_to_paid_short",
    "sellable_this_week",
    "still_too_many_steps",
    "needs_more_idea_detail",
    "needs_new_product",
    "is_simple",
    "confidence_ship_this_week",
  ];
  for (const k of decisiveKeys) {
    if (lowConf(k)) lowConfKeys.push(k);
  }

  if (no("buyer_want_one_sentence") || !yes("buyer_want_one_sentence")) {
    if ((n("buyer_want_one_sentence") ?? 1) < NOUL_YES)
      simplifyTips.push("State the buyer want in one plain sentence.");
  }
  if ((n("stranger_gets_it_30s") ?? 1) < NOUL_YES)
    simplifyTips.push("Rewrite the offer so a stranger gets it in 30 seconds.");
  if ((n("path_to_paid_short") ?? 1) < NOUL_YES)
    simplifyTips.push("Shorten the path from interested → paid (fewer steps).");
  if ((n("payment_path_clear") ?? 1) < NOUL_NO)
    simplifyTips.push("Make price + how they pay obvious.");
  if (yes("still_too_many_steps"))
    simplifyTips.push("Cut steps until the method feels almost one-click.");
  if (yes("needs_new_product"))
    simplifyTips.push("Sell a thin offer this week — defer building a full product.");
  if ((n("sellable_this_week") ?? 1) < NOUL_YES)
    simplifyTips.push("Find a version you can sell this week without a big build.");
  if ((n("delivery_light") ?? 1) < NOUL_YES)
    simplifyTips.push("Lighten post-sale delivery (templates, automation, boundaries).");
  if ((n("is_simple") ?? 1) < NOUL_YES)
    simplifyTips.push("Simplify until the method itself is the product.");
  if (yes("builder_only_vs_mass"))
    simplifyTips.push("Repackage for non-technical mass buyers, not only builders.");
  if ((sc("complexity_for_buyer") ?? 0) >= COMPLEXITY_COURSE_MIN)
    simplifyTips.push("Drop complexity — if it needs a course, it is not a hack yet.");
  if (claimsAi && (n("ai_accelerates_value") ?? 1) < NOUL_NO)
    simplifyTips.push("Either make AI a real accelerator or drop the AI claim.");

  const tips = [...new Set(simplifyTips)];

  let outcome: "hack" | "maybe" | "nope" | "need_info";

  const complexity = sc("complexity_for_buyer");

  const failTooManySteps =
    yes("still_too_many_steps") &&
    no("path_to_paid_short") &&
    !lowConf("still_too_many_steps") &&
    !lowConf("path_to_paid_short");

  const failClarity =
    no("buyer_want_one_sentence") &&
    no("stranger_gets_it_30s") &&
    !lowConf("buyer_want_one_sentence") &&
    !lowConf("stranger_gets_it_30s");

  const failBuildFirst =
    yes("needs_new_product") &&
    no("sellable_this_week") &&
    !lowConf("needs_new_product") &&
    !lowConf("sellable_this_week");

  const failComplexity =
    complexity != null &&
    complexity >= COMPLEXITY_COURSE_MIN &&
    no("is_simple") &&
    !lowConf("is_simple");

  const failAiClaim =
    claimsAi &&
    (n("ai_accelerates_value") ?? 1) < 0.3 &&
    !lowConf("ai_accelerates_value");

  const hardFail =
    failTooManySteps ||
    failClarity ||
    failBuildFirst ||
    failComplexity ||
    failAiClaim;

  if (!(idea || "").trim()) {
    outcome = "need_info";
  } else if (hardFail) {
    outcome = "nope";
  } else if (yes("needs_more_idea_detail")) {
    outcome = "need_info";
  } else if (lowConfKeys.length >= 3) {
    outcome = "need_info";
  } else {
    const aiOk =
      yes("ai_accelerates_value") ||
      !claimsAi ||
      !yes("ai_is_necessary");

    const tooManyHard = (n("still_too_many_steps") ?? 0) >= 0.7;
    const hackOk =
      yes("path_to_paid_short") &&
      yes("buyer_want_one_sentence") &&
      yes("stranger_gets_it_30s") &&
      aiOk &&
      yes("sellable_this_week") &&
      !tooManyHard &&
      !yes("needs_new_product") &&
      yes("is_simple") &&
      (complexity == null || complexity <= COMPLEXITY_SIMPLE_MAX) &&
      (yes("audience_exists") || (n("audience_exists") ?? 0) >= 0.45) &&
      (yes("confidence_ship_this_week") ||
        (n("confidence_ship_this_week") ?? 0) >= 0.5);

    if (hackOk) {
      outcome = "hack";
    } else {
      outcome = "maybe";
    }
  }

  const confs = Object.values(answers || {})
    .map((a) => (typeof a?.confidence === "number" ? a.confidence : null))
    .filter((x): x is number => typeof x === "number");
  let confidence =
    confs.length > 0
      ? confs.reduce((a, b) => a + b, 0) / confs.length
      : outcome === "need_info"
        ? 0.55
        : 0.6;
  if (outcome === "hack") confidence = Math.max(confidence, 0.65);
  if (outcome === "nope") confidence = Math.max(confidence, 0.6);
  if (lowConfKeys.length) confidence = Math.min(confidence, 0.55);
  confidence = Math.round(confidence * 1000) / 1000;

  const shape = ch("hack_shape");
  const cashVel = sc("cash_velocity");
  const ttf = sc("time_to_first_shekel");

  let explanationEn: string;
  let explanationHe: string;
  if (outcome === "need_info") {
    explanationEn =
      lowConfKeys.length >= 3
        ? `Need more info — several key judgments are low-confidence (${lowConfKeys.slice(0, 4).join(", ")}). Clarify the idea.`
        : yes("needs_more_idea_detail")
          ? "Need more idea detail before judging this money hack."
          : "Need more information to judge this money hack.";
    explanationHe =
      lowConfKeys.length >= 3
        ? `חסר מידע — כמה שיפוטים מרכזיים בביטחון נמוך. הבהירו את הרעיון.`
        : "חסר פירוט ברעיון לפני שניתן לשפוט את ה־money hack.";
  } else if (outcome === "nope") {
    explanationEn =
      "Nope — not a simple money hack yet" +
      (tips.length ? ` · cut: ${tips.slice(0, 3).join("; ")}` : "") +
      ".";
    explanationHe =
      "לא — עדיין לא money hack פשוט" +
      (tips.length ? ` · לפשט: ${tips.slice(0, 2).join("; ")}` : "") +
      ".";
  } else if (outcome === "hack") {
    explanationEn =
      "Hack — simple enough to sell: clear want, short path to paid, sellable this week" +
      (shape && shape !== "unclear" ? ` · shape: ${shape}` : "") +
      ".";
    explanationHe =
      "Hack — מספיק פשוט למכירה: רצון ברור, נתיב קצר לתשלום, ניתן למכור השבוע" +
      (shape && shape !== "unclear" ? ` · צורה: ${shape}` : "") +
      ".";
  } else {
    explanationEn =
      "Maybe — promising but needs simplification" +
      (tips.length ? ` · tips: ${tips.slice(0, 3).join("; ")}` : "") +
      ".";
    explanationHe =
      "אולי — מבטיח אבל צריך פישוט" +
      (tips.length ? ` · טיפים: ${tips.slice(0, 2).join("; ")}` : "") +
      ".";
  }

  return {
    outcome,
    confidence,
    explanationEn,
    explanationHe,
    atoms,
    simplifyTips: tips,
    scores: {
      complexity_for_buyer: sc("complexity_for_buyer") ?? undefined,
      cash_velocity: cashVel ?? undefined,
      time_to_first_shekel: ttf ?? undefined,
    },
    hack_shape: shape ?? undefined,
    lowConfidenceAtoms: lowConfKeys,
    idea: (idea || "").trim(),
    lang,
  };
}

export async function evaluateIdea(idea: string, lang: "en" | "he" = "en"): Promise<MoneyHackResult> {
  const start = Date.now();
  
  if (!idea.trim()) {
    return {
      outcome: "need_info",
      confidence: 0.9,
      explanationEn: "Missing idea text.",
      explanationHe: "חסר טקסט רעיון.",
      atoms: {},
      simplifyTips: ["Provide a concrete money-hack idea in one or two sentences."],
      scores: {},
      hack_shape: undefined,
      lowConfidenceAtoms: [],
      idea: "",
      lang,
      latency: Date.now() - start,
      source: "heuristic",
    };
  }

  try {
    const client = getTypeSafeClient();
    const state = buildMoneyHackState(idea);
    const questions = buildMoneyHackQuestions();

    const response = await client.systemOne({
      state: state as any,
      model: MODEL,
      questions,
    });

    const composed = composeMoneyHack(
      response.answers as JevAnswers,
      idea,
      lang,
      { claimsAi: Boolean(state.optional_fields?.claims_ai) }
    );

    return {
      ...composed,
      usage: response.usage,
      latency: Date.now() - start,
      source: "jev",
    };
  } catch (err) {
    throw err;
  }
}
