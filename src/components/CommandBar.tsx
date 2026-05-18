import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  runPortfolioAgent,
  SUGGESTED_QUERIES,
  type AgentAnswer,
  type AgentChunk,
} from "@/lib/cre/portfolio-agent"
import { cn } from "@/lib/utils"

export function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [answer, setAnswer] = useState<AgentAnswer | null>(null)
  const [renderedCount, setRenderedCount] = useState(0)
  const [stepsRevealed, setStepsRevealed] = useState(0)
  const [streaming, setStreaming] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      // Reset state on close
      setQuery("")
      setSubmitted(null)
      setAnswer(null)
      setRenderedCount(0)
      setStepsRevealed(0)
      setStreaming(false)
    }
  }, [open])

  function handleSubmit(q: string) {
    if (!q.trim()) return
    setSubmitted(q)
    setStreaming(true)
    setRenderedCount(0)
    setStepsRevealed(0)
    const result = runPortfolioAgent(q)
    setAnswer(result)
  }

  // Animate the rendered chunks
  useEffect(() => {
    if (!answer || !streaming) return
    let cancelled = false

    async function run() {
      if (!answer) return
      // First reveal steps
      const steps = answer.chunks.filter((c) => c.type === "step")
      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return
        await new Promise((r) => setTimeout(r, 380))
        setStepsRevealed(i + 1)
      }
      // Then stream the actual answer chunks (skip the step ones)
      await new Promise((r) => setTimeout(r, 220))
      const nonStepChunks = answer.chunks.filter((c) => c.type !== "step")
      const textTotal = nonStepChunks.reduce(
        (s, c) => s + (c.type === "text" ? c.text.length : 12),
        0,
      )
      const totalTime = answer.durationMs - 380 * steps.length - 220
      const perChar = Math.max(8, totalTime / textTotal)
      for (let i = 0; i < nonStepChunks.length; i++) {
        if (cancelled) return
        const c = nonStepChunks[i]
        if (c.type === "text") {
          const wait = Math.min(800, c.text.length * perChar)
          await new Promise((r) => setTimeout(r, wait))
        } else {
          await new Promise((r) => setTimeout(r, 120))
        }
        setRenderedCount(i + 1)
      }
      setStreaming(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [answer])

  function handleCitationClick(c: AgentChunk) {
    if (c.type !== "citation") return
    if (c.citation.kind === "asset") {
      navigate({ to: "/asset/$id", params: { id: c.citation.id } })
    } else {
      navigate({ to: "/inbox" })
    }
    onClose()
  }

  if (!open) return null

  const visibleChunks = answer
    ? answer.chunks.filter((c) => c.type !== "step").slice(0, renderedCount)
    : []
  const allSteps = answer ? answer.chunks.filter((c) => c.type === "step") : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" role="dialog">
      <div
        className="absolute inset-0 bg-ink-strong/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-[800px] flex-col overflow-hidden border border-rule bg-paper shadow-md">
        {/* Header / input */}
        <div className="border-b border-rule px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
              Ask your portfolio · Cmd K
            </p>
            <button
              onClick={onClose}
              className="rounded-md border border-rule bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted hover:bg-paper-2"
            >
              Esc
            </button>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit(query)
            }}
            placeholder="What's my biggest exposure this week?"
            className="mt-3 w-full bg-transparent font-serif text-[26px] leading-tight tracking-tight text-ink-strong placeholder:text-ink-muted/40 focus:outline-none"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!submitted && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Try
              </p>
              <ul className="space-y-2">
                {SUGGESTED_QUERIES.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => {
                        setQuery(q)
                        handleSubmit(q)
                      }}
                      className="block w-full border-l-2 border-rule px-3 py-2 text-left font-serif text-[16px] leading-snug text-ink-strong transition-colors hover:border-l-ink-strong hover:bg-paper-2"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {submitted && (
            <div className="space-y-5">
              {/* Reasoning steps */}
              {allSteps.length > 0 && (
                <div className="space-y-1.5">
                  {allSteps.slice(0, stepsRevealed).map((step, i) => (
                    <p
                      key={i}
                      className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted"
                    >
                      <span className="text-risk-low">✓</span>
                      <span>{step.type === "step" ? step.label : ""}</span>
                    </p>
                  ))}
                  {streaming && stepsRevealed < allSteps.length && (
                    <p className="flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-risk-med" />
                      <span>{allSteps[stepsRevealed]?.type === "step" ? allSteps[stepsRevealed].label : ""}…</span>
                    </p>
                  )}
                </div>
              )}

              {/* Streamed answer */}
              {renderedCount > 0 && (
                <div className="border-t border-rule pt-5">
                  <p className="font-serif text-[18px] leading-[1.6] text-ink-strong">
                    {visibleChunks.map((c, i) =>
                      c.type === "text" ? (
                        <span key={i}>{c.text}</span>
                      ) : c.type === "citation" ? (
                        <button
                          key={i}
                          onClick={() => handleCitationClick(c)}
                          className="cursor-pointer rounded-sm border-b border-dotted border-ink-strong px-0.5 font-serif text-[18px] text-ink-strong hover:bg-paper-2"
                        >
                          {c.citation.label}
                          <span className="ml-1 font-mono text-[10px] text-ink-muted">↗</span>
                        </button>
                      ) : null,
                    )}
                    {streaming && (
                      <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-ink-strong align-middle" />
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-rule bg-paper-2/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          <span>Enter to ask</span>
          <span className="mx-3">·</span>
          <span>↗ Click any citation to navigate</span>
        </div>
      </div>
    </div>
  )
}

export function CommandHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border border-rule bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted shadow-sm hover:bg-paper-2",
      )}
    >
      <span>Ask your portfolio</span>
      <span className="rounded bg-paper-2 px-1.5 py-0.5 text-[9px] text-ink-strong">⌘K</span>
    </button>
  )
}
