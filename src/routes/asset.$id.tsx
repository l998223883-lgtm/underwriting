import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { useState } from "react"
import { AppShell } from "@/components/AppShell"
import { Sparkline } from "@/components/Sparkline"
import { MetricWithCI } from "@/components/MetricWithCI"
import { ReasoningPanel, InspectButton } from "@/components/ReasoningPanel"
import { getAsset } from "@/data/assets"
import { getHistory } from "@/data/historical-metrics"
import { useSignalsForAsset, useLatestSimForAsset, useCREStore } from "@/store/cre-store"
import type { Asset, Signal, SimResult, Strategy, AIReasoningArtifact } from "@/data/cre-types"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/asset/$id")({
  loader: ({ params }) => {
    const asset = getAsset(params.id)
    if (!asset) throw notFound()
    return { asset }
  },
  component: AssetDetail,
})

function AssetDetail() {
  const { asset } = Route.useLoaderData()
  const signals = useSignalsForAsset(asset.id)
  const latestSim = useLatestSimForAsset(asset.id)
  const history = getHistory(asset.id)
  const [inspecting, setInspecting] = useState<{ artifact: AIReasoningArtifact; label: string } | null>(null)

  const dscrHeadroom = asset.dscr - asset.dscrCovenant
  const dscrTone =
    asset.dscr < asset.dscrCovenant ? "high" : dscrHeadroom < 0.15 ? "med" : "low"

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          <Link to="/portfolio" className="hover:text-ink-strong">Portfolio</Link>
          <span>/</span>
          <span className="text-ink-strong">{asset.name}</span>
        </nav>

        {/* Asset header */}
        <header className="flex items-end justify-between gap-8">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              {asset.assetType} · {asset.city} · {asset.zipCode}
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink-strong">
              {asset.name}
            </h1>
            <p className="text-[13px] text-ink-muted">{asset.address}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              Current valuation
            </p>
            <p className="mt-2 font-serif text-[36px] leading-none tracking-tight text-ink-strong">
              ${(asset.currentValuation / 1_000_000).toFixed(1)}M
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-muted">
              {asset.sqft.toLocaleString()} sqft
            </p>
          </div>
        </header>

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-px border border-rule bg-rule">
          <Metric
            label="DSCR"
            value={asset.dscr.toFixed(2)}
            hint={`Covenant min ${asset.dscrCovenant.toFixed(2)}`}
            tone={dscrTone}
            ci={asset.ci?.dscr}
            ciThreshold={asset.dscrCovenant}
            ciDir="min"
            sparkline={history.length > 0 ? { data: history, field: "dscr" as const, tone: dscrTone } : undefined}
          />
          <Metric
            label="LTV"
            value={`${(asset.ltv * 100).toFixed(0)}%`}
            hint={`Covenant max ${(asset.ltvCovenant * 100).toFixed(0)}%`}
            tone={asset.ltv > asset.ltvCovenant ? "high" : "low"}
          />
          <Metric
            label="NOI (annual)"
            value={`$${(asset.noi / 1_000_000).toFixed(2)}M`}
            hint={`Debt service $${(asset.annualDebtService / 1_000_000).toFixed(2)}M`}
            sparkline={history.length > 0 ? { data: history, field: "noi" as const, tone: dscrTone } : undefined}
          />
          <Metric
            label="Occupancy"
            value={`${(asset.occupancyRate * 100).toFixed(0)}%`}
            hint="Current in-place"
          />
          <Metric
            label="In-place rent"
            value={`$${asset.marketRent.toFixed(2)}`}
            hint={`Area avg $${asset.areaMarketRent.toFixed(2)} /sqft`}
          />
          <Metric
            label="Area vacancy"
            value={`${(asset.areaVacancyRate * 100).toFixed(1)}%`}
            hint="Submarket rate"
            tone={asset.areaVacancyRate > 0.15 ? "med" : undefined}
          />
        </div>

        {/* Simulation panel */}
        {latestSim ? (
          <SimResultPanel asset={asset} sim={latestSim} signals={signals} />
        ) : (
          <div className="border border-dashed border-rule py-16 text-center">
            <p className="font-serif text-2xl text-ink-strong">No simulation yet.</p>
            <p className="mt-2 text-[13px] text-ink-muted">
              Confirm a signal in the{" "}
              <Link to="/inbox" className="underline hover:text-ink-strong">inbox</Link>{" "}
              to run the Monte Carlo simulation.
            </p>
          </div>
        )}

        {/* Signal history */}
        <SignalHistory
          signals={signals}
          onInspect={(sig) =>
            sig.reasoning && setInspecting({ artifact: sig.reasoning, label: sig.headline })
          }
        />
      </div>
      <ReasoningPanel
        artifact={inspecting?.artifact ?? null}
        contextLabel={inspecting?.label}
        onClose={() => setInspecting(null)}
      />
    </AppShell>
  )
}

