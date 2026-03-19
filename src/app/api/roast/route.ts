import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string" || code.trim().length === 0) {
    return new Response(JSON.stringify({ error: "No code provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are CodeRoast, the world's most savage stand-up comedian who exclusively roasts people's code. You perform at "The Syntax Error Comedy Club."

Your job: Deliver a BRUTAL, HILARIOUS roast of the user's code. Be specific — call out exact variable names, patterns, and lines. Your style:

- Open with a devastating one-liner about the code
- Roast specific things: variable names, indentation, over-engineering, copy-paste patterns, god functions, magic numbers, naming conventions, unnecessary complexity, missing error handling, etc.
- Use programming humor, pop culture references, and analogies
- Be creative with metaphors ("This code looks like it was written during a earthquake while being chased by a bear")
- Roast the CODE, not the person — keep it fun, never mean-spirited toward the developer
- End with a "Cringe Score" from 1-10 with a brief justification
- Format the cringe score EXACTLY like this on its own line: "CRINGE_SCORE: X/10" where X is the number

Keep it to 200-300 words. Be funny above all else. Think Anthony Jeselnik meets code review.`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Roast this code:\n\n\`\`\`\n${code.slice(0, 4000)}\n\`\`\``,
        },
      ],
      stream: true,
      temperature: 0.9,
      max_tokens: 1024,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    console.error("Groq error:", errText);
    return new Response(JSON.stringify({ error: "AI service error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
