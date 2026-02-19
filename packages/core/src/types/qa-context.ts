/**
 * Schemat pliku .qa-context/index.json
 * Generowany automatycznie przez parser + compressor.
 * NIE edytuj ręcznie — używaj overrides.json do korekt.
 */

export interface QAContext {
  version: string // "1.0.0"
  generated: string // ISO timestamp
  projectRoot: string // absolutna ścieżka projektu
  sourceHash: string // SHA256 suites plików źródłowych
  modules: Record<string, QAModule>
}

export interface QAModule {
  name: string
  sourcePaths: string[]
  format: SourceFormat
  stats: TokenStats // wymagane, nie opcjonalne
  compressed: CompressedContext
  gaps: CoverageGap[]
}

export type SourceFormat = 'gherkin' | 'playwright' | 'markdown' | 'csv' | 'mixed'

export interface TokenStats {
  originalTokens: number
  compressedTokens: number
  savedPercent: number
  ratio: number // np. 8.3 = 8.3x mniej tokenów
  tokenizer: 'cl100k_base' // zawsze to samo — zgodne z Copilot/GPT-4
}

export interface CompressedContext {
  decisionTable: string // Markdown tabela decyzyjna
  mermaid: string // flowchart TD jako tekst
  format: 'decision-table' | 'mermaid' // który format jest primary
}

export interface CoverageGap {
  path: string[] // sekwencja węzłów bez TC
  description: string // czytelny opis
  suggestedTestCase: string // propozycja TC
}
