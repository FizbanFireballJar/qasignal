// @qasignal/core — public API
// Parsery i kompressor będą eksportowane tutaj w Fazie 1 i 2

export type {
  QAContext,
  QAModule,
  TokenStats,
  CompressedContext,
  CoverageGap,
} from './types/qa-context.js'

export type { OverrideOperation, ModelOverride, OverridesFile } from './types/overrides.js'

export { EMPTY_OVERRIDES } from './types/overrides.js'

export const VERSION = '0.1.0'
