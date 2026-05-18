import type { Asset, Signal, SimResult, Strategy, ForwardPoint } from "../../data/cre-types"

function sampleNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function buildStrategies(asset: Asset, impactMagnitude: number): Strategy[] {
  const annualDS = asset.annualDebtService

  if (impactMagnitude >= 0) {
    // Positive signal — strategies are about capitalizing
    const baseNoi = asset.noi * (1 + impactMagnitude)
    const baseDscr = baseNoi / annualDS
    return [
      {
        label: "Hold — Maintain Current Rent",
        description: "No immediate rent change. Benefit accrues naturally as market improves.",
        adjustedNoi: baseNoi,
        adjustedDscr: baseDscr,
        adjustedBreachProbability: Math.max(0, asset.dscr < asset.dscrCovenant + 0.1 ? 0.05 : 0),
        tradeoff: `NOI +${(impactMagnitude * 100).toFixed(1)}% vs covenant. Low risk, conservative.`,
      },
      {
        label: "Accelerate — Early Lease Renewal Push",
        description: "Proactively renew expiring leases at current strong terms before market peaks.",
        adjustedNoi: baseNoi * 1.02,
        adjustedDscr: (baseNoi * 1.02) / annualDS,
        adjustedBreachProbability: 0,
        tradeoff: `Lock in +${((impactMagnitude + 0.02) * 100).toFixed(1)}% NOI uplift now; slight concession on term length.`,
      },
    ]
  }

  // Negative signal — mitigation strategies
  const baseNoi = asset.noi * (1 + impactMagnitude)
  const baseDscr = baseNoi / annualDS
  const dscrBreachBaseline = baseDscr < asset.dscrCovenant ? 0.67 : Math.max(0, (asset.dscrCovenant - baseDscr) / asset.dscrCovenant * 2.5)

  // Strategy B: proactive rent concession to retain tenants
  const concessionRate = -0.03
  const stratBNoi = asset.noi * (1 + impactMagnitude * 0.5 + concessionRate)
  const stratBDscr = stratBNoi / annualDS
  const stratBBreach = stratBDscr < asset.dscrCovenant
    ? Math.max(0.05, dscrBreachBaseline * 0.35)
    : Math.max(0, dscrBreachBaseline * 0.3)

  // Strategy C: aggressive lease-up (capital deployment)
  const stratCNoi = asset.noi * (1 + impactMagnitude * 0.3)
  const stratCDscr = stratCNoi / annualDS
  const stratCBreach = stratCDscr < asset.dscrCovenant
    ? Math.max(0.08, dscrBreachBaseline * 0.5)
    : Math.max(0, dscrBreachBaseline * 0.45)

  return [
    {
      label: "Hold — No Action",
      description: "Maintain current rent and leasing strategy. Monitor for further deterioration.",
      adjustedNoi: baseNoi,
      adjustedDscr: baseDscr,
      adjustedBreachProbability: dscrBreachBaseline,
      tradeoff: `Preserves NOI optionality but covenant breach risk is ${(dscrBreachBaseline * 100).toFixed(0)}%.`,
    },
    {
      label: "Defensive — Proactive Rent Concession (-3%)",
      description: "Offer 3% rent reduction to anchor tenants proactively to prevent vacancy.",
      adjustedNoi: stratBNoi,
      adjustedDscr: stratBDscr,
      adjustedBreachProbability: stratBBreach,
      tradeoff: `NOI -${Math.abs(concessionRate * 100).toFixed(0)}% but breach probability drops to ${(stratBBreach * 100).toFixed(0)}%. Buys covenant headroom.`,
    },
    {
      label: "Offensive — Capital Deployment for Lease-Up",
      description: "Deploy $800k TI/LC budget to backfill vacancy risk with new long-term tenants.",
      adjustedNoi: stratCNoi,
      adjustedDscr: stratCDscr,
      adjustedBreachProbability: stratCBreach,
      tradeoff: `Upfront capex of ~$800k; breach risk at ${(stratCBreach * 100).toFixed(0)}%. Best long-term positioning.`,
    },
  ]
}

