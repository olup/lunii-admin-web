import { randomIDPattern, usageEvents } from "../../src/usage-events.ts";

const allowedEvents = new Set<string>(usageEvents);

export async function onRequestPost({ request, env }: {
  request: Request;
  env: { PORCUPINE_USAGE_WRITE_KEY?: string };
}) {
  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }

  const event = request.headers.get("X-Lunii-Event");
  const id = request.headers.get("X-Lunii-Message-Id");
  const browserId = request.headers.get("X-Lunii-Browser-Id");
  if (
    !event ||
    !allowedEvents.has(event) ||
    !id ||
    !randomIDPattern.test(id) ||
    (browserId !== null && !randomIDPattern.test(browserId))
  ) {
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
      body: JSON.stringify({
        type: "track",
        name: event,
        message_id: id,
        actor_id: browserId ?? undefined,
      }),
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) return new Response(null, { status: 204 });
    console.warn("Porcupine rejected Lunii usage event", response.status);
    return new Response(null, { status: 502 });
  } catch (error) {
    console.warn("Lunii usage relay failed", error instanceof Error ? error.name : "unknown");
    return new Response(null, { status: 502 });
  }
}
