export const runtime = "edge";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return new Response("Missing text", { status: 400 });
  }

  // Limit to ~4000 chars to stay within TTS limits
  const trimmed = text.slice(0, 4000);

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: trimmed,
      voice: "nova",
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(`OpenAI TTS error: ${response.status} ${err}`, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}