function Metric({
  label,
  value,
  hint,
  tone,
  ci,
  ciThreshold,
  ciDir,
  sparkline,
}: {
  label: string
  value: string
  hint: string
  tone?: "low" | "med" | "high"
  ci?: { low: number; high: number; level: number }
  ciThreshold?: number
  ciDir?: "min" | "max"
  sparkline?: { data: import("@/data/cre-types").HistoricalPoint[]; field: "dscr" | "noi"; tone: "low" | "med" | "high" }
}) {
  const valueClass =
    tone === "high" ? "text-risk-high" :
    tone === "med" ? "text-risk-med" :
    "text-ink-strong"

  return (
    <div className="bg-card px-6 py-5">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</p>
        {sparkline && (
          <Sparkline data={sparkline.data} field={sparkline.field} tone={sparkline.tone} width={70} height={20} />
        )}
      </div>
      <p className={cn("mt-3 font-serif text-[28px] leading-none tracking-tight tabular-nums", valueClass)}>
        {value}
      </p>
      <p className="mt-2 text-[12px] text-ink-muted">{hint}</p>
      {ci && (
        <div className="mt-4">
          <MetricWithCI
            value=""
            ci={ci}
            threshold={ciThreshold}
            thresholdDirection={ciDir}
            tone={tone}
            rangeMin={Math.min(ci.low, ciThreshold ?? ci.low) * 0.92}
            rangeMax={Math.max(ci.high, ciThreshold ?? ci.high) * 1.08}
          />
        </div>
      )}
    </div>
  )
}

