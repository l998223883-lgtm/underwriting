import { createFileRoute, Link } from "@tanstack/react-router"
import { AppShell } from "@/components/AppShell"
import { useConfirmedSignals, useCREStore } from "@/store/cre-store"
import { getAsset } from "@/data/assets"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/sim-history")({
  component: SimHistory,
})

function SimHistory() {
  const confirmedSignals = useConfirmedSignals()
  const simResults = useCREStore((s) => s.simResults)
  const resetSignals = useCREStore((s) => s.resetSignals)

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Headline */}
        <header className="flex items-end justify-between gap-8">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              History · {confirmedSignals.length} confirmed event{confirmedSignals.length === 1 ? "" : "s"}
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink-strong">
              Every signal.{" "}
              <em className="italic text-ink-muted">Every consequence.</em>
            </h1>
            <p className="max-w-2xl text-[15px] leading-[1.6] text-ink-muted">
              The audit trail. What you confirmed, when, and what the simulation said the math would do.
            </p>
          </div>
          <button
            onClick={resetSignals}
            className="rounded-md border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted shadow-sm hover:bg-paper-2"
          >
            Reset demo state
          </button>
        </header>

        {confirmedSignals.length === 0 && (
          <div className="border border-dashed border-rule py-20 text-center">
            <p className="font-serif text-2xl text-ink-strong">No confirmed events yet.</p>
            <p className="mt-2 text-[13px] text-ink-muted">
              Go to the{" "}
              <Link to="/inbox" className="underline hover:text-ink-strong">inbox</Link>{" "}
              and confirm a signal to run your first simulation.
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          {confirmedSignals.map((signal, idx) => {
            const asset = getAsset(signal.assetId)
            const sim = simResults.find((r) => r.signalId === signal.id)
            const isBad = sim?.dscrBreachProbability != null && sim.dscrBreachProbability > 0.3
            const accent =
              signal.impactDirection === "negative"
                ? "border-l-risk-high"
                : signal.impactDirection === "positive"
                ? "border-l-risk-low"
                : "border-l-rule"

            return (
              <article
                key={signal.id}
                className={cn("border border-rule border-l-[3px] bg-card", accent)}
              >
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                        <span className="font-medium text-ink-strong">#{confirmedSignals.length - idx}</span>
                        {signal.isRealTime && <span className="text-risk-high">● Breaking</span>}
                        <span>
                          Confirmed{" "}
                          {signal.confirmedAt
                            ? new Date(signal.confirmedAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                        {asset && (
                          <Link
                            to="/asset/$id"
                            params={{ id: asset.id }}
                            className="underline hover:text-ink-strong"
                          >
                            {asset.name}
                          </Link>
                        )}
                        <span>{signal.source}</span>
                      </div>
                      <h3 className="mt-2 font-serif text-[20px] leading-snug text-ink-strong">
                        {signal.headline}
                      </h3>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "font-mono text-[22px] tabular-nums",
                          signal.impactDirection === "negative" ? "text-risk-high" : "text-risk-low",
                        )}
                      >
                        {signal.impactDirection === "negative" ? "▼" : "▲"}
                        {Math.abs(signal.impactMagnitude * 100).toFixed(1)}%
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                        NOI estimate
                      </p>
                    </div>
                  </div>
                </div>

                {sim && (
                  <div className="border-t border-rule px-6 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                      Simulation · {sim.runsCount.toLocaleString()} runs
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-x-6 border-y border-rule py-4">
                      <Stat
                        label="DSCR before"
                        value={sim.dscr.current.toFixed(2)}
                      />
                      <Stat
                        label="DSCR after (P50)"
                        value={sim.dscr.p50.toFixed(2)}
                        delta={sim.dscr.p50 - sim.dscr.current}
                      />
                      <Stat
                        label="Breach probability"
                        value={`${(sim.dscrBreachProbability * 100).toFixed(0)}%`}
                        bad={sim.dscrBreachProbability > 0.3}
                      />
                      <Stat
                        label="Default probability"
                        value={`${(sim.defaultProbability * 100).toFixed(0)}%`}
                        bad={sim.defaultProbability > 0.15}
                      />
                    </div>
                    <p className={cn("mt-3 text-[13px] leading-[1.6]", isBad ? "text-risk-high" : "text-ink")}>
                      {sim.scenarioNarrative}
                    </p>
                    {asset && (
                      <Link
                        to="/asset/$id"
                        params={{ id: asset.id }}
                        className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-strong underline"
                      >
                        View response strategies →
                      </Link>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

function Stat({
  label,
  value,
  delta,
  bad,
}: {
  label: string
  value: string
  delta?: number
  bad?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className={cn("mt-2 font-serif text-[24px] leading-none tracking-tight tabular-nums", bad ? "text-risk-high" : "text-ink-strong")}>
        {value}
      </p>
      {delta !== undefined && (
        <p className={cn("mt-1 font-mono text-[10px] tabular-nums", delta < 0 ? "text-risk-high" : "text-risk-low")}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(2)}
        </p>
      )}
    </div>
  )
}
