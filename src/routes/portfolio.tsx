import { createFileRoute, Link } from "@tanstack/react-router"
import { AppShell } from "@/components/AppShell"
import { Sparkline } from "@/components/Sparkline"
import { useAssets, useCREStore, usePendingCount } from "@/store/cre-store"
import { getHistory } from "@/data/historical-metrics"
import type { Asset } from "@/data/cre-types"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
})

type RiskTier = "low" | "med" | "high"

function riskStatus(asset: Asset): RiskTier {
  const headroom = asset.dscr - asset.dscrCovenant
  if (asset.dscr < asset.dscrCovenant) return "high"
  if (headroom < 0.15) return "med"
  return "low"
}

const statusConfig: Record<RiskTier, { dot: string; label: string; badge: string; left: string }> = {
  low: {
    dot: "bg-risk-low",
    label: "Healthy",
    badge: "bg-risk-low-bg text-risk-low border-risk-low/30",
    left: "border-l-risk-low",
  },
  med: {
    dot: "bg-risk-med",
    label: "Watch",
    badge: "bg-risk-med-bg text-risk-med border-risk-med/30",
    left: "border-l-risk-med",
  },
  high: {
    dot: "bg-risk-high",
    label: "Breach risk",
    badge: "bg-risk-high-bg text-risk-high border-risk-high/40",
    left: "border-l-risk-high",
  },
}

