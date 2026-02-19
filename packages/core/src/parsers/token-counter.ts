import type { TokenStats } from '../types/qa-context.js'

// Lazy init — tiktoken ładuje WASM, inicjalizujemy przy pierwszym użyciu
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _enc: any = null

async function getEnc() {
  if (!_enc) {
    const { get_encoding } = await import('tiktoken')
    _enc = get_encoding('cl100k_base')
  }
  return _enc
}

// Synchroniczny fallback gdy WASM niedostępny — szacowanie przez słowa
function estimateTokens(text: string): number {
  if (text.length === 0) return 0
  // cl100k_base: ~0.75 tokena na słowo, ~4 znaki na token
  return Math.ceil(text.length / 4)
}

export function countTokensSync(text: string): number {
  return estimateTokens(text)
}

export async function countTokens(text: string): Promise<number> {
  try {
    const enc = await getEnc()
    return enc.encode(text).length
  } catch {
    return estimateTokens(text)
  }
}

export async function computeStats(
  originalText: string,
  compressedText: string
): Promise<TokenStats> {
  const originalTokens = await countTokens(originalText)
  const compressedTokens = await countTokens(compressedText)
  const savedPercent =
    originalTokens > 0
      ? Math.round(((originalTokens - compressedTokens) / originalTokens) * 1000) / 10
      : 0
  const ratio =
    compressedTokens > 0 ? Math.round((originalTokens / compressedTokens) * 10) / 10 : 0
  return {
    originalTokens,
    compressedTokens,
    savedPercent: Math.min(savedPercent, 100),
    ratio,
    tokenizer: 'cl100k_base',
  }
}

// Synchroniczna wersja używana przez parsery (szacowanie — wystarczy dla Fazy 1)
export function computeStatsSync(originalText: string, compressedText: string): TokenStats {
  const originalTokens = estimateTokens(originalText)
  const compressedTokens = estimateTokens(compressedText)
  const savedPercent =
    originalTokens > 0
      ? Math.round(((originalTokens - compressedTokens) / originalTokens) * 1000) / 10
      : 0
  const ratio =
    compressedTokens > 0 ? Math.round((originalTokens / compressedTokens) * 10) / 10 : 0
  return {
    originalTokens,
    compressedTokens,
    savedPercent: Math.min(savedPercent, 100),
    ratio,
    tokenizer: 'cl100k_base',
  }
}
