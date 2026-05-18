import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { AppShell } from "@/components/AppShell"
import { AGENT_META } from "@/components/AgentLane"
import { AGENT_ACTIVITY } from "@/data/agent-activity"
import type { AgentActivity, AgentOutcome, AgentRole } from "@/data/cre-types"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/activity")({
  component: Activity,
})

const outcomeMeta: Record<AgentOutcome, { label: string; cls: string }> = {
  ingested: { label: "Ingested", cls: "border-risk-low/30 bg-risk-low-bg/60 text-risk-low" },
  dismissed: { label: "Dismissed", cls: "border-rule bg-paper-2/60 text-ink-muted" },
  deferred: { label: "Deferred", cls: "border-risk-med/30 bg-risk-med-bg/40 text-risk-med" },
  escalated: { label: "Escalated", cls: "border-risk-high/30 bg-risk-high-bg/40 text-risk-high" },
}

function Activity() {
  const [agentFilter, setAgentFilter] = useState<AgentRole | "all">("all")
  const [outcomeFilter, setOutcomeFilter] = useState<AgentOutcome | "all">("all")

  const entries = AGENT_ACTIVITY
    .filter((e) => (agentFilter === "all" ? true : e.agent === agentFilter))
    .filter((e) => (outcomeFilter === "all" ? true : e.outcome === outcomeFilter))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  // Group by date
  const byDate: Record<string, AgentActivity[]> = {}
  for (const e of entries) {
    const d = e.timestamp.slice(0, 10)
    byDate[d] = byDate[d] ?? []
    byDate[d].push(e)
  }

  const counts = {
    total: AGENT_ACTIVITY.length,
    ingested: AGENT_ACTIVITY.filter((e) => e.outcome === "ingested").length,
    dismissed: AGENT_ACTIVITY.filter((e) => e.outcome === "dismissed").length,
    deferred: AGENT_ACTIVITY.filter((e) => e.outcome === "deferred").length,
    escalated: AGENT_ACTIVITY.filter((e) => e.outcome === "escalated").length,
  }

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Header */}
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            Activity · {counts.total} agent operations · last 7 days
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink-strong">
            The iceberg.{" "}
            <em className="italic text-ink-muted">Beneath the inbox.</em>
          </h1>
          <p className="max-w-2xl text-[15px] leading-[1.6] text-ink-muted">
            Every operation an agent ran on your behalf — including the {counts.dismissed} candidates
            it filtered out as noise so your inbox stayed signal.
          </p>
          <p className="max-w-2xl text-[13px] leading-[1.6] text-ink-muted">
            Pipeline outputs span agency feeds (CoStar, Bloomberg, MSCI, Trepp) and news wires.
          </p>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-px border border-rule bg-rule">
          <StatTile label="Ingested" value={counts.ingested} hint="Became signals" />
          <StatTile label="Escalated" value={counts.escalated} hint="Pushed to your inbox" />
          <StatTile label="Deferred" value={counts.deferred} hint="Watching, not yet routed" />
          <StatTile label="Dismissed" value={counts.dismissed} hint="Filtered as noise" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 border-y border-rule py-3">
          <FilterRow label="Agent">
            <FilterChip active={agentFilter === "all"} onClick={() => setAgentFilter("all")}>All</FilterChip>
            {(["scout", "validator", "impact-analyst", "router"] as AgentRole[]).map((role) => (
              <FilterChip key={role} active={agentFilter === role} onClick={() => setAgentFilter(role)}>
                {AGENT_META[role].label}
              </FilterChip>
            ))}
          </FilterRow>
          <span className="h-5 w-px bg-rule" />
          <FilterRow label="Outcome">
            <FilterChip active={outcomeFilter === "all"} onClick={() => setOutcomeFilter("all")}>All</FilterChip>
            {(["ingested", "escalated", "deferred", "dismissed"] as AgentOutcome[]).map((o) => (
              <FilterChip key={o} active={outcomeFilter === o} onClick={() => setOutcomeFilter(o)}>
                {outcomeMeta[o].label}
              </FilterChip>
            ))}
          </FilterRow>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(byDate).map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <div className="border border-rule bg-card">
                {items.map((entry, idx) => (
                  <ActivityRow
                    key={entry.id}
                    entry={entry}
                    last={idx === items.length - 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="border border-dashed border-rule py-20 text-center">
            <p className="font-serif text-2xl text-ink-strong">No matching activity.</p>
            <p className="mt-2 text-[13px] text-ink-muted">Clear the filters to see all recorded activity.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ActivityRow({ entry, last }: { entry: AgentActivity; last: boolean }) {
  const cfg = AGENT_META[entry.agent]
  const outcome = outcomeMeta[entry.outcome]
  return (
    <div
      className={cn(
        "grid grid-cols-[88px_120px_1fr_120px] items-start gap-4 px-5 py-4",
        !last && "border-b border-rule",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {new Date(entry.timestamp).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
          cfg.border,
          cfg.bg,
          cfg.text,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.text === "text-risk-low" ? "bg-risk-low" : cfg.text === "text-risk-med" ? "bg-risk-med" : cfg.text === "text-risk-high" ? "bg-risk-high" : "bg-ink-strong")} />
        {cfg.label}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-[14px] leading-snug text-ink-strong">{entry.action}</p>
        <p className="text-[12px] leading-snug text-ink-muted">{entry.detail}</p>
        {(entry.relevanceScore !== undefined || entry.sourcesScanned !== undefined || entry.signalId) && (
          <div className="flex flex-wrap gap-3 pt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {entry.sourcesScanned !== undefined && <span>{entry.sourcesScanned} sources scanned</span>}
            {entry.relevanceScore !== undefined && (
              <span>relevance {(entry.relevanceScore * 100).toFixed(0)}%</span>
            )}
            {entry.signalId && (
              <Link to="/inbox" className="text-ink-strong underline">
                signal {entry.signalId} ↗
              </Link>
            )}
          </div>
        )}
      </div>
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
          outcome.cls,
        )}
      >
        {outcome.label}
      </span>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-card px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p className="mt-3 font-serif text-[36px] leading-none tracking-tight text-ink-strong">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-ink-muted">{hint}</p>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        active
          ? "border-ink-strong bg-ink-strong text-paper"
          : "border-rule bg-paper text-ink-muted hover:bg-paper-2",
      )}
    >
      {children}
    </button>
  )
}
