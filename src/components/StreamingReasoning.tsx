import { useEffect, useState } from "react"
import { AgentLane } from "./AgentLane"
import type { Signal } from "@/data/cre-types"
import { cn } from "@/lib/utils"

type Stage = {
  agent: "scout" | "validator" | "impact-analyst"
  action: string
  detail: string
  tokens: string[] // streamed reasoning fragments
  durationMs: number
}

function buildStages(signal: Signal): Stage[] {
  const negative = signal.impactDirection === "negative"
  const dir = negative ? "negative" : signal.impactDirection === "positive" ? "positive" : "neutral"
  const magnitude = (signal.impactMagnitude * 100).toFixed(1)

  return [
    {
      agent: "scout",
      action: `Confirmed source: ${signal.source}`,
      detail: `Pulled headline · cross-checked publication date · extracted entities`,
      tokens: [
        "Parsing headline… ",
        `Identifying actors: ${signal.signalType === "tenant-event" ? "tenant + asset linkage" : signal.signalType}… `,
        "Tagging zip codes and submarket… ",
        "Source verified.",
      ],
      durationMs: 1100,
    },
    {
      agent: "validator",
      action: `Relevance ${(signal.relevanceScore * 100).toFixed(0)}% · urgency ${(signal.urgencyWeight * 100).toFixed(0)}%`,
      detail: `Cross-referenced ${signal.reasoning?.sources.length ?? 3} independent sources`,
      tokens: [
        "Cross-checking 3 independent sources… ",
        "Comparing to known false-positive patterns… ",
        "Computing confidence interval on relevance… ",
        `Verdict: ${(signal.relevanceScore * 100).toFixed(0)}% confidence this is real and material.`,
      ],
      durationMs: 1300,
    },
    {
      agent: "impact-analyst",
      action: `${dir === "negative" ? "▼" : dir === "positive" ? "▲" : "—"}${magnitude}% est NOI`,
      detail: `Modeled contagion + propagation timing into 6-month forward`,
      tokens: [
        "Modeling tenant overlap with subject asset rent roll… ",
        "Estimating cap-rate sensitivity to news magnitude… ",
        "Sampling Monte Carlo over 1,000 forward scenarios… ",
        `Projected NOI delta: ${dir === "negative" ? "−" : dir === "positive" ? "+" : ""}${magnitude}%. Triggering simulation engine.`,
      ],
      durationMs: 1600,
    },
  ]
}

type AgentState = "idle" | "running" | "done"

export function StreamingReasoning({
  signal,
  onComplete,
}: {
  signal: Signal
  onComplete: () => void
}) {
  const stages = buildStages(signal)
  const [activeIdx, setActiveIdx] = useState(0)
  const [streamed, setStreamed] = useState<string[]>(stages.map(() => ""))

  useEffect(() => {
    let cancelled = false
    async function run() {
      for (let i = 0; i < stages.length; i++) {
        if (cancelled) return
        setActiveIdx(i)
        const stage = stages[i]
        const totalLength = stage.tokens.reduce((s, t) => s + t.length, 0)
        const chunkDelay = stage.durationMs / Math.max(totalLength, 1)
        let acc = ""
        for (const token of stage.tokens) {
          for (const ch of token) {
            if (cancelled) return
            acc += ch
            // batch every 3 chars
            if (acc.length % 3 === 0) {
              setStreamed((prev) => {
                const next = [...prev]
                next[i] = acc
                return next
              })
              await new Promise((r) => setTimeout(r, chunkDelay * 3))
            }
          }
        }
        setStreamed((prev) => {
          const next = [...prev]
          next[i] = acc
          return next
        })
      }
      if (!cancelled) {
        setActiveIdx(stages.length) // all done
        await new Promise((r) => setTimeout(r, 300))
        if (!cancelled) onComplete()
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [signal.id])

  function stateFor(i: number): AgentState {
    if (i < activeIdx) return "done"
    if (i === activeIdx) return "running"
    return "idle"
  }

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
        Agent pipeline · 3 agents working in sequence
      </p>
      <div className="grid grid-cols-3 gap-3">
        {stages.map((stage, i) => (
          <div key={i} className="space-y-2">
            <AgentLane
              agent={stage.agent}
              state={stateFor(i)}
              action={stateFor(i) === "idle" ? undefined : stage.action}
              detail={stateFor(i) === "idle" ? undefined : stage.detail}
              timestamp={stateFor(i) !== "idle" ? new Date().toLocaleTimeString() : undefined}
            />
            {streamed[i] && (
              <div className="min-h-[60px] border border-rule bg-card px-3 py-2 font-mono text-[10px] leading-[1.6] text-ink">
                {streamed[i]}
                {stateFor(i) === "running" && (
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-ink-strong align-middle" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniAgentRow() {
  // small static row for display in headers
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-ink-strong" /> Scout
      </span>
      <span className="text-ink-muted/40">→</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-med" /> Validator
      </span>
      <span className="text-ink-muted/40">→</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-risk-low" /> Impact analyst
      </span>
    </div>
  )
}

