"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { modeSchema, planSchema, type DataMode, type HouseholdPlan, type OptimizeResult } from "@/lib/contracts";
import { demoDate, samplePlan } from "@/lib/demo";
import { atLocal, localDate, localTime } from "@/lib/time";

const planKey = "saansai:v1:householdPlan";
const prefsKey = "saansai:v1:preferences";
const storageSchema = z.strictObject({ plan: planSchema, restore: planSchema.nullable() });
const storedPrefs = z.strictObject({ mode: modeSchema });

type Workspace = z.infer<typeof storageSchema> & { mode: DataMode; saved: boolean };
type WorkspaceContext = {
  workspace: Workspace;
  ready: boolean;
  result: OptimizeResult | null;
  pending: boolean;
  notice: string;
  updatePlan: (plan: HouseholdPlan) => void;
  chooseMode: (mode: DataMode) => void;
  toggleSave: (saved: boolean) => void;
  clear: () => void;
  compare: (plan?: HouseholdPlan) => Promise<void>;
  accept: (activities: HouseholdPlan["activities"]) => void;
  restore: () => void;
  reject: () => void;
};

const Context = createContext<WorkspaceContext | null>(null);

export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing planner context");
  return context;
}

export class ApiError extends Error {
  constructor(message: string, readonly code: string | undefined) { super(message); }
}

export async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json();
  if (!response.ok) throw new ApiError(value.error?.message ?? "The request could not be completed.", value.error?.code);
  return value;
}

function newWorkspace(mode: DataMode = "live"): Workspace {
  return { plan: samplePlan("delhi", mode === "demo" ? demoDate : localDate()), restore: null, mode, saved: false };
}

function fromStorage(): Workspace {
  try {
    const saved = storageSchema.safeParse(JSON.parse(localStorage.getItem(planKey) ?? "null"));
    const prefs = storedPrefs.safeParse(JSON.parse(localStorage.getItem(prefsKey) ?? "null"));
    if (saved.success && prefs.success) return { ...saved.data, ...prefs.data, saved: true };
  } catch {}
  return newWorkspace();
}

function store(workspace: Workspace, removeSaved: boolean) {
  try {
    if (workspace.saved && planSchema.safeParse(workspace.plan).success) {
      localStorage.setItem(planKey, JSON.stringify({ plan: workspace.plan, restore: workspace.restore }));
      localStorage.setItem(prefsKey, JSON.stringify({ mode: workspace.mode }));
    } else if (removeSaved) {
      localStorage.removeItem(planKey);
      localStorage.removeItem(prefsKey);
    }
    return true;
  } catch { return false; }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const demoRequested = useSearchParams().get("mode") === "demo";
  const initialized = useRef(false);
  const [workspace, setWorkspace] = useState<Workspace>(() => newWorkspace());
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    // Use the browser address because App Router can briefly expose cached search parameters.
    const explicitDemo = url.searchParams.get("mode") === "demo";
    if (initialized.current && !explicitDemo) return;
    initialized.current = true;
    if (explicitDemo) {
      url.searchParams.delete("mode");
      window.history.replaceState(null, "", url);
    }
    setWorkspace(explicitDemo ? newWorkspace("demo") : fromStorage());
    setReady(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (explicitDemo) setResult(null);
  }, [demoRequested, pathname]);

  function commit(next: Workspace, message = "", removeSaved = false) {
    setWorkspace(next);
    const ok = store(next, removeSaved);
    if (!ok && next.saved) setWorkspace({ ...next, saved: false });
    setNotice(ok ? message : "Browser storage is unavailable. Your routine is open in this tab.");
  }

  async function compare(plan = workspace.plan) {
    const parsed = planSchema.safeParse(plan);
    setNotice("");
    if (!parsed.success) {
      setNotice("Give every activity a name and enter valid times before comparing.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/plans/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: parsed.data, mode: workspace.mode }),
      });
      const value = response.status === 503
        ? await response.json() as OptimizeResult
        : await readJson<OptimizeResult>(response);
      if (plan !== workspace.plan) commit({ ...workspace, plan });
      setResult(value);
      router.push("/compare");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The comparison could not be completed.");
    } finally { setPending(false); }
  }

  const context: WorkspaceContext = {
    workspace, ready, result, pending, notice, compare,
    updatePlan(plan) { setResult(null); commit({ ...workspace, plan }); },
    chooseMode(mode) {
      if (mode === workspace.mode) return;
      const date = mode === "demo" ? demoDate : localDate();
      const activities = workspace.plan.activities.map(activity => ({
        ...activity,
        startAt: atLocal(date, localTime(activity.startAt)),
        candidateStarts: activity.candidateStarts.map(value => atLocal(date, localTime(value))),
      }));
      commit({ ...workspace, mode, plan: { ...workspace.plan, dateLocal: date, activities }, restore: null });
      setResult(null);
    },
    toggleSave(saved) {
      if (saved && !planSchema.safeParse(workspace.plan).success) {
        setNotice("Complete the required activity fields before saving.");
        return;
      }
      commit({ ...workspace, saved }, saved ? "Routine saved on this device." : "Local routine removed.", !saved);
    },
    clear() {
      commit(newWorkspace(workspace.mode), "Saved routine deleted. The example activities have been reset.", true);
      setResult(null);
    },
    accept(activities) {
      commit({ ...workspace, plan: { ...workspace.plan, activities }, restore: workspace.restore ?? workspace.plan },
        workspace.saved ? "Alternative accepted and saved on this device." : "Alternative accepted for this session.");
      setResult(null);
      router.push("/planner");
    },
    restore() {
      if (!workspace.restore) return;
      commit({ ...workspace, plan: workspace.restore, restore: null }, "Original routine restored.");
      setResult(null);
      router.push("/planner");
    },
    reject() { setResult(null); setNotice("Original routine kept."); router.push("/planner"); },
  };

  return <Context.Provider value={context}>{children}</Context.Provider>;
}
