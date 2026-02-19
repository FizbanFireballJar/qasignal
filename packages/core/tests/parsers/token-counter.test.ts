import { describe, it, expect } from 'vitest'
import {
  countTokensSync,
  computeStatsSync,
  countTokens,
  computeStats,
} from '../../src/parsers/token-counter.js'

describe('countTokensSync — szacowanie', () => {
  it('zwraca 0 dla pustego stringa', () => {
    expect(countTokensSync('')).toBe(0)
  })

  it('zwraca liczbę większą od 0 dla niepustego tekstu', () => {
    expect(countTokensSync('Hello world')).toBeGreaterThan(0)
  })

  it('dłuższy tekst ma więcej tokenów', () => {
    const short = countTokensSync('test')
    const long = countTokensSync('This is a much longer sentence with many more words in it')
    expect(long).toBeGreaterThan(short)
  })

  it('zwraca liczbę całkowitą', () => {
    const tokens = countTokensSync('some text here')
    expect(Number.isInteger(tokens)).toBe(true)
  })
})

describe('computeStatsSync', () => {
  it('zwraca kompletną strukturę TokenStats', () => {
    const stats = computeStatsSync('original long text here with many words', 'short')
    expect(stats.tokenizer).toBe('cl100k_base')
    expect(typeof stats.originalTokens).toBe('number')
    expect(typeof stats.compressedTokens).toBe('number')
    expect(typeof stats.savedPercent).toBe('number')
    expect(typeof stats.ratio).toBe('number')
  })

  it('originalTokens > compressedTokens gdy skompresowany jest krótszy', () => {
    const stats = computeStatsSync(
      'Given użytkownik jest na stronie logowania\nWhen wpisuje email i hasło\nThen widzi dashboard\nAnd wszystko działa',
      '| login | pass | result |\n| ✓ | ✓ | dashboard |'
    )
    expect(stats.originalTokens).toBeGreaterThan(stats.compressedTokens)
  })

  it('savedPercent jest między 0 a 100', () => {
    const stats = computeStatsSync('a b c d e f g h i j k l m n o p', 'x y')
    expect(stats.savedPercent).toBeGreaterThanOrEqual(0)
    expect(stats.savedPercent).toBeLessThanOrEqual(100)
  })

  it('ratio > 1 gdy tekst oryginalny jest dłuższy', () => {
    const stats = computeStatsSync('long text with many words and characters here', 'short')
    expect(stats.ratio).toBeGreaterThan(1)
  })

  it('ratio ~ 1 gdy teksty mają podobną długość', () => {
    // Szacowanie przez /4 — używamy tekstów identycznej długości żeby ratio = 1.0
    const stats = computeStatsSync('hello world!!', 'hi there now')
    expect(stats.ratio).toBeCloseTo(1, 0)
  })

  it('savedPercent = 0 dla pustego oryginału', () => {
    const stats = computeStatsSync('', 'something')
    expect(stats.savedPercent).toBe(0)
  })
})

describe('countTokens — async (tiktoken lub fallback)', () => {
  it('zwraca liczbę tokenów (async)', async () => {
    const tokens = await countTokens('Hello world')
    expect(tokens).toBeGreaterThan(0)
  })

  it('zwraca 0 dla pustego stringa', async () => {
    expect(await countTokens('')).toBe(0)
  })
})

describe('computeStats — async', () => {
  it('zwraca TokenStats z tokenizer cl100k_base', async () => {
    const stats = await computeStats('original text here', 'short')
    expect(stats.tokenizer).toBe('cl100k_base')
    expect(stats.originalTokens).toBeGreaterThan(0)
  })
})
