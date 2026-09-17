import { NextResponse } from "next/server";
import { getTypeSafeClient, MODEL } from "@/lib/typesafe";
import { choice, noul } from "@typesafe-ai/sdk";

const SAMPLE_TOS = `Terms of Service
1. You must be at least 13 years old to use this service.
2. You are responsible for maintaining the confidentiality of your account.
3. You agree not to use the service for any illegal purposes.
4. We may terminate your account at any time for violations.
5. All content you post remains your property.
6. We collect and use data as described in our Privacy Policy.
7. The service is provided "as is" without warranties.
8. We are not liable for indirect or consequential damages.
9. You agree to indemnify us against claims arising from your use.
10. Disputes will be resolved through binding arbitration.
11. We may modify these terms with 30 days notice.
12. Your continued use constitutes acceptance of changes.
13. You may not transfer your account to others.
14. We reserve the right to refuse service to anyone.
15. Copyright violations will result in immediate termination.
16. You grant us a license to use content you post.
17. We may share data with third-party service providers.
18. Your privacy is important to us and governed separately.
19. We use cookies and tracking technologies.
20. You can delete your account at any time.
21. Deleted accounts may be retained for legal purposes.
22. We may send you service-related emails.
23. You can opt out of marketing communications.
24. We do not sell your personal information to third parties.
25. Data breaches will be reported as required by law.
26. You are responsible for your content and its legality.
27. We may remove content that violates our policies.
28. Repeated violations may result in permanent bans.
29. You cannot impersonate others or provide false information.
30. Automated access (bots) is prohibited without permission.
31. We may display advertisements on the service.
32. Premium features may require additional payment.
33. Refunds are provided only as required by law.
34. Virtual items have no real-world value.
35. We may discontinue the service at any time.
36. Export restrictions may apply to some features.
37. These terms are governed by California law.
38. You waive the right to jury trial for disputes.
39. Class action waivers apply to all claims.
40. Severability: invalid provisions don't affect others.`;

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    const lines = SAMPLE_TOS.split("\n").filter((l) => l.trim());
    const lineOptions: Record<string, string | null> = {};
    lines.forEach((line, idx) => {
      lineOptions[`line_${idx}`] = line;
    });

    const client = getTypeSafeClient();
    const startTime = Date.now();

    const response = await client.systemOne({
      state: { document: SAMPLE_TOS, query: question },
      model: MODEL,
      questions: {
        best_line: choice(
          "Which line in `document` best answers `query`?",
          lineOptions
        ),
        contains_answer: noul("Does `document` contain an answer to `query`?"),
      },
    });

    const answers = response.answers;
    const selectedLine = answers.best_line.choice;
    const lineIndex = parseInt(selectedLine.replace("line_", ""));

    return NextResponse.json({
      question,
      selectedLine: lines[lineIndex],
      lineNumber: lineIndex + 1,
      confidence: answers.best_line.confidence,
      containsAnswer: answers.contains_answer.noul,
      probabilities: answers.best_line.probabilities,
      document: SAMPLE_TOS,
      latency: Date.now() - startTime,
      usage: response.usage,
    });
  } catch (error) {
    console.error("ToS finder error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}