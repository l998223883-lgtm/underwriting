import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { AppShell } from "@/components/AppShell"
import { useCREStore, usePendingCount } from "@/store/cre-store"
import { getAsset } from "@/data/assets"
import type { Signal, SimResult } from "@/data/cre-types"
import { cn } from "@/lib/utils"
import { StreamingReasoning, MiniAgentRow } from "@/components/StreamingReasoning"
import { ReasoningPanel, InspectButton } from "@/components/ReasoningPanel"

export const Route = createFileRoute("/inbox")({
  component: Inbox,
})

const signalTypeLabel: Record<string, string> = {
  "breaking-news": "Breaking news",
  "tenant-event": "Tenant event",
  "macro": "Macro signal",
  "comp-transaction": "Comp transaction",
  "market-survey": "Market survey",
  "regulatory": "Regulatory",
}

function Inbox() {
  const signals = useCREStore((s) => s.signals)
  const confirmSignal = useCREStore((s) => s.confirmSignal)
  const dismissSignal = useCREStore((s) => s.dismissSignal)
  const pendingCount = usePendingCount()

  const pending = signals.filter((s) => s.status === "pending")
  const realTime = pending.filter((s) => s.isRealTime)
  const periodic = pending.filter((s) => !s.isRealTime)

  const [simulating, setSimulating] = useState<string | null>(null)
  const [inlineResults, setInlineResults] = useState<Record<string, SimResult>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [inspecting, setInspecting] = useState<Signal | null>(null)

  function handleConfirm(signal: Signal) {
    setSimulating(signal.id)
  }

  function handleStreamComplete(signal: Signal) {
    const result = confirmSignal(signal.id)
    if (result) setInlineResults((prev) => ({ ...prev, [signal.id]: result }))
    setSimulating(null)
  }

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Headline */}
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            Inbox · {pendingCount} signal{pendingCount === 1 ? "" : "s"} pending
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink-strong">
            Today's signals.{" "}
            <em className="italic text-ink-muted">Validated.</em>
          </h1>
          <p className="max-w-2xl text-[15px] leading-[1.6] text-ink-muted">
            Signals are synthesized from agency feeds and news sources, filtered against each asset's
            underwriting model, and surfaced here for review. You confirm — the simulation runs.
          </p>
          <p className="max-w-2xl text-[13px] leading-[1.6] text-ink-muted">
            Agency feeds rarely cover every asset in a portfolio — Sentinel synthesizes across sources
            to close those gaps.
          </p>
          <div className="pt-2">
            <MiniAgentRow />
          </div>
        </header>

        {pendingCount === 0 && (
          <div className="border border-dashed border-rule py-20 text-center">
            <p className="font-serif text-2xl text-ink-strong">Inbox clear.</p>
            <p className="mt-2 text-[13px] text-ink-muted">
              View{" "}
              <Link to="/sim-history" className="underline">simulation history</Link>{" "}
              or revisit confirmed signals.
            </p>
          </div>
        )}

        {/* Real-time alerts */}
        {realTime.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-rule pb-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-high opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-high" />
              </span>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-risk-high">
                Real-time alerts
              </h2>
              <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
                {realTime.length} signal{realTime.length === 1 ? "" : "s"} · published today
              </span>
            </div>
            <div className="space-y-3">
              {realTime.map((sig) => (
                <SignalCard
                  key={sig.id}
                  signal={sig}
                  simulating={simulating === sig.id}
                  inlineResult={inlineResults[sig.id]}
                  expanded={!!expanded[sig.id]}
                  onToggleExpand={() => setExpanded((p) => ({ ...p, [sig.id]: !p[sig.id] }))}
                  onConfirm={() => handleConfirm(sig)}
                  onDismiss={() => dismissSignal(sig.id)}
                  onStreamComplete={() => handleStreamComplete(sig)}
                  onInspect={() => setInspecting(sig)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Periodic updates */}
        {periodic.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-rule pb-3">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Market updates
              </h2>
              <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
                {periodic.length} · historical & periodic data
              </span>
            </div>
            <div className="space-y-3">
              {periodic.map((sig) => (
                <SignalCard
                  key={sig.id}
                  signal={sig}
                  simulating={simulating === sig.id}
                  inlineResult={inlineResults[sig.id]}
                  expanded={!!expanded[sig.id]}
                  onToggleExpand={() => setExpanded((p) => ({ ...p, [sig.id]: !p[sig.id] }))}
                  onConfirm={() => handleConfirm(sig)}
                  onDismiss={() => dismissSignal(sig.id)}
                  onStreamComplete={() => handleStreamComplete(sig)}
                  onInspect={() => setInspecting(sig)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      <ReasoningPanel
        artifact={inspecting?.reasoning ?? null}
        contextLabel={inspecting?.headline}
        onClose={() => setInspecting(null)}
      />
    </AppShell>
  )
}

function SignalCard({
  signal,
  simulating,
  inlineResult,
  expanded,
  onToggleExpand,
  onConfirm,
  onDismiss,
  onStreamComplete,
  onInspect,
}: {
  signal: Signal
  simulating: boolean
  inlineResult?: SimResult
  expanded: boolean
  onToggleExpand: () => void
  onConfirm: () => void
  onDismiss: () => void
  onStreamComplete: () => void
  onInspect: () => void
}) {
  const asset = getAsset(signal.assetId)
  const dir = signal.impactDirection

  const accent =
    dir === "negative" ? "border-l-risk-high" : dir === "positive" ? "border-l-risk-low" : "border-l-rule"
  const impactColor =
    dir === "negative" ? "text-risk-high" : dir === "positive" ? "text-risk-low" : "text-ink-muted"

  return (
    <article className={cn("border border-rule border-l-[3px] bg-card", accent)}>
      <div className="px-6 py-5">
        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {signal.isRealTime && (
            <span className="inline-flex items-center gap-1.5 text-risk-high">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-high" />
              Today
            </span>
          )}
          <span>{signalTypeLabel[signal.signalType]}</span>
          {asset && <span className="text-ink">{asset.name}</span>}
          <span>{signal.source}</span>
        </div>

        {/* Headline + impact */}
        <div className="mt-3 flex items-start justify-between gap-6">
          <h3 className="max-w-[64ch] font-serif text-[20px] leading-snug text-ink-strong">
            {signal.headline}
          </h3>
          <div className="shrink-0 text-right">
            <p className={cn("font-mono text-[22px] tabular-nums", impactColor)}>
              {dir === "negative" ? "▼" : dir === "positive" ? "▲" : "—"}
              {Math.abs(signal.impactMagnitude * 100).toFixed(1)}%
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              est. NOI impact
            </p>
          </div>
        </div>

        {/* Confidence bars */}
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <ConfBar label="AI relevance" value={signal.relevanceScore} />
          <ConfBar label="Urgency" value={signal.urgencyWeight} tone="med" />
        </div>

        {/* Reasoning */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onToggleExpand}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted hover:text-ink-strong"
          >
            {expanded ? "▲ Hide" : "▼ Show"} AI reasoning
          </button>
          {signal.reasoning && <InspectButton onClick={onInspect} />}
        </div>
        {expanded && (
          <p className="mt-2 border-l-2 border-rule pl-4 text-[13px] leading-[1.6] text-ink-muted">
            {signal.aiReasoning}
          </p>
        )}

        {/* Actions */}
        {!inlineResult && !simulating && (
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={onConfirm}
              className="rounded-md bg-ink-strong px-4 py-2 text-[13px] font-medium text-paper shadow-sm transition-colors hover:bg-ink"
            >
              Confirm real → Run simulation
            </button>
            <button
              onClick={onDismiss}
              className="rounded-md border border-rule bg-paper px-4 py-2 text-[13px] text-ink-muted shadow-sm transition-colors hover:bg-paper-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {simulating && (
          <div className="mt-5 border-t border-rule pt-5">
            <StreamingReasoning signal={signal} onComplete={onStreamComplete} />
          </div>
        )}
      </div>

      {/* Inline result */}
      {inlineResult && (
        <div className="border-t border-rule bg-paper-2/40 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            Simulation complete · {inlineResult.runsCount.toLocaleString()} runs
          </p>
          <div className="mt-3 grid grid-cols-3 gap-x-6 border-y border-rule py-4">
            <MiniStat
              label="DSCR P50"
              value={inlineResult.dscr.p50.toFixed(2)}
              hint={`Was ${inlineResult.dscr.current.toFixed(2)}`}
              bad={inlineResult.dscr.p50 < (asset?.dscrCovenant ?? 1.25)}
            />
            <MiniStat
              label="Breach probability"
              value={`${(inlineResult.dscrBreachProbability * 100).toFixed(0)}%`}
              hint="DSCR below covenant"
              bad={inlineResult.dscrBreachProbability > 0.3}
            />
            <MiniStat
              label="Default probability"
              value={`${(inlineResult.defaultProbability * 100).toFixed(0)}%`}
              hint="Combined covenant risk"
              bad={inlineResult.defaultProbability > 0.15}
            />
          </div>
          <p className="mt-3 text-[13px] leading-[1.6] text-ink">{inlineResult.scenarioNarrative}</p>
          {asset && (
            <Link
              to="/asset/$id"
              params={{ id: asset.id }}
              className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-strong underline"
            >
              View response strategies →
            </Link>
          )}
        </div>
      )}
    </article>
  )
}

function ConfBar({ label, value, tone }: { label: string; value: number; tone?: "med" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-rule">
        <div
          className={cn("h-full rounded-full", tone === "med" ? "bg-risk-med" : "bg-ink-strong")}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-ink-muted">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  )
}

function MiniStat({
  label,
  value,
  hint,
  bad,
}: {
  label: string
  value: string
  hint: string
  bad?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className={cn("mt-1 font-serif text-[28px] leading-none tracking-tight", bad ? "text-risk-high" : "text-ink-strong")}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>
    </div>
  )
}
