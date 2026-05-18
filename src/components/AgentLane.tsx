import type { AgentRole } from "@/data/cre-types"
import { cn } from "@/lib/utils"

export const AGENT_META: Record<AgentRole, { label: string; tone: string; bg: string; text: string; border: string }> = {
  scout: {
    label: "Scout",
    tone: "ink",
    bg: "bg-ink-strong/5",
    text: "text-ink-strong",
    border: "border-ink-strong/30",
  },
  validator: {
    label: "Validator",
    tone: "med",
    bg: "bg-risk-med-bg/60",
    text: "text-risk-med",
    border: "border-risk-med/30",
  },
  "impact-analyst": {
    label: "Impact analyst",
    tone: "low",
    bg: "bg-risk-low-bg/60",
    text: "text-risk-low",
    border: "border-risk-low/30",
  },
  router: {
    label: "Router",
    tone: "high",
    bg: "bg-risk-high-bg/40",
    text: "text-risk-high",
    border: "border-risk-high/30",
  },
}

type LaneState = "idle" | "running" | "done"

export function AgentLane({
  agent,
  state,
  action,
  detail,
  timestamp,
}: {
  agent: AgentRole
  state: LaneState
  action?: string
  detail?: string
  timestamp?: string
}) {
  const cfg = AGENT_META[agent]
  return (
    <div className={cn("flex flex-col gap-2 border px-4 py-3", cfg.border, cfg.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-mono text-[10px] uppercase tracking-[0.18em]", cfg.text)}>
          {cfg.label}
        </span>
        <LaneStateBadge state={state} />
      </div>
      <div className="min-h-[36px] space-y-1">
        {action && (
          <p className="text-[12px] leading-snug text-ink-strong">{action}</p>
        )}
        {detail && (
          <p className="font-mono text-[10px] tracking-[0.06em] text-ink-muted">{detail}</p>
        )}
        {state === "running" && !action && (
          <p className="font-mono text-[11px] tracking-[0.06em] text-ink-muted">
            <span className="inline-block animate-pulse">●</span> working…
          </p>
        )}
        {state === "idle" && (
          <p className="font-mono text-[11px] tracking-[0.06em] text-ink-muted/40">queued</p>
        )}
      </div>
      {timestamp && (
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
          {timestamp}
        </p>
      )}
    </div>
  )
}

function LaneStateBadge({ state }: { state: LaneState }) {
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-risk-low">
        ✓ Done
      </span>
    )
  }
  if (state === "running") {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-risk-med" />
        Running
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted/40">
      Queued
    </span>
  )
}
