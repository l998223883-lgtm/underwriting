import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts"
import type { HistoricalPoint } from "@/data/cre-types"
import { cn } from "@/lib/utils"

type Props = {
  data: HistoricalPoint[]
  field: "dscr" | "noi"
  tone?: "low" | "med" | "high" | "neutral"
  width?: number
  height?: number
  className?: string
}

const toneColors: Record<NonNullable<Props["tone"]>, string> = {
  low: "var(--risk-low)",
  med: "var(--risk-med)",
  high: "var(--risk-high)",
  neutral: "var(--ink-strong)",
}

export function Sparkline({ data, field, tone = "neutral", width = 80, height = 24, className }: Props) {
  if (data.length === 0) return null
  const stroke = toneColors[tone]

  return (
    <div className={cn("inline-block", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey={field}
            stroke={stroke}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
