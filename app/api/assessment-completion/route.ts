import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  'sk-or-v1-REDACTED';

const SYSTEM_PROMPT =
  'User provides the answers and the name of the assessment. Assistant produces the output based on those answers.';

const ASSISTANT_PROMPT = `Take the name of the assessment and use the answers to predict a state of where the user stands on the topic using the logic below.
Each response is scored as follows:
Never = 0
Rarely = 1
Frequently = 2
Very often = 3
The total score is calculated and converted into a percentage. Based on the score:
If the score is 0–33% output: Suggest that the user may not be experiencing significant concerns related to (the assessment performed) and may not need much help. However, staying mindful of your well-being is always beneficial.
If the score is 33–66% output: Indicate that the user may be experiencing some borderline symptoms/concerns related to (the assessment performed) and may need some help. If you'd like to know more, we can provide helpful insights.
If the score is 66–100% output: Suggest that the user may be facing significant symptoms/concerns related to (the assessment performed) and must seek for help .
# Conclusion: Tell the user if they want to know more they can book a video consultation with us for a detailed evaluation and personalized treatment plan.
# Rule: Strictly do not explain the score or describe how the answer was gotten. DO NOT output any raw JSON, technical IDs, or code blocks.
# Based on the output score set condition = ''low or moderate or severe''
# Provide the output in a nice, professional, and beautified markdown layout. Use headers and bullet points for readability.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userPrompt = body.prompt || '';

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        temperature: 0.8,
        model: 'x-ai/grok-4.1-fast',
        stream: false,
        max_tokens: 3000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'assistant', content: ASSISTANT_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `OpenRouter error: ${response.status}`, details: errText },
        { status: 502 }
      );
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
