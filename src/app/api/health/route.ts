import { json } from "@/lib/http";

export function GET() {
  return json({ status: "ok", version: "1.0.0", mode: "demo-capable" });
}
