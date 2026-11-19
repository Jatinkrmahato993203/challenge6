import { randomUUID } from "node:crypto";
import type { z } from "zod";

const maxBody = 32 * 1024;
const limits = new Map<string, { count: number; reset: number }>();
const headers = { "Cache-Control": "no-store" };

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
export const problem = (code: string, message: string, status: number) =>
  json({ error: { code, message, requestId: randomUUID() } }, status);

export function guard(request: Request, route: string, ceiling?: number) {
  const client = (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "local").split(",").at(-1)!.trim().slice(0, 100);
  const origin = request.headers.get("origin");
  if (origin && request.method !== "GET") {
    const host = request.headers.get("host") ?? new URL(request.url).host;
    let originHost = "";
    try { originHost = new URL(origin).host; } catch {}
    if (originHost !== host && originHost !== new URL(request.url).host) return problem("ORIGIN_DENIED", "This request must come from SaansAI.", 403);
  }
  const configured = Number(process.env.RATE_LIMIT_PER_MINUTE);
  const limit = Math.min(Number.isInteger(configured) && configured > 0 ? configured : 30, ceiling ?? Infinity);
  const key = `${route}:${client}`;
  const now = Date.now();
  if (limits.size >= 1000) {
    for (const [entry, value] of limits) if (value.reset <= now) limits.delete(entry);
    if (limits.size >= 1000 && !limits.has(key)) return problem("RATE_LIMITED", "Wait a moment and try again.", 429);
  }
  const bucket = limits.get(key);
  if (!bucket || bucket.reset <= now) limits.set(key, { count: 1, reset: now + 60_000 });
  else if (++bucket.count > limit) return problem("RATE_LIMITED", "Wait a moment and try again.", 429);
  return null;
}

export async function body<T>(request: Request, schema: z.ZodType<T>): Promise<{ value: T } | { response: Response }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { response: problem("INVALID_CONTENT_TYPE", "Send a JSON request.", 415) };
  }
  if (Number(request.headers.get("content-length")) > maxBody) return { response: problem("BODY_TOO_LARGE", "The request exceeds 32 KB.", 413) };
  const reader = request.body?.getReader();
  if (!reader) return { response: problem("INVALID_INPUT", "A request body is required.", 422) };
  const decoder = new TextDecoder();
  let size = 0;
  let raw = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBody) {
        await reader.cancel();
        return { response: problem("BODY_TOO_LARGE", "The request exceeds 32 KB.", 413) };
      }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    const result = schema.safeParse(JSON.parse(raw + decoder.decode()));
    if (result.success) return { value: result.data };
  } catch {}
  return { response: problem("INVALID_INPUT", "Check the submitted values and try again.", 422) };
}
