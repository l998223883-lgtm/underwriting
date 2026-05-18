import type { HistoricalPoint } from "./cre-types"

const MONTHS_BACK = 12

function months(): string[] {
  const out: string[] = []
  const now = new Date("2026-05-01")
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return out
}

// Irvine office — slow drift down on DSCR/NOI as tech tenants pull back
function irvineSeries(): HistoricalPoint[] {
  const m = months()
  const dscrTrend = [1.42, 1.40, 1.39, 1.38, 1.37, 1.36, 1.35, 1.34, 1.33, 1.33, 1.32, 1.31]
  const noiTrend = [4_580_000, 4_545_000, 4_510_000, 4_480_000, 4_450_000, 4_415_000, 4_390_000, 4_360_000, 4_340_000, 4_325_000, 4_310_000, 4_300_000]
  return m.map((month, i) => ({ month, dscr: dscrTrend[i], noi: noiTrend[i] }))
}

// South Coast retail — falling steadily, recently crossed covenant threshold
function southCoastSeries(): HistoricalPoint[] {
  const m = months()
  const dscrTrend = [1.34, 1.32, 1.30, 1.29, 1.28, 1.27, 1.25, 1.24, 1.23, 1.22, 1.21, 1.19]
  const noiTrend = [1_945_000, 1_920_000, 1_900_000, 1_888_000, 1_870_000, 1_850_000, 1_822_000, 1_805_000, 1_788_000, 1_772_000, 1_755_000, 1_733_000]
  return m.map((month, i) => ({ month, dscr: dscrTrend[i], noi: noiTrend[i] }))
}

// Anaheim industrial — strong, slight upward trend
function anaheimSeries(): HistoricalPoint[] {
  const m = months()
  const dscrTrend = [1.46, 1.47, 1.47, 1.48, 1.48, 1.49, 1.50, 1.50, 1.51, 1.51, 1.52, 1.52]
  const noiTrend = [2_540_000, 2_555_000, 2_570_000, 2_580_000, 2_590_000, 2_602_000, 2_612_000, 2_618_000, 2_625_000, 2_630_000, 2_635_000, 2_640_000]
  return m.map((month, i) => ({ month, dscr: dscrTrend[i], noi: noiTrend[i] }))
}

export const HISTORICAL: Record<string, HistoricalPoint[]> = {
  "irvine-office": irvineSeries(),
  "southcoast-retail": southCoastSeries(),
  "anaheim-industrial": anaheimSeries(),
}

export function getHistory(assetId: string): HistoricalPoint[] {
  return HISTORICAL[assetId] ?? []
}
