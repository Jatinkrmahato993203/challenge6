import { z } from "zod";
import { simulateCommunity } from "@/lib/community";
import { body, guard, json, problem } from "@/lib/http";

const schema = z.strictObject({ minimumAttendees: z.number().int().min(1).max(20) });

export async function POST(request: Request) {
  const limited = guard(request, "community");
  if (limited) return limited;
  if (process.env.DEMO_DATA_MODE === "false") return problem("DEMO_UNAVAILABLE", "Demo data is disabled.", 503);
  const parsed = await body(request, schema);
  return "response" in parsed ? parsed.response : json(simulateCommunity(parsed.value.minimumAttendees));
}
