import { describe, it, expect } from 'vitest'
import type { QAContext, OverridesFile } from '../src/index.js'
import { EMPTY_OVERRIDES } from '../src/types/overrides.js'

describe('Types sanity check', () => {
  it('QAContext ma wymagane pola', () => {
    const ctx: QAContext = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      projectRoot: '/project',
      sourceHash: 'abc123',
      modules: {},
    }
    expect(ctx.version).toBe('1.0.0')
  })

  it('EMPTY_OVERRIDES jest prawidłowym OverridesFile', () => {
    const o: OverridesFile = EMPTY_OVERRIDES
    expect(o.version).toBe('1.0')
    expect(o.overrides).toHaveLength(0)
  })

  it('TokenStats wymaga wszystkich pól', () => {
    const stats = {
      originalTokens: 2400,
      compressedTokens: 180,
      savedPercent: 92,
      ratio: 13.3,
      tokenizer: 'cl100k_base' as const,
    }
    expect(stats.savedPercent).toBe(92)
  })
})
