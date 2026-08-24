import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

const useAnalysisStore = create(
  persist(
    (set, get) => ({
      analysisData: null,

      setAnalysisData: (data) => set({
        analysisData: { ...data, _storedAt: Date.now() }
      }),

      clearAnalysisData: () => set({ analysisData: null }),

      /** Returns true if there is no data, it's stale (>24h), or session mismatch */
      isStaleOrMissing: (sessionId) => {
        const { analysisData } = get()
        if (!analysisData) return true
        if (analysisData.session_id !== sessionId) return true
        if (Date.now() - (analysisData._storedAt ?? 0) > TWENTY_FOUR_HOURS) return true
        return false
      },
    }),
    {
      name: 'schemamorph-analysis-storage',
    }
  )
)

export default useAnalysisStore
