import { Suspense, type ReactNode } from "react";
import { WorkspaceProvider } from "@/components/workspace-state";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="shell app-intro" role="status">Opening the planner…</p>}>
    <WorkspaceProvider>{children}</WorkspaceProvider>
  </Suspense>;
}
