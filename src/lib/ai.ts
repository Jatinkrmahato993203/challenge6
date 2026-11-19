import { createHmac, timingSafeEqual } from "node:crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { statuses, type OptimizeResult } from "./contracts";
import { fallbackExplanation, type Explanation } from "./explanation";

const contextSchema = z.strictObject({ status: z.enum(statuses), demo: z.boolean(), expires: z.number().int() });
type Context = z.infer<typeof contextSchema>;
const signingKey = () => process.env.SAANSAI_SIGNING_SECRET;
const signature = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

export function signExplanation(result: OptimizeResult) {
  const key = signingKey();
  if (!key || key.length < 32) return undefined;
  const context: Context = { status: result.status, demo: result.source?.dataKind === "demo", expires: Date.now() + 15 * 60_000 };
  const payload = Buffer.from(JSON.stringify(context)).toString("base64url");
  return `${payload}.${signature(payload, key)}`;
}

export function verifyExplanation(token: string) {
  const key = signingKey();
  const match = token.match(/^([\w-]+)\.([\w-]{43})$/);
  if (!key || key.length < 32 || !match) return null;
  const [, payload, provided] = match;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(signature(payload, key)))) return null;
  try {
    const value = contextSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return value.success && value.data.expires > Date.now() ? value.data : null;
  } catch {
    return null;
  }
}

const emphasis = {
  constraints: "Locked activities keep their original start times.",
  disruption: "Review the time shift and decide whether it fits your household.",
  evidence: "Open the evidence panel to see the forecast inputs used in the comparison.",
} as const;

const selectionSchema = z.strictObject({
  emphasis: z.enum(["constraints", "disruption", "evidence"]),
  guidanceIds: z.array(z.enum(["IA-01", "IA-02", "IA-03", "IA-04", "IA-05"])).max(3),
});

export function validateModelOutput(raw: string, context: Context): Explanation {
  const fallback = fallbackExplanation(context.status, context.demo);
  try {
    const selection = selectionSchema.parse(JSON.parse(raw));
    if (context.status !== "ALTERNATIVES_FOUND") return fallback;
    return {
      ...fallback, provider: "model", tradeoffs: [emphasis[selection.emphasis]],
      guidanceIds: [...new Set(selection.guidanceIds)],
    };
  } catch {
    return fallback;
  }
}

export async function explain(context: Context): Promise<Explanation> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const fallback = fallbackExplanation(context.status, context.demo);
  if (process.env.AI_EXPLAIN_ENABLED !== "true" || !key || !model || context.status !== "ALTERNATIVES_FOUND") return fallback;
  try {
    const client = new GoogleGenAI({ apiKey: key, httpOptions: { timeout: 4500 } });
    const output = await client.models.generateContent({
      model,
      contents: `Choose which approved point to emphasize for a feasible time-shift comparison using ${context.demo ? "synthetic" : "regional forecast"} data. Select up to three indoor guidance IDs. Do not generate facts, numeric claims, advice text or schedule changes.`,
      config: {
        abortSignal: AbortSignal.timeout(5000), responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT, required: ["emphasis", "guidanceIds"],
          properties: {
            emphasis: { type: Type.STRING, enum: ["constraints", "disruption", "evidence"] },
            guidanceIds: { type: Type.ARRAY, maxItems: "3", items: { type: Type.STRING, enum: ["IA-01", "IA-02", "IA-03", "IA-04", "IA-05"] } },
          },
        },
      },
    });
    return validateModelOutput(output.text ?? "", context);
  } catch {
    return fallback;
  }
}
