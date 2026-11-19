import { z } from "zod";
import { explain, verifyExplanation } from "@/lib/ai";
import { body, guard, json, problem } from "@/lib/http";

const schema = z.strictObject({ token: z.string().max(512) });

export async function POST(request: Request) {
  const limited = guard(request, "explain", 8);
  if (limited) return limited;
  const parsed = await body(request, schema);
  if ("response" in parsed) return parsed.response;
  const context = verifyExplanation(parsed.value.token);
  if (!context) return problem("INVALID_CONTEXT", "Run a new comparison to get an explanation.", 422);
  return json(await explain(context));
}
