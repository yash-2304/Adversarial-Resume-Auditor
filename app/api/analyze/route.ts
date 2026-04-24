import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { default: OpenAI } = await import("openai");
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const { resumeText, jobDescription, mode } = await req.json();

    // 🧹 Stronger preprocessing: split bullets + sentences + sentence-to-bullet fallback
    const raw = (resumeText || "")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ");

    let parts = raw
      // split on bullets, newlines, dashes, and sentence boundaries
      .split(/\n+|•|\u2022|\-|\*|\.(?=\s+[A-Z])/g)
      .map((line: string) => line.trim())
      .filter((line: string) => line && line.length > 25);

    // Fallback: if we didn't get enough structure, split sentences more aggressively
    if (parts.length < 3) {
      parts = raw
        .split(/\.|\n/g)
        .map((line: string) => line.trim())
        .filter((line: string) => line && line.length > 25);
    }

    const cleanResume = parts
      // de-duplicate similar lines
      .filter((line: string, idx: number, arr: string[]) => arr.indexOf(line) === idx);

    // 🔥 REAL Resume Rewrite Mode
    if (mode === "improve") {
      const improvePrompt = `
You are a senior FAANG-level resume writer.

Your job is to TRANSFORM the candidate’s resume into HIGH-IMPACT, ATS-OPTIMIZED bullet points.

STRICT RULES:
- ONLY use information from the given resume (NO hallucination)
- REWRITE each line into an achievement-focused bullet
- Start every bullet with strong action verbs:
  (Engineered, Built, Implemented, Optimized, Designed, Reduced, Improved, Developed)
- Each bullet MUST follow:
  Action + Technology + Impact

- Add measurable impact wherever possible using realistic phrasing:
  (e.g., "reduced load time", "improved performance", "enhanced scalability", "optimized workflows")

- If exact metrics are missing:
  DO NOT invent fake numbers
  Use safe impact phrasing like:
  ("improved efficiency", "reduced latency", "enhanced user experience")

- Inject relevant keywords from the job description NATURALLY

- Keep each bullet ONE line only
- NO suggestions
- NO explanations
- NO paragraphs

GOOD EXAMPLE:
"Worked on frontend"
→ "Engineered responsive frontend components using React, improving UI performance and scalability"

Return STRICT JSON ONLY:
{
  "improved_resume": string[]
}

Candidate Resume:
${cleanResume.join("\n")}

Job Description:
${jobDescription}
`;

      const improveRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: improvePrompt }],
        response_format: { type: "json_object" },
      });

      const improveContent = improveRes.choices[0].message.content;

      if (!improveContent) {
        return NextResponse.json({ error: "Empty improve response" }, { status: 500 });
      }

      try {
        const improvedParsed = JSON.parse(improveContent);

        return NextResponse.json({
          improved: improvedParsed.improved_resume,
        });
      } catch (e) {
        console.error("Improve parse failed:", improveContent);
        return NextResponse.json({ error: "Invalid improve JSON", raw: improveContent }, { status: 500 });
      }
    }

    const basePrompt = `
You are an AI hiring system (ATS).

Analyze the resume against the job description.

- Identify where AI screening systems may MISINTERPRET or UNDERVALUE the candidate
- Explain WHY this happens (e.g., keyword bias, job title mismatch, lack of context)
- Provide actionable ways to GAME or OPTIMIZE the resume to pass AI screening
- Keep insights short, tactical, and practical

For each adversarial insight, return an object with:
- issue: what AI gets wrong
- why: why the AI fails
- exploit: how to fix or game it
- impact: what improvement this creates (e.g., avoids rejection, improves match)

Return STRICT JSON in this format:

{
  "score": number,
  "missing_keywords": string[],
  "weak_points": string[],
  "improvements": string[],
  "adversarial_insights": {
    "issue": string,
    "why": string,
    "exploit": string,
    "impact": string
  }[]
}

Resume:
${cleanResume.join("\n")}

Job Description:
${jobDescription}
`;

    // GPT (balanced)
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: basePrompt }],
      response_format: { type: "json_object" },
    });

    const gptContent = gptResponse.choices[0].message.content;

    if (!gptContent) {
      return NextResponse.json({ error: "Empty GPT response" }, { status: 500 });
    }

    let gptParsed;
    try {
      gptParsed = JSON.parse(gptContent);
    } catch (e) {
      console.error("GPT JSON parse failed:", gptContent);
      return NextResponse.json({ error: "Invalid GPT JSON", raw: gptContent }, { status: 500 });
    }

    // Strict AI (different personality)
    const strictPrompt = `
You are a REALISTIC ATS system used by companies.

Rules:
- Evaluate strictly based on job requirements
- Penalize missing keywords, but not excessively
- Do not assume candidate is unqualified by default
- Consider transferable skills where reasonable
- Score should reflect a fair but critical evaluation

- Identify where AI screening systems may MISINTERPRET or UNDERVALUE the candidate
- Explain WHY this happens (e.g., keyword bias, job title mismatch, lack of context)
- Provide actionable ways to GAME or OPTIMIZE the resume to pass AI screening
- Keep insights short, tactical, and practical

For each adversarial insight, return an object with:
- issue: what AI gets wrong
- why: why the AI fails
- exploit: how to fix or game it
- impact: what improvement this creates (e.g., avoids rejection, improves match)

Return STRICT JSON:

{
  "score": number,
  "missing_keywords": string[],
  "weak_points": string[],
  "improvements": string[],
  "adversarial_insights": {
    "issue": string,
    "why": string,
    "exploit": string,
    "impact": string
  }[]
}

Resume:
${cleanResume.join("\n")}

Job Description:
${jobDescription}
`;

    const altResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: strictPrompt }],
      response_format: { type: "json_object" },
    });

    const altContent = altResponse.choices[0].message.content;

    if (!altContent) {
      return NextResponse.json({ error: "Empty ALT response" }, { status: 500 });
    }

    let altParsed;
    try {
      altParsed = JSON.parse(altContent);
    } catch (e) {
      console.error("ALT JSON parse failed:", altContent);
      return NextResponse.json({ error: "Invalid ALT JSON", raw: altContent }, { status: 500 });
    }

    // Normalize adversarial_insights structure for both
    const normalizeInsights = (insights: any[]) => {
      return (insights || []).map((i: any) => {
        if (typeof i === "string") {
          return {
            issue: i,
            why: "AI interpretation issue",
            exploit: "Refine wording and structure",
            impact: "Improves AI readability",
          };
        }
        return {
          issue: i.issue || "",
          why: i.why || "",
          exploit: i.exploit || "",
          impact: i.impact || "",
        };
      });
    };

    gptParsed.adversarial_insights = normalizeInsights(gptParsed.adversarial_insights);
    altParsed.adversarial_insights = normalizeInsights(altParsed.adversarial_insights);

    console.log("GPT:", gptParsed);
    console.log("STRICT:", altParsed);

    // Blind Spot Analysis
    const blindSpotPrompt = `
Compare the following two AI evaluations of a candidate:

GPT Evaluation:
${JSON.stringify(gptParsed, null, 2)}

ATS Evaluation:
${JSON.stringify(altParsed, null, 2)}

Identify:
1. Where they disagree
2. Where one AI ignored relevant or transferable skills
3. Where keywords were over-penalized
4. Any unfair or biased assumptions

Return STRICT JSON:

{
  "blind_spots": string[]
}
`;

    const blindResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: blindSpotPrompt }],
      response_format: { type: "json_object" },
    });

    let blindParsed = { blind_spots: [] as string[] };
    const blindContent = blindResponse.choices[0].message.content;

    if (blindContent) {
      try {
        blindParsed = JSON.parse(blindContent);
      } catch (e) {
        console.error("Blind spot parse failed:", blindContent);
      }
    }

    // Human Context Addendum
    const addendumPrompt = `
Based on the resume, job description, and identified AI blind spots:

Blind Spots:
${JSON.stringify(blindParsed.blind_spots, null, 2)}

Write a short professional paragraph that a candidate can attach to their resume explaining context that AI might miss.

Keep it concise, confident, and human-friendly.
`;

    const addendumResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: addendumPrompt }],
    });

    const addendumText = addendumResponse.choices[0].message.content || "";

    // Keyword Disagreement Detection
    const gptKeywords = new Set((gptParsed?.missing_keywords || []) as string[]);
    const altKeywords = new Set((altParsed?.missing_keywords || []) as string[]);

    const disagreements: string[] = [];

    // In ATS but not GPT
    for (const kw of altKeywords) {
      if (!gptKeywords.has(kw)) {
        disagreements.push(`ATS flagged "${kw}" but GPT did not`);
      }
    }

    // In GPT but not ATS
    for (const kw of gptKeywords) {
      if (!altKeywords.has(kw)) {
        disagreements.push(`GPT flagged "${kw}" but ATS did not`);
      }
    }

    return NextResponse.json({
      gpt: gptParsed,
      alt: altParsed,
      blind_spots: blindParsed.blind_spots,
      addendum: addendumText,
      disagreements,
      adversarial: {
        gpt: gptParsed.adversarial_insights,
        alt: altParsed.adversarial_insights,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}