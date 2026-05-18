import type { Signal } from "./cre-types"

export const SEED_SIGNALS: Signal[] = [
  {
    id: "sig-001",
    assetId: "irvine-office",
    headline: "Amazon reducing Irvine office footprint by 20%, subletting 40k sqft",
    source: "Orange County Business Journal",
    publishedAt: "2026-05-18T07:14:00Z",
    signalType: "tenant-event",
    isRealTime: true,
    urgencyWeight: 0.92,
    relevanceScore: 0.91,
    impactDirection: "negative",
    impactMagnitude: -0.09,
    aiReasoning:
      "Amazon is a direct demand driver in the Irvine submarket. A 40k sqft sublease adds to the already-elevated 18.3% office vacancy, likely compressing asking rents 5-8% over the next two quarters. The subject property's tech-sector tenant mix creates contagion risk if other FAANG-adjacent tenants follow suit.",
    status: "pending",
    reasoning: {
      prompt:
        "You are a senior CRE underwriter at an institutional fund. Asset: Irvine Spectrum Class-A Office, 185k sqft, DSCR 1.31 (covenant 1.25). Tenant roll includes 28% tech-sector exposure. News: Amazon reducing Irvine office footprint by 20%, subletting 40k sqft. Submarket office vacancy currently 18.3%.\n\nAssess: (1) relevance, (2) impact direction, (3) NOI impact magnitude, (4) reasoning chain, (5) alternative interpretations you considered.",
      reasoning: [
        "Step 1 — Tenant context: Amazon is not a tenant of the subject property, so direct rent roll impact is zero.",
        "Step 2 — Submarket effect: 40k sqft added to 18.3% baseline vacancy = +0.4pp marginal vacancy. Asking rents typically compress 5-8% under sustained vacancy above 17%.",
        "Step 3 — Contagion: subject property has 28% FAANG-adjacent exposure. If 1-2 of these tenants follow Amazon's lead, renewal spreads narrow materially.",
        "Step 4 — Magnitude: blended effect over next 12 months → estimated NOI impact of -8% to -10%. Settled on -9% midpoint.",
      ],
      sources: [
        {
          title: "Amazon to shrink Irvine office footprint by 20%",
          url: "https://www.ocbj.com/commercial-real-estate/amazon-irvine-2026/",
          snippet: "Amazon is putting 40,000 square feet of its Irvine Spectrum office onto the sublease market, sources tell OCBJ...",
        },
        {
          title: "Q1 2026 Orange County Office MarketView",
          url: "https://www.cbre.com/insights/q1-2026-orange-county-office",
          snippet: "Total vacancy reached 18.3% at quarter end, the highest level since 2010, driven by sublease additions in tech-heavy submarkets.",
        },
        {
          title: "FAANG real estate footprint contraction tracker",
          url: "https://www.bisnow.com/national/news/office/faang-footprint-2026",
          snippet: "Amazon, Meta, and Google have collectively shed ~3.2M sqft of office space across the West Coast in the trailing 18 months.",
        },
      ],
      alternatives: [
        {
          interpretation: "Amazon may use the freed space for build-to-suit data center conversion (positive)",
          whyRejected: "Sublease listing explicitly markets the space as office. No conversion permits filed with the City of Irvine.",
        },
        {
          interpretation: "Sublease may be quickly absorbed by life sciences demand (neutral)",
          whyRejected: "Life sciences absorption in Irvine submarket was only 47k sqft for all of 2025 — insufficient to absorb 40k single sublease at current pricing.",
        },
      ],
    },
  },
  {
    id: "sig-002",
    assetId: "irvine-office",
    headline: "Fed signals 25bps rate hike at June FOMC; treasury 10Y hits 4.82%",
    source: "Bloomberg",
    publishedAt: "2026-05-18T06:45:00Z",
    signalType: "macro",
    isRealTime: true,
    urgencyWeight: 0.78,
    relevanceScore: 0.74,
    impactDirection: "negative",
    impactMagnitude: -0.04,
    aiReasoning:
      "Higher benchmark rates increase refinancing cost exposure at the 2028 maturity. The asset's floating-rate exposure is partially hedged, but a 25bps hike widens the cap rate spread by ~15bps, implying a valuation haircut of 2-3% at next appraisal. DSCR impact is indirect but real over the 18-month horizon.",
    status: "pending",
  },
  {
    id: "sig-003",
    assetId: "irvine-office",
    headline: "Q1 2026: Orange County office vacancy climbs to 18.3%, highest since 2010",
    source: "CBRE Market Report Q1 2026",
    publishedAt: "2026-04-15T09:00:00Z",
    signalType: "market-survey",
    isRealTime: false,
    urgencyWeight: 0.45,
    relevanceScore: 0.88,
    impactDirection: "negative",
    impactMagnitude: -0.05,
    aiReasoning:
      "Submarket vacancy at 18.3% significantly exceeds the subject property's current 13% effective vacancy. This creates downward pressure on in-place rents at renewal. The gap between subject rent ($3.85/sqft) and area average ($3.72/sqft) narrows the re-leasing spread and limits NOI upside.",
    status: "pending",
  },
  {
    id: "sig-004",
    assetId: "irvine-office",
    headline: "City of Irvine approves $340M transit hub adjacent to Irvine Spectrum",
    source: "Irvine City Planning Commission",
    publishedAt: "2026-05-17T15:30:00Z",
    signalType: "regulatory",
    isRealTime: true,
    urgencyWeight: 0.65,
    relevanceScore: 0.72,
    impactDirection: "positive",
    impactMagnitude: 0.04,
    aiReasoning:
      "Transit-oriented infrastructure typically improves walkability scores and attracts office tenants with commuter-heavy workforces. Over a 12-24 month horizon, this could support a 3-5% rent premium at renewal and reduce vacancy risk. Near-term DSCR impact is minimal but positive for long-term asset positioning.",
    status: "pending",
  },
  {
    id: "sig-005",
    assetId: "southcoast-retail",
    headline: "Nordstrom announces closure of 3 Southern California locations including Costa Mesa",
    source: "LA Times",
    publishedAt: "2026-05-18T08:02:00Z",
    signalType: "tenant-event",
    isRealTime: true,
    urgencyWeight: 0.97,
    relevanceScore: 0.94,
    impactDirection: "negative",
    impactMagnitude: -0.13,
    aiReasoning:
      "Nordstrom serves as an anchor traffic driver for the Costa Mesa retail submarket. Closure will depress co-tenancy foot traffic for inline tenants, triggering potential co-tenancy clause activations that allow rent reductions of 15-25%. The subject property's proximity creates direct NOI risk through both rent roll compression and elevated vacancy probability at next rollover.",
    status: "pending",
    reasoning: {
      prompt:
        "Asset: South Coast Retail Strip, 62k sqft, DSCR 1.19 (covenant 1.25 — already in watch zone). Located adjacent to South Coast Plaza submarket. 12 inline tenants of 14 have co-tenancy clauses tied to anchor presence.\n\nNews: Nordstrom announces closure of 3 SoCal locations including Costa Mesa. Assess relevance, direction, NOI impact, reasoning, and alternatives.",
      reasoning: [
        "Step 1 — Co-tenancy mechanics: 12 of 14 inline tenants have clauses allowing 15-25% rent step-downs or co-tenancy termination if anchor occupancy falls below threshold.",
        "Step 2 — Worst-case rent compression: if 8 tenants activate step-downs at 20% (midpoint), portfolio rent income drops ~14%.",
        "Step 3 — Vacancy probability: 3 of the 12 are also at term-end within 18 months; co-tenancy default rate historically ~25%.",
        "Step 4 — Magnitude: combine rent step-downs (8-10% certain) + vacancy risk (3-5% probabilistic) → -13% est NOI impact.",
        "Step 5 — Covenant impact: with NOI -13%, DSCR drops from 1.19 to ~1.04 → near-certain breach.",
      ],
      sources: [
        {
          title: "Nordstrom to close three SoCal locations, citing 'evolving consumer behavior'",
          url: "https://www.latimes.com/business/story/2026-05-18/nordstrom-socal-closures",
          snippet: "The Seattle-based retailer confirmed Monday that its Costa Mesa, Glendale, and Riverside locations will close by Q3 2026.",
        },
        {
          title: "Nordstrom Q1 2026 earnings call transcript",
          url: "https://investor.nordstrom.com/quarterly-results/q1-2026",
          snippet: "CFO commentary references 'rationalization of underperforming locations' in the Pacific region.",
        },
        {
          title: "Retail co-tenancy clause default rates (NREI 2025)",
          url: "https://www.nreionline.com/research/co-tenancy-defaults-2025",
          snippet: "Across 1,400 anchored retail centers, anchor closures triggered co-tenancy activation in 67% of cases within 12 months.",
        },
      ],
      alternatives: [
        {
          interpretation: "Macy's or Bloomingdale's may backfill the anchor box (positive)",
          whyRejected: "Macy's and Bloomingdale's are both reducing footprints nationally. No public expansion announcements for SoCal market.",
        },
        {
          interpretation: "Smaller in-line tenants may not exercise co-tenancy rights to preserve their own locations (neutral)",
          whyRejected: "Historical co-tenancy activation rate is 67% even when tenants are otherwise stable. Inflation pressure makes activation more likely, not less.",
        },
        {
          interpretation: "Conversion to entertainment / F&B / mixed-use may preserve traffic (deferred)",
          whyRejected: "Conversion timeline (18-36 months) extends beyond the immediate covenant compliance period. Doesn't help near-term DSCR.",
        },
      ],
    },
  },
  {
    id: "sig-006",
    assetId: "southcoast-retail",
    headline: "Q4 2025 SoCal retail comps: strip center cap rates compressed to 5.2% avg",
    source: "Marcus & Millichap Transaction Database",
    publishedAt: "2026-01-20T09:00:00Z",
    signalType: "comp-transaction",
    isRealTime: false,
    urgencyWeight: 0.38,
    relevanceScore: 0.81,
    impactDirection: "positive",
    impactMagnitude: 0.03,
    aiReasoning:
      "Cap rate compression to 5.2% implies current market valuation upside vs the asset's underwritten 5.8% cap. This partially offsets LTV risk by improving collateral coverage. However, this historical data predates the Nordstrom announcement and may not reflect forward market sentiment.",
    status: "dismissed",
    confirmedAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "sig-007",
    assetId: "southcoast-retail",
    headline: "CPI-indexed rent step-up triggers +2.1% base rent increase across retail portfolio",
    source: "Internal Lease Administration",
    publishedAt: "2026-05-01T00:00:00Z",
    signalType: "regulatory",
    isRealTime: false,
    urgencyWeight: 0.42,
    relevanceScore: 0.96,
    impactDirection: "positive",
    impactMagnitude: 0.021,
    aiReasoning:
      "Contractual CPI escalation clauses activated per lease terms. This is a high-certainty NOI uplift as the rent increase is already contractually obligated. Provides partial buffer against the negative signals in this asset's inbox.",
    status: "confirmed",
    confirmedAt: "2026-05-02T09:00:00Z",
  },
  {
    id: "sig-008",
    assetId: "anaheim-industrial",
    headline: "New 620k sqft speculative industrial development approved in Anaheim Commerce Zone",
    source: "CoStar News",
    publishedAt: "2026-05-16T11:00:00Z",
    signalType: "comp-transaction",
    isRealTime: true,
    urgencyWeight: 0.71,
    relevanceScore: 0.82,
    impactDirection: "negative",
    impactMagnitude: -0.035,
    aiReasoning:
      "Speculative supply addition of 620k sqft represents a 4.1% increase in submarket inventory. Completion in 18-24 months. Given current 3.1% vacancy, the submarket can absorb this supply, but it reduces near-term rent growth expectations from 4% to ~2%. The subject property's strong occupancy (97%) provides insulation, but renewal negotiations in 2027-2028 may face headwinds.",
    status: "pending",
  },
  {
    id: "sig-009",
    assetId: "anaheim-industrial",
    headline: "SoCal industrial rent growth hits 4.2% YoY in Q1 2026, outperforming national average",
    source: "Prologis Research Q1 2026",
    publishedAt: "2026-04-10T09:00:00Z",
    signalType: "market-survey",
    isRealTime: false,
    urgencyWeight: 0.40,
    relevanceScore: 0.85,
    impactDirection: "positive",
    impactMagnitude: 0.042,
    aiReasoning:
      "SoCal industrial fundamentals remain among the strongest nationally. 4.2% YoY rent growth validates the subject property's above-market rent position and supports NOI stability through the next lease rollover cycle. E-commerce and near-shoring demand continue to anchor absorption.",
    status: "confirmed",
    confirmedAt: "2026-04-12T14:00:00Z",
  },
  {
    id: "sig-010",
    assetId: "anaheim-industrial",
    headline: "Port of Long Beach container volumes up 18% YoY; SoCal logistics demand accelerates",
    source: "Port of Long Beach Monthly Report",
    publishedAt: "2026-05-14T10:00:00Z",
    signalType: "macro",
    isRealTime: false,
    urgencyWeight: 0.50,
    relevanceScore: 0.78,
    impactDirection: "positive",
    impactMagnitude: 0.025,
    aiReasoning:
      "Port volume surge is a leading indicator for inland industrial demand within the LA Basin. The subject property's proximity to major logistics arteries (SR-91, I-5) positions it to capture demand spillover from tighter Inland Empire markets. Supports rent renewal assumptions.",
    status: "pending",
  },
]

export function getSignalsForAsset(assetId: string): Signal[] {
  return SEED_SIGNALS.filter((s) => s.assetId === assetId)
}

export function getPendingSignals(): Signal[] {
  return SEED_SIGNALS.filter((s) => s.status === "pending")
}