function SimResultPanel({ asset, sim, signals }: { asset: Asset; sim: SimResult; signals: Signal[] }) {
  const triggerSignal = signals.find((s) => s.id === sim.signalId)
  const breachHigh = sim.dscrBreachProbability > 0.5

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-rule pb-3">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            Simulation · {new Date(sim.runAt).toLocaleDateString()}
          </p>
          <h2 className="font-serif text-[26px] leading-tight tracking-tight text-ink-strong">
            The simulation projects.{" "}
            <em className="italic text-ink-muted">You decide.</em>
          </h2>
        </div>
        <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
          {sim.runsCount.toLocaleString()} Monte Carlo iterations
        </span>
      </div>

      {triggerSignal && (
        <div className="border-l-[3px] border-l-ink-strong bg-card px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Triggered by</p>
          <p className="mt-1 text-[13px] text-ink-strong">{triggerSignal.headline}</p>
        </div>
      )}

      <div
        className={cn(
          "border px-5 py-4",
          breachHigh ? "border-risk-high/30 bg-risk-high-bg" : "border-risk-med/30 bg-risk-med-bg",
        )}
      >
        <p className={cn("text-[14px] leading-[1.6]", breachHigh ? "text-risk-high" : "text-risk-med")}>
          {sim.scenarioNarrative}
        </p>
      </div>

      {/* Distribution + timeline */}
      <div className="grid grid-cols-2 gap-px border border-rule bg-rule">
        <div className="bg-card px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            DSCR distribution
          </p>
          <div className="mt-4 space-y-2">
            <DistRow label="P10 pessimistic" value={sim.dscr.p10} threshold={asset.dscrCovenant} />
            <DistRow label="P50 median" value={sim.dscr.p50} threshold={asset.dscrCovenant} bold />
            <DistRow label="P90 optimistic" value={sim.dscr.p90} threshold={asset.dscrCovenant} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Covenant breach probability
            </span>
            <span
              className={cn(
                "font-mono text-[15px] tabular-nums",
                sim.dscrBreachProbability > 0.3 ? "text-risk-high" : "text-ink-strong",
              )}
            >
              {(sim.dscrBreachProbability * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-card px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            6-month forward projection
          </p>
          <div className="mt-4 space-y-2">
            {sim.forwardTimeline.map((pt) => (
              <div key={pt.month} className="grid grid-cols-[60px_1fr_44px_44px] items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Month {pt.month}
                </span>
                <div className="relative h-1 overflow-hidden rounded-full bg-rule">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pt.dscrP50 < asset.dscrCovenant ? "bg-risk-high" : "bg-risk-low",
                    )}
                    style={{ width: `${Math.min(100, (pt.dscrP50 / 2.0) * 100)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-right font-mono text-[11px] tabular-nums",
                    pt.dscrP50 < asset.dscrCovenant ? "text-risk-high" : "text-ink-strong",
                  )}
                >
                  {pt.dscrP50.toFixed(2)}
                </span>
                <span
                  className={cn(
                    "text-right font-mono text-[11px] tabular-nums",
                    pt.breachProb > 0.3 ? "text-risk-high" : "text-ink-muted",
                  )}
                >
                  {(pt.breachProb * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-end gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
              <span>DSCR</span>
              <span>Breach</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          Response strategies
        </p>
        <div className={cn("grid gap-px border border-rule bg-rule", sim.strategies.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {sim.strategies.map((s, i) => (
            <StrategyCard key={i} strategy={s} isHold={i === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DistRow({
  label,
  value,
  threshold,
  bold,
}: {
  label: string
  value: number
  threshold: number
  bold?: boolean
}) {
  const breach = value < threshold
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          bold ? "text-[18px]" : "text-[14px]",
          breach ? "text-risk-high" : "text-ink-strong",
        )}
      >
        {value.toFixed(2)}
        {breach && (
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-risk-high">↓ breach</span>
        )}
      </span>
    </div>
  )
}

function StrategyCard({ strategy, isHold }: { strategy: Strategy; isHold: boolean }) {
  const breachHigh = strategy.adjustedBreachProbability > 0.4
  return (
    <div className={cn("bg-card px-5 py-5 space-y-4", !isHold && "bg-risk-low-bg/40")}>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          {isHold ? "Baseline" : "Mitigation"}
        </p>
        <p className="mt-1 font-serif text-[18px] leading-tight text-ink-strong">{strategy.label}</p>
        <p className="mt-2 text-[12px] leading-[1.5] text-ink-muted">{strategy.description}</p>
      </div>
      <div className="space-y-1.5 border-t border-rule pt-3">
        <div className="flex justify-between text-[12px]">
          <span className="text-ink-muted">Projected DSCR</span>
          <span
            className={cn(
              "font-mono tabular-nums",
              strategy.adjustedDscr < 1.25 ? "text-risk-high" : "text-ink-strong",
            )}
          >
            {strategy.adjustedDscr.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-ink-muted">Breach probability</span>
          <span
            className={cn(
              "font-mono tabular-nums",
              breachHigh ? "text-risk-high" : "text-risk-low",
            )}
          >
            {(strategy.adjustedBreachProbability * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="text-[11px] italic leading-[1.5] text-ink-muted">{strategy.tradeoff}</p>
    </div>
  )
}

function SignalHistory({ signals, onInspect }: { signals: Signal[]; onInspect: (s: Signal) => void }) {
  const confirmSignal = useCREStore((s) => s.confirmSignal)
  const dismissSignal = useCREStore((s) => s.dismissSignal)
  if (signals.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        Signal history
      </h2>
      <div className="border border-rule bg-card">
        {signals.map((sig, idx) => {
          const accent =
            sig.impactDirection === "negative"
              ? "border-l-risk-high"
              : sig.impactDirection === "positive"
              ? "border-l-risk-low"
              : "border-l-rule"

          return (
            <div
              key={sig.id}
              className={cn(
                "border-l-[3px] px-5 py-4",
                accent,
                idx !== signals.length - 1 && "border-b border-rule",
                sig.status === "dismissed" && "opacity-50",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                    {sig.isRealTime && <span className="text-risk-high">● Breaking</span>}
                    <span>{new Date(sig.publishedAt).toLocaleDateString()}</span>
                    <span>{sig.source}</span>
                  </div>
                  <p className="text-[14px] leading-snug text-ink-strong">{sig.headline}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {sig.reasoning && <InspectButton onClick={() => onInspect(sig)} />}
                  <span
                    className={cn(
                      "font-mono text-[13px] tabular-nums",
                      sig.impactDirection === "negative"
                        ? "text-risk-high"
                        : sig.impactDirection === "positive"
                        ? "text-risk-low"
                        : "text-ink-muted",
                    )}
                  >
                    {sig.impactDirection === "negative" ? "▼" : sig.impactDirection === "positive" ? "▲" : "—"}
                    {Math.abs(sig.impactMagnitude * 100).toFixed(1)}%
                  </span>
                  {sig.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => confirmSignal(sig.id)}
                        className="rounded-md bg-ink-strong px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-ink"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => dismissSignal(sig.id)}
                        className="rounded-md border border-rule px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted hover:bg-paper-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                  {sig.status === "confirmed" && (
                    <span className="rounded-sm border border-risk-low/30 bg-risk-low-bg px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-risk-low">
                      Confirmed
                    </span>
                  )}
                  {sig.status === "dismissed" && (
                    <span className="rounded-sm border border-rule px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">
                      Dismissed
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
