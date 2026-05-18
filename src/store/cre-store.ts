import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useShallow } from "zustand/react/shallow"
import type { Signal, SimResult } from "../data/cre-types"
import { SEED_SIGNALS } from "../data/signals"
import { ASSETS, getAsset } from "../data/assets"
import { runSimulation } from "../lib/cre/simulation"

type CREState = {
  signals: Signal[]
  simResults: SimResult[]
}

type CREActions = {
  confirmSignal: (id: string) => SimResult | null
  dismissSignal: (id: string) => void
  resetSignals: () => void
}

export const useCREStore = create<CREState & CREActions>()(
  persist(
    (set, get) => ({
      signals: SEED_SIGNALS,
      simResults: [],

      confirmSignal: (id: string) => {
        const signal = get().signals.find((s) => s.id === id)
        if (!signal) return null
        const asset = getAsset(signal.assetId)
        if (!asset) return null

        const simResult = runSimulation(asset, signal)

        set((state) => ({
          signals: state.signals.map((s) =>
            s.id === id ? { ...s, status: "confirmed" as const, confirmedAt: new Date().toISOString() } : s,
          ),
          simResults: [...state.simResults, simResult],
        }))

        return simResult
      },

      dismissSignal: (id: string) => {
        set((state) => ({
          signals: state.signals.map((s) =>
            s.id === id ? { ...s, status: "dismissed" as const } : s,
          ),
        }))
      },

      resetSignals: () => {
        set({ signals: SEED_SIGNALS, simResults: [] })
      },
    }),
    {
      name: "cre-sentinel",
    },
  ),
)

// Selectors
export function useAssets() {
  return ASSETS
}

export function usePendingCount() {
  return useCREStore((s) => s.signals.filter((sig) => sig.status === "pending").length)
}

export function useSignalsForAsset(assetId: string) {
  return useCREStore(useShallow((s) => s.signals.filter((sig) => sig.assetId === assetId)))
}

export function useSimResultsForAsset(assetId: string) {
  return useCREStore(useShallow((s) => s.simResults.filter((r) => r.assetId === assetId)))
}

export function useLatestSimForAsset(assetId: string) {
  return useCREStore((s) => {
    const results = s.simResults.filter((r) => r.assetId === assetId)
    if (results.length === 0) return null
    return results[results.length - 1]
  })
}

export function useConfirmedSignals() {
  return useCREStore(useShallow((s) =>
    [...s.signals]
      .filter((sig) => sig.status === "confirmed")
      .sort((a, b) => (b.confirmedAt ?? "").localeCompare(a.confirmedAt ?? "")),
  ))
}
