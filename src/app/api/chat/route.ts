import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");
  return new Anthropic({ apiKey: key });
}

const systemPrompt =
  "You are Fred, a sharp, direct AI dev assistant. Be concise, actionable, and avoid fluff.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming.map((message: { role: string; content: string }) => ({
      role: message.role === "assistant" ? "assistant" as const : "user" as const,
      content: message.content,
    }));

    const client = getClient();
    const stream = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              "delta" in event &&
              "text" in (event as any).delta
            ) {
              controller.enqueue(encoder.encode((event as any).delta.text));
            }
          }
        } catch (error) {
          console.error("Anthropic stream error", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(error?.message || "Internal server error", { status: 500 });
  }
}
