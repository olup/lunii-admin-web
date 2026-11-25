const errorTypes = new Set([
  "Error", "AggregateError", "EvalError", "RangeError", "ReferenceError",
  "SyntaxError", "TypeError", "URIError", "DOMException", "AbortError",
  "NotAllowedError", "NotFoundError", "QuotaExceededError", "SecurityError",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function publicFrame(frame: unknown, origin: string) {
  if (!isRecord(frame) || typeof frame.filename !== "string") return [];
  const { filename, lineno, colno, chunk_id } = frame;
  if (typeof lineno !== "number" || !Number.isSafeInteger(lineno) || lineno < 1 ||
      typeof colno !== "number" || !Number.isSafeInteger(colno) || colno < 0) return [];

  let asset: URL;
  try {
    asset = new URL(filename, origin);
  } catch {
    return [];
  }
  if (asset.origin !== origin || !/^\/assets\/[a-zA-Z0-9._-]+\.js$/.test(asset.pathname)) return [];

  return [{
    filename: asset.origin + asset.pathname,
    lineno,
    colno,
    chunk_id: typeof chunk_id === "string" && /^[a-f0-9-]{32,36}$/i.test(chunk_id) ? chunk_id : undefined,
  }];
}

export function publicExceptions(exceptions: unknown, origin: string) {
  if (!Array.isArray(exceptions)) return [];
  return exceptions.slice(0, 4).filter(isRecord).map(({ type, stacktrace }) => {
    const frames = isRecord(stacktrace) && Array.isArray(stacktrace.frames)
      ? stacktrace.frames.slice(-12).flatMap(frame => publicFrame(frame, origin))
      : [];
    return {
      type: typeof type === "string" && errorTypes.has(type) ? type : "Error",
      stacktrace: frames.length ? { type: "raw", frames } : undefined,
    };
  });
}