function buildForwardTimeline(
  currentDscr: number,
  impactMagnitude: number,
  dscrCovenant: number,
): ForwardPoint[] {
  const months = [1, 2, 3, 4, 5, 6]
  return months.map((month) => {
    // Impact propagates gradually (e.g., lease renewals take time)
    const propagationFactor = 1 - Math.exp(-month / 3)
    const projectedDscr = currentDscr * (1 + impactMagnitude * propagationFactor)
    const headroom = (projectedDscr - dscrCovenant) / dscrCovenant
    const breachProb = headroom < 0
      ? Math.min(0.95, -headroom * 4)
      : Math.max(0, 0.05 - headroom * 0.5)
    return { month, dscrP50: projectedDscr, breachProb }
  })
}

export function runSimulation(asset: Asset, signal: Signal): SimResult {
  const RUNS = 1000
  const stdDev = Math.abs(signal.impactMagnitude) * 0.4

  const dscrResults: number[] = []
  const ltvResults: number[] = []
  let dscrBreaches = 0
  let ltvBreaches = 0

  for (let i = 0; i < RUNS; i++) {
    const sampledImpact = sampleNormal(signal.impactMagnitude, stdDev)
    const newNoi = asset.noi * (1 + sampledImpact)
    const newDscr = newNoi / asset.annualDebtService
    // Valuation moves at roughly 2x the NOI impact (cap rate effect)
    const newValuation = asset.currentValuation * (1 + sampledImpact * 1.8)
    const newLtv = asset.loanAmount / newValuation

    dscrResults.push(newDscr)
    ltvResults.push(newLtv)
    if (newDscr < asset.dscrCovenant) dscrBreaches++
    if (newLtv > asset.ltvCovenant) ltvBreaches++
  }

  dscrResults.sort((a, b) => a - b)
  ltvResults.sort((a, b) => a - b)

  const dscrP10 = percentile(dscrResults, 0.1)
  const dscrP50 = percentile(dscrResults, 0.5)
  const dscrP90 = percentile(dscrResults, 0.9)
  const ltvP10 = percentile(ltvResults, 0.1)
  const ltvP50 = percentile(ltvResults, 0.5)
  const ltvP90 = percentile(ltvResults, 0.9)

  const dscrBreachProb = dscrBreaches / RUNS
  const ltvBreachProb = ltvBreaches / RUNS
  const defaultProbability = Math.min(0.95, (dscrBreachProb * 0.6 + ltvBreachProb * 0.4) * 0.8)

  const strategies = buildStrategies(asset, signal.impactMagnitude)
  const forwardTimeline = buildForwardTimeline(asset.dscr, signal.impactMagnitude, asset.dscrCovenant)

  const breachNote =
    dscrBreachProb > 0.5
      ? `DSCR covenant breach is likely (${(dscrBreachProb * 100).toFixed(0)}% probability). Immediate attention required.`
      : dscrBreachProb > 0.15
      ? `DSCR breach risk is elevated at ${(dscrBreachProb * 100).toFixed(0)}%. Monitor closely.`
      : `Covenant headroom is adequate under this scenario.`

  const dirNote =
    signal.impactDirection === "negative"
      ? `The signal is expected to reduce NOI by ~${Math.abs(signal.impactMagnitude * 100).toFixed(1)}%, propagating over 3-6 months as lease renewals and market rents adjust.`
      : `The signal is expected to improve NOI by ~${(signal.impactMagnitude * 100).toFixed(1)}%, though timing of realization depends on lease rollover schedule.`

  const scenarioNarrative = `${dirNote} Median simulated DSCR: ${dscrP50.toFixed(2)} (current: ${asset.dscr.toFixed(2)}, covenant: ${asset.dscrCovenant.toFixed(2)}). ${breachNote}`

  return {
    id: `sim-${signal.id}-${Date.now()}`,
    signalId: signal.id,
    assetId: asset.id,
    runAt: new Date().toISOString(),
    runsCount: RUNS,
    dscr: { p10: dscrP10, p50: dscrP50, p90: dscrP90, current: asset.dscr },
    ltv: { p10: ltvP10, p50: ltvP50, p90: ltvP90, current: asset.ltv },
    dscrBreachProbability: dscrBreachProb,
    ltvBreachProbability: ltvBreachProb,
    defaultProbability,
    forwardTimeline,
    strategies,
    scenarioNarrative,
  }
}
