import { usageEvents } from "../../src/usage-events.ts";

const allowedEvents = new Set<string>(usageEvents);
const messageID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function onRequestPost({ request, env }: {
  request: Request;
  env: { PORCUPINE_USAGE_WRITE_KEY?: string };
}) {
  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }

  const event = request.headers.get("X-Lunii-Event");
  const id = request.headers.get("X-Lunii-Message-Id");
  if (!event || !allowedEvents.has(event) || !id || !messageID.test(id)) {
    return new Response(null, { status: 400 });
  }

  const key = env.PORCUPINE_USAGE_WRITE_KEY;
  if (!key) return new Response(null, { status: 503 });

  try {
    const response = await fetch("https://api.getporcupine.eu/ingest/v1/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "track", name: event, message_id: id }),
      redirect: "error",
      signal: AbortSignal.timeout(3000),
    });
    return new Response(null, { status: response.ok ? 204 : 502 });
  } catch {
    return new Response(null, { status: 502 });
  }
}
