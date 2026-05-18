export type AssetType = "office" | "retail" | "industrial" | "multifamily"

export type SignalType =
  | "breaking-news"
  | "tenant-event"
  | "macro"
  | "comp-transaction"
  | "market-survey"
  | "regulatory"

export type ImpactDirection = "positive" | "negative" | "neutral"

export type SignalStatus = "pending" | "confirmed" | "dismissed"

export type Asset = {
  id: string
  name: string
  address: string
  zipCode: string
  city: string
  assetType: AssetType
  sqft: number
  purchasePrice: number
  currentValuation: number
  loanAmount: number
  loanMaturity: string
  interestRate: number
  annualDebtService: number
  // Operational metrics
  noi: number
  occupancyRate: number
  marketRent: number
  areaMarketRent: number
  areaVacancyRate: number
  // Covenant thresholds
  dscr: number
  dscrCovenant: number
  ltv: number
  ltvCovenant: number
  // Confidence intervals (probabilistic underwriting)
  ci?: {
    dscr: ConfidenceInterval
    noi: ConfidenceInterval
    valuation: ConfidenceInterval
  }
}

export type Signal = {
  id: string
  assetId: string
  headline: string
  source: string
  publishedAt: string
  signalType: SignalType
  isRealTime: boolean
  urgencyWeight: number
  // AI validation output
  relevanceScore: number
  impactDirection: ImpactDirection
  impactMagnitude: number
  aiReasoning: string
  status: SignalStatus
  confirmedAt?: string
  reasoning?: AIReasoningArtifact
}

export type Strategy = {
  label: string
  description: string
  adjustedNoi: number
  adjustedDscr: number
  adjustedBreachProbability: number
  tradeoff: string
}

export type ForwardPoint = {
  month: number
  dscrP50: number
  breachProb: number
}

export type AgentRole = "scout" | "validator" | "impact-analyst" | "router"

export type AgentOutcome = "ingested" | "dismissed" | "deferred" | "escalated"

export type AgentActivity = {
  id: string
  timestamp: string
  agent: AgentRole
  action: string
  detail: string
  outcome: AgentOutcome
  relevanceScore?: number
  sourcesScanned?: number
  signalId?: string
  zipCode?: string
  source?: string
}

export type ConfidenceInterval = {
  low: number
  high: number
  level: number // 0.9, 0.95
}

export type AIReasoningArtifact = {
  prompt: string
  reasoning: string[]
  sources: { title: string; url: string; snippet: string }[]
  alternatives: { interpretation: string; whyRejected: string }[]
}

export type HistoricalPoint = {
  month: string // "2025-06"
  dscr: number
  noi: number
}

export type SimResult = {
  id: string
  signalId: string
  assetId: string
  runAt: string
  runsCount: number
  dscr: { p10: number; p50: number; p90: number; current: number }
  ltv: { p10: number; p50: number; p90: number; current: number }
  dscrBreachProbability: number
  ltvBreachProbability: number
  defaultProbability: number
  forwardTimeline: ForwardPoint[]
  strategies: Strategy[]
  scenarioNarrative: string
  reasoning?: AIReasoningArtifact
}
