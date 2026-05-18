import type { ConfidenceInterval } from "@/data/cre-types"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  ci?: ConfidenceInterval
  rangeMin?: number
  rangeMax?: number
  threshold?: number
  thresholdDirection?: "min" | "max" // covenant min (DSCR) or max (LTV)
  format?: (v: number) => string
  tone?: "low" | "med" | "high" | "neutral"
  className?: string
}

export function MetricWithCI({
  value,
  ci,
  rangeMin,
  rangeMax,
  threshold,
  thresholdDirection = "min",
  format = (v) => v.toFixed(2),
  tone = "neutral",
  className,
}: Props) {
  if (!ci) {
    return <span className={className}>{value}</span>
  }

  const min = rangeMin ?? ci.low * 0.9
  const max = rangeMax ?? ci.high * 1.1
  const span = max - min
  const lowPct = ((ci.low - min) / span) * 100
  const highPct = ((ci.high - min) / span) * 100
  const widthPct = highPct - lowPct
  const thresholdPct = threshold !== undefined ? ((threshold - min) / span) * 100 : null

  // CI tone — if any of the CI extends into breach territory, color it risk-high
  const ciStraddlesThreshold =
    threshold !== undefined &&
    (thresholdDirection === "min" ? ci.low < threshold : ci.high > threshold)
  const whiskerColor = ciStraddlesThreshold ? "bg-risk-high" : tone === "low" ? "bg-risk-low" : tone === "med" ? "bg-risk-med" : tone === "high" ? "bg-risk-high" : "bg-ink-strong/60"

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline gap-2">
        <span>{value}</span>
        <span className="font-mono text-[10px] tracking-[0.06em] text-ink-muted">
          ±{format(((ci.high - ci.low) / 2))}
        </span>
      </div>
      <div className="relative h-1 w-[100px] rounded-full bg-rule/60">
        <div
          className={cn("absolute top-0 h-1 rounded-full", whiskerColor)}
          style={{ left: `${Math.max(0, lowPct)}%`, width: `${Math.min(100, widthPct)}%` }}
        />
        {thresholdPct !== null && (
          <div
            className="absolute -top-[2px] h-[5px] w-px bg-ink-strong/70"
            style={{ left: `${Math.max(0, Math.min(100, thresholdPct))}%` }}
          />
        )}
      </div>
    </div>
  )
}
