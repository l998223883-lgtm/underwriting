import type { Asset, ImpactDirection } from "../../data/cre-types"

export type SignalValidation = {
  relevanceScore: number
  impactDirection: ImpactDirection
  impactMagnitude: number
  aiReasoning: string
}

function ruleBasedFallback(headline: string, asset: Asset): SignalValidation {
  const h = headline.toLowerCase()
  const isNegative = /clos|reduc|layoff|bankrupt|vacanci|rais|hike|declin|slow|weak|exit|shutt/.test(h)
  const isPositive = /expan|grow|approv|invest|open|increas|demand|strong|hire|boost/.test(h)

  const direction: ImpactDirection = isNegative ? "negative" : isPositive ? "positive" : "neutral"
  const magnitude = direction === "negative" ? -0.05 : direction === "positive" ? 0.04 : 0

  // Relevance based on whether the headline mentions the asset's city or asset type
  const mentionsCity = h.includes(asset.city.toLowerCase())
  const mentionsType = h.includes(asset.assetType)
  const relevance = mentionsCity && mentionsType ? 0.85 : mentionsCity || mentionsType ? 0.65 : 0.45

  return {
    relevanceScore: relevance,
    impactDirection: direction,
    impactMagnitude: magnitude,
    aiReasoning: `[Rule-based fallback] Headline classified as ${direction} based on keyword analysis. Relevance estimated from geographic and asset-type match.`,
  }
}

export async function validateSignal(
  headline: string,
  asset: Asset,
): Promise<SignalValidation> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || import.meta.env.VITE_USE_MOCK_AI === "true") {
    return ruleBasedFallback(headline, asset)
  }

  const prompt = `You are a senior CRE underwriter at a top-tier institutional real estate fund.

Asset profile:
- Name: ${asset.name}
- Type: ${asset.assetType}
- Location: ${asset.address} (zip: ${asset.zipCode})
- Current DSCR: ${asset.dscr} (covenant minimum: ${asset.dscrCovenant})
- Current LTV: ${asset.ltv} (covenant maximum: ${asset.ltvCovenant})
- Current NOI: $${asset.noi.toLocaleString()}
- Occupancy: ${(asset.occupancyRate * 100).toFixed(0)}%

News headline to evaluate:
"${headline}"

Assess this signal's impact on the asset. Respond ONLY with valid JSON matching this schema:
{
  "relevanceScore": number (0.0-1.0, how relevant is this signal to this specific asset),
  "impactDirection": "positive" | "negative" | "neutral",
  "impactMagnitude": number (-0.20 to +0.20, estimated percentage change in NOI, e.g. -0.08 = -8%),
  "aiReasoning": string (2-3 sentences explaining the causal chain from headline to NOI impact)
}`

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`API error ${response.status}`)

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")

    const parsed = JSON.parse(jsonMatch[0]) as SignalValidation
    return parsed
  } catch {
    return ruleBasedFallback(headline, asset)
  }
}
