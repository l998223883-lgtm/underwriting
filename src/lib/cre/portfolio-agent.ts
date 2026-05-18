import { ASSETS } from "@/data/assets"
import { SEED_SIGNALS } from "@/data/signals"
import type { Asset, Signal } from "@/data/cre-types"

// Citation that the streamed answer can reference
export type Citation = {
  kind: "asset" | "signal"
  id: string
  label: string
}

export type AgentChunk =
  | { type: "text"; text: string }
  | { type: "citation"; citation: Citation }
  | { type: "step"; label: string }

export type AgentAnswer = {
  chunks: AgentChunk[]
  durationMs: number
}

// Tool functions available to the agent
const tools = {
  list_assets: (): Asset[] => ASSETS,
  get_asset: (id: string): Asset | undefined => ASSETS.find((a) => a.id === id),
  filter_signals: (criteria: Partial<{ assetId: string; status: string; impactDirection: string; isRealTime: boolean }>): Signal[] =>
    SEED_SIGNALS.filter((s) => {
      if (criteria.assetId && s.assetId !== criteria.assetId) return false
      if (criteria.status && s.status !== criteria.status) return false
      if (criteria.impactDirection && s.impactDirection !== criteria.impactDirection) return false
      if (criteria.isRealTime !== undefined && s.isRealTime !== criteria.isRealTime) return false
      return true
    }),
  portfolio_metric: (metric: "total_value" | "avg_dscr" | "at_risk_count"): number => {
    if (metric === "total_value") return ASSETS.reduce((s, a) => s + a.currentValuation, 0)
    if (metric === "avg_dscr") return ASSETS.reduce((s, a) => s + a.dscr, 0) / ASSETS.length
    if (metric === "at_risk_count")
      return ASSETS.filter((a) => a.dscr < a.dscrCovenant + 0.15).length
    return 0
  },
}

function classify(query: string): "exposure" | "irvine" | "rate" | "retail" | "summary" | "dismissed" | "default" {
  const q = query.toLowerCase()
  if (/exposure|biggest|risk|breach|covenant/.test(q)) return "exposure"
  if (/irvine|spectrum|office|amazon/.test(q)) return "irvine"
  if (/rate|treasury|fed|10y|interest/.test(q)) return "rate"
  if (/retail|nordstrom|costa|anchor/.test(q)) return "retail"
  if (/summary|summarize|recap|last|week|signals/.test(q)) return "summary"
  if (/dismiss|wrong|missed|review/.test(q)) return "dismissed"
  return "default"
}