function Portfolio() {
  const assets = useAssets()
  const signals = useCREStore((s) => s.signals)
  const pendingCount = usePendingCount()

  const totalValue = assets.reduce((s, a) => s + a.currentValuation, 0)
  const atRisk = assets.filter((a) => riskStatus(a) !== "low").length
  const avgDscr = assets.reduce((s, a) => s + a.dscr, 0) / assets.length

  return (
    <AppShell>
      <div className="space-y-12">
        {/* Headline */}
        <header className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            Portfolio · {assets.length} assets · {pendingCount} pending signal{pendingCount === 1 ? "" : "s"}
          </p>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight text-ink-strong sm:text-5xl">
            Read the market.{" "}
            <em className="italic text-ink-muted">Before the report does.</em>
          </h1>
          <p className="max-w-2xl text-[13px] leading-[1.6] text-ink-muted">
            Synthesizes CoStar, Bloomberg, MSCI, Trepp, and news sources. Designed to augment the
            analyst workflow, not replace it.
          </p>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 border border-rule bg-rule md:grid-cols-4">
          <Kpi
            label="Portfolio value"
            value={`$${(totalValue / 1_000_000).toFixed(1)}M`}
            hint="3 assets under management"
          />
          <Kpi
            label="Assets at risk"
            value={String(atRisk)}
            hint={atRisk === 0 ? "All covenants healthy" : "Near or below covenant"}
            tone={atRisk > 0 ? "med" : undefined}
          />
          <Kpi
            label="Avg DSCR"
            value={avgDscr.toFixed(2)}
            hint="NOI-weighted, all assets"
          />
          <Kpi
            label="Pending signals"
            value={String(pendingCount)}
            hint={pendingCount > 0 ? "Awaiting your confirmation" : "Inbox clear"}
            tone={pendingCount > 0 ? "med" : undefined}
            action={pendingCount > 0 ? { label: "Review →", to: "/inbox" } : undefined}
          />
        </div>

        {/* Asset table */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              Assets
            </h2>
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
              Sorted by risk
            </span>
          </div>
          {/* Desktop table — scrollable on tablet */}
          <div className="hidden overflow-x-auto border border-rule bg-card sm:block">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[3px_2.2fr_0.8fr_0.7fr_84px_0.7fr_0.7fr_1.1fr_56px] items-center gap-4 border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                <span />
                <span>Asset</span>
                <span>Type</span>
                <span>DSCR</span>
                <span>12-mo trend</span>
                <span>Covenant</span>
                <span>LTV</span>
                <span>Status</span>
                <span className="text-right">Alerts</span>
              </div>
              {assets
                .slice()
                .sort((a, b) => {
                  const order: Record<RiskTier, number> = { high: 0, med: 1, low: 2 }
                  return order[riskStatus(a)] - order[riskStatus(b)]
                })
                .map((asset, idx, arr) => {
                  const tier = riskStatus(asset)
                  const cfg = statusConfig[tier]
                  const pending = signals.filter(
                    (s) => s.assetId === asset.id && s.status === "pending",
                  ).length

                  return (
                    <Link
                      key={asset.id}
                      to="/asset/$id"
                      params={{ id: asset.id }}
                      className={cn(
                        "group grid grid-cols-[3px_2.2fr_0.8fr_0.7fr_84px_0.7fr_0.7fr_1.1fr_56px] items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2",
                        idx !== arr.length - 1 && "border-b border-rule",
                      )}
                    >
                      <span className={cn("h-full w-[3px]", cfg.dot)} />
                      <div>
                        <p className="font-serif text-[17px] leading-snug text-ink-strong">
                          {asset.name}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                          {asset.city} · {asset.sqft.toLocaleString()} sqft
                        </p>
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                        {asset.assetType}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[15px] tabular-nums",
                          tier === "high"
                            ? "text-risk-high"
                            : tier === "med"
                            ? "text-risk-med"
                            : "text-ink-strong",
                        )}
                      >
                        {asset.dscr.toFixed(2)}
                      </span>
                      <Sparkline data={getHistory(asset.id)} field="dscr" tone={tier} width={76} height={20} />
                      <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                        ≥ {asset.dscrCovenant.toFixed(2)}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                        {(asset.ltv * 100).toFixed(0)}%
                      </span>
                      <span
                        className={cn(
                          "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                          cfg.badge,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                      <span className="flex justify-end">
                        {pending > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-risk-med-bg px-2 font-mono text-[11px] font-medium text-risk-med">
                            {pending}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-ink-muted/40">—</span>
                        )}
                      </span>
                    </Link>
                  )
                })}
            </div>
          </div>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {assets
              .slice()
              .sort((a, b) => {
                const order: Record<RiskTier, number> = { high: 0, med: 1, low: 2 }
                return order[riskStatus(a)] - order[riskStatus(b)]
              })
              .map((asset) => {
                const tier = riskStatus(asset)
                const cfg = statusConfig[tier]
                const pending = signals.filter(
                  (s) => s.assetId === asset.id && s.status === "pending",
                ).length

                return (
                  <Link
                    key={asset.id}
                    to="/asset/$id"
                    params={{ id: asset.id }}
                    className={cn(
                      "flex gap-3 border border-rule bg-card p-4 transition-colors hover:bg-paper-2",
                      "border-l-4",
                      cfg.left,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-serif text-[17px] leading-snug text-ink-strong">
                          {asset.name}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                            cfg.badge,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                        {asset.city} · {asset.assetType} · {asset.sqft.toLocaleString()} sqft
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">DSCR</p>
                          <p className={cn(
                            "font-mono text-[15px] tabular-nums",
                            tier === "high" ? "text-risk-high" : tier === "med" ? "text-risk-med" : "text-ink-strong",
                          )}>
                            {asset.dscr.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">Covenant</p>
                          <p className="font-mono text-[13px] tabular-nums text-ink-muted">≥ {asset.dscrCovenant.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted">LTV</p>
                          <p className="font-mono text-[13px] tabular-nums text-ink-muted">{(asset.ltv * 100).toFixed(0)}%</p>
                        </div>
                        {pending > 0 && (
                          <div className="ml-auto">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-risk-med-bg px-2 font-mono text-[11px] font-medium text-risk-med">
                              {pending}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
          </div>
        </section>

        {/* Sentinel status strip */}
        <div className="flex items-center justify-between border border-rule bg-card px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-strong">
              Sentinel agent
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
              Coverage: {assets.map((a) => a.city).filter((v, i, arr) => arr.indexOf(v) === i).join(" · ")}
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink-muted">
            Scheduled cadence · every 24h plus event-driven
          </span>
        </div>
      </div>
    </AppShell>
  )
}

function Kpi({
  label,
  value,
  hint,
  tone,
  action,
}: {
  label: string
  value: string
  hint: string
  tone?: "med" | "high"
  action?: { label: string; to: string }
}) {
  return (
    <div className="bg-card px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-3 font-serif text-[36px] leading-none tracking-tight",
          tone === "high" ? "text-risk-high" : tone === "med" ? "text-risk-med" : "text-ink-strong",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] text-ink-muted">{hint}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-risk-med hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
