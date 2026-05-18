import { useEffect } from "react"
import type { AIReasoningArtifact } from "@/data/cre-types"
import { cn } from "@/lib/utils"

type Props = {
  artifact: AIReasoningArtifact | null
  contextLabel?: string
  onClose: () => void
}

export function ReasoningPanel({ artifact, contextLabel, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!artifact) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-strong/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="relative z-10 flex h-full w-full max-w-[640px] flex-col overflow-y-auto border-l border-rule bg-paper shadow-md">
        {/* Header */}
        <header className="sticky top-0 border-b border-rule bg-paper px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Inspector · AI reasoning artifact
              </p>
              <h2 className="font-serif text-2xl leading-tight tracking-tight text-ink-strong">
                Show the work.{" "}
                <em className="italic text-ink-muted">All of it.</em>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-rule bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted shadow-sm hover:bg-paper-2"
            >
              Esc · Close
            </button>
          </div>
          {contextLabel && (
            <p className="mt-3 border-l-2 border-rule pl-3 text-[12px] text-ink-muted">
              {contextLabel}
            </p>
          )}
        </header>

        <div className="space-y-8 px-8 py-8">
          {/* Prompt */}
          <Section label="Prompt sent to Claude">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words border border-rule bg-card px-4 py-3 font-mono text-[11px] leading-relaxed text-ink">
              {artifact.prompt}
            </pre>
          </Section>

          {/* Reasoning trace */}
          <Section label="Reasoning trace">
            <ol className="space-y-3">
              {artifact.reasoning.map((step, i) => (
                <li key={i} className="grid grid-cols-[24px_1fr] gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[13px] leading-[1.6] text-ink">{step}</p>
                </li>
              ))}
            </ol>
          </Section>

          {/* Sources */}
          <Section label={`Cited sources · ${artifact.sources.length}`}>
            <ul className="space-y-3">
              {artifact.sources.map((s, i) => (
                <li key={i} className="border-l-2 border-rule pl-4">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-serif text-[15px] leading-snug text-ink-strong underline-offset-4 hover:underline"
                  >
                    {s.title}
                  </a>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-ink-muted">
                    {new URL(s.url).hostname}
                  </p>
                  <p className="mt-1 text-[12px] italic leading-[1.5] text-ink-muted">
                    "{s.snippet}"
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          {/* Alternatives */}
          <Section label={`Alternatives considered · ${artifact.alternatives.length}`}>
            <ul className="space-y-3">
              {artifact.alternatives.map((alt, i) => (
                <li key={i} className="border border-rule bg-card px-4 py-3">
                  <p className="text-[13px] leading-snug text-ink-strong">
                    {alt.interpretation}
                  </p>
                  <p className="mt-2 flex gap-2 text-[12px] leading-[1.5] text-ink-muted">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-risk-high">
                      Rejected
                    </span>
                    <span>{alt.whyRejected}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </aside>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</h3>
      {children}
    </section>
  )
}

export function InspectButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-rule bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted hover:bg-paper-2 hover:text-ink-strong",
        className,
      )}
    >
      <span>⌥</span>
      Inspect
    </button>
  )
}