export function runPortfolioAgent(query: string): AgentAnswer {
  const intent = classify(query)
  const chunks: AgentChunk[] = []

  // Reasoning steps shown above the answer
  chunks.push({ type: "step", label: "Parsing question" })
  chunks.push({ type: "step", label: "Querying portfolio state" })

  if (intent === "exposure") {
    chunks.push({ type: "step", label: "Computing breach probabilities per asset" })
    chunks.push({
      type: "text",
      text: "Your biggest single exposure right now is ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "southcoast-retail", label: "South Coast Retail Strip" },
    })
    chunks.push({
      type: "text",
      text: " — DSCR is 1.19 against a 1.25 covenant. The confidence interval (1.14, 1.24) doesn't even reach the threshold. Two pending signals would tip it past breach: ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "signal", id: "sig-005", label: "Nordstrom SoCal closures" },
    })
    chunks.push({
      type: "text",
      text: " (-13% NOI est.) and the ambient Fed rate signal. ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "irvine-office", label: "Irvine Spectrum" },
    })
    chunks.push({
      type: "text",
      text: " is in the watch zone at DSCR 1.31 but has 6pp of covenant headroom plus a confidence interval that stays above 1.25. ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "anaheim-industrial", label: "Anaheim Industrial" },
    })
    chunks.push({
      type: "text",
      text: " is the strongest position — DSCR 1.52 with positive supporting signals on industrial fundamentals.",
    })
    return { chunks, durationMs: 4500 }
  }

  if (intent === "irvine") {
    chunks.push({ type: "step", label: "Filtering signals by zip 92618" })
    chunks.push({
      type: "text",
      text: "There are four active signals on ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "irvine-office", label: "Irvine Spectrum Class-A Office" },
    })
    chunks.push({
      type: "text",
      text: ". The most material is ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "signal", id: "sig-001", label: "Amazon reducing Irvine footprint by 20%" },
    })
    chunks.push({
      type: "text",
      text: " — Validator confidence 91%, est NOI impact -9%. Backing context: Q1 OC office vacancy at 18.3% (CBRE). One offsetting positive: City of Irvine approved a $340M transit hub adjacent to Spectrum — long-horizon positive for renewal rents.",
    })
    return { chunks, durationMs: 4000 }
  }

  if (intent === "rate") {
    chunks.push({ type: "step", label: "Stress-testing at 10Y = 5.5%" })
    chunks.push({
      type: "text",
      text: "If the 10Y treasury hits 5.5%, the breach order is: (1) ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "southcoast-retail", label: "South Coast Retail" },
    })
    chunks.push({
      type: "text",
      text: " — already below covenant in median case; refinance window 2027-03; cap-rate widening compounds existing NOI compression. (2) ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "irvine-office", label: "Irvine Spectrum" },
    })
    chunks.push({
      type: "text",
      text: " — 2028-06 refinance, gives more time; sensitivity 0.18 DSCR per 100bps. (3) ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "anaheim-industrial", label: "Anaheim Industrial" },
    })
    chunks.push({
      type: "text",
      text: " — most resilient; 2030 maturity, low leverage, rate-shock survivable.",
    })
    return { chunks, durationMs: 4500 }
  }

  if (intent === "retail") {
    chunks.push({ type: "step", label: "Mapping anchor-tenant risk" })
    chunks.push({
      type: "text",
      text: "Only one of your three assets carries anchor-tenant risk: ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "asset", id: "southcoast-retail", label: "South Coast Retail Strip" },
    })
    chunks.push({
      type: "text",
      text: ". Twelve of fourteen inline tenants have co-tenancy clauses tied to anchor presence. The active signal — ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "signal", id: "sig-005", label: "Nordstrom SoCal closures" },
    })
    chunks.push({
      type: "text",
      text: " — would trigger most of them within 12 months. Default rate on co-tenancy activation historically 67% (NREI 2025). Confirming this signal in the inbox would route you straight to the strategy simulation.",
    })
    return { chunks, durationMs: 4200 }
  }

  if (intent === "summary") {
    chunks.push({ type: "step", label: "Pulling 7-day signal log" })
    chunks.push({
      type: "text",
      text: "In the last 7 days the agent ingested 10 signals across your three assets. Material negatives: ",
    })
    chunks.push({
      type: "citation",
      citation: { kind: "signal", id: "sig-001", label: "Amazon reducing Irvine footprint" },
    })
    chunks.push({ type: "text", text: ", " })
    chunks.push({
      type: "citation",
      citation: { kind: "signal", id: "sig-005", label: "Nordstrom SoCal closures" },
    })
    chunks.push({
      type: "text",
      text: ", and the May FOMC rate signal. Positives: Irvine transit hub approval, Port of Long Beach volumes +18% YoY, and a confirmed CPI step-up of +2.1% across the retail portfolio. The scouts also dismissed 23 candidates as noise — you can review those in /activity.",
    })
    return { chunks, durationMs: 4500 }
  }

  if (intent === "dismissed") {
    chunks.push({ type: "step", label: "Re-examining last 7 days of dismissals" })
    chunks.push({
      type: "text",
      text: "The scout dismissed 23 candidates last week. Of those, two flagged as borderline relevance (0.40-0.55) — both deferred rather than dismissed: a regional bank lending rumor and an Anaheim zoning hearing notice. Worth a manual review in /activity. The rest were below 0.20 relevance: weather coverage, restaurant closures, tabloid content. Calibration looks healthy.",
    })
    return { chunks, durationMs: 3800 }
  }

  // Default — show portfolio overview
  chunks.push({
    type: "text",
    text: `I can tell you about three assets totalling $${(tools.portfolio_metric("total_value") / 1_000_000).toFixed(1)}M: `,
  })
  chunks.push({
    type: "citation",
    citation: { kind: "asset", id: "irvine-office", label: "Irvine Spectrum" },
  })
  chunks.push({ type: "text", text: ", " })
  chunks.push({
    type: "citation",
    citation: { kind: "asset", id: "southcoast-retail", label: "South Coast Retail" },
  })
  chunks.push({ type: "text", text: ", and " })
  chunks.push({
    type: "citation",
    citation: { kind: "asset", id: "anaheim-industrial", label: "Anaheim Industrial" },
  })
  chunks.push({
    type: "text",
    text: ". Try asking: 'what's my biggest exposure?' or 'summarize Irvine' or 'what breaks if rates hit 5.5%?'",
  })
  return { chunks, durationMs: 3500 }
}

export const SUGGESTED_QUERIES = [
  "What's my biggest exposure right now?",
  "If 10Y treasury hits 5.5%, who breaches first?",
  "Summarize the last 7 days of signals",
  "Which assets have anchor-tenant risk?",
  "What did the scout dismiss last week?",
]
