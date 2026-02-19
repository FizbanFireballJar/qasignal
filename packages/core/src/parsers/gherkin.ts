import { generateMessages } from '@cucumber/gherkin'
import { SourceMediaType, IdGenerator } from '@cucumber/messages'
import { basename } from 'node:path'
import type { QAModule } from '../types/qa-context.js'
import { computeStatsSync } from './token-counter.js'

// ─── Typy wewnętrzne ────────────────────────────────────────────────────────

interface ParsedStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But'
  text: string
}

interface ParsedScenario {
  name: string
  tags: string[]
  steps: ParsedStep[]
  isOutline: boolean
  exampleHeaders?: string[]
  examples?: string[][]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeKeyword(kw: string): ParsedStep['keyword'] {
  const k = kw.trim().replace(/\*/, 'And')
  if (k === 'Given' || k === 'Zakładając' || k === 'Mając') return 'Given'
  if (k === 'When' || k === 'Kiedy' || k === 'Gdy') return 'When'
  if (k === 'Then' || k === 'Wtedy') return 'Then'
  if (k === 'But' || k === 'Ale') return 'But'
  return 'And'
}

function slug(text: string, maxLen = 30): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, maxLen)
}

function safeMermaidLabel(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/-->/g, '->')
    .replace(/[{}]/g, '')
    .replace(/\[/g, '(')
    .replace(/]/g, ')')
    .trim()
}

function extractQuotedValue(text: string): string | null {
  const match = text.match(/"([^"]+)"/)
  return match ? match[1] : null
}

function shortenCondition(text: string): string {
  const val = extractQuotedValue(text)
  if (val) return val.slice(0, 18)
  return text
    .replace(/użytkownik\s+/gi, '')
    .replace(/jest\s+na\s+stronie\s+/gi, '')
    .replace(/jest\s+/gi, '')
    .replace(/^(Given|When|Then|And|But)\s+/i, '')
    .trim()
    .slice(0, 18)
}

// ─── Ekspansja Scenario Outline ─────────────────────────────────────────────

function expandOutline(scenario: ParsedScenario): ParsedScenario[] {
  if (!scenario.isOutline || !scenario.examples || !scenario.exampleHeaders) {
    return [scenario]
  }
  return scenario.examples.map((row, idx) => {
    const subs = Object.fromEntries(scenario.exampleHeaders!.map((h, i) => [h, row[i] ?? '']))
    return {
      ...scenario,
      name: `${scenario.name} [${idx + 1}]`,
      steps: scenario.steps.map((step) => ({
        ...step,
        text: step.text.replace(/<(\w+)>/g, (_, key: string) => subs[key] ?? `<${key}>`),
      })),
      isOutline: false,
    }
  })
}

// ─── Parsowanie GherkinDocument ─────────────────────────────────────────────

function parseGherkinDoc(content: string): {
  featureName: string
  scenarios: ParsedScenario[]
} {
  const envelopes = Array.from(
    generateMessages(content, 'anonymous.feature', SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
      includeSource: false,
      includeGherkinDocument: true,
      includePickles: false,
      newId: IdGenerator.uuid(),
    })
  )

  const docEnvelope = envelopes.find((e) => e.gherkinDocument)
  const feature = docEnvelope?.gherkinDocument?.feature
  if (!feature) return { featureName: 'unknown', scenarios: [] }

  // Background steps
  const backgroundSteps: ParsedStep[] = []
  for (const child of feature.children ?? []) {
    if (child.background) {
      for (const step of child.background.steps ?? []) {
        backgroundSteps.push({
          keyword: normalizeKeyword(step.keyword),
          text: step.text,
        })
      }
    }
  }

  // Scenarios
  const rawScenarios: ParsedScenario[] = []
  for (const child of feature.children ?? []) {
    const sc = child.scenario
    if (!sc) continue

    const isOutline =
      sc.keyword.trim().toLowerCase().includes('outline') ||
      sc.keyword.trim().toLowerCase().includes('template')

    const scenarioSteps: ParsedStep[] = [
      ...backgroundSteps,
      ...sc.steps.map((step) => ({
        keyword: normalizeKeyword(step.keyword),
        text: step.text,
      })),
    ]

    const featureTags = (feature.tags ?? []).map((t) => t.name)
    const scenarioTags = (sc.tags ?? []).map((t) => t.name)
    const allTags = [...new Set([...featureTags, ...scenarioTags])]

    rawScenarios.push({
      name: sc.name,
      tags: allTags,
      steps: scenarioSteps,
      isOutline,
      exampleHeaders: isOutline
        ? ((sc.examples ?? [])[0]?.tableHeader?.cells ?? []).map((c) => c.value)
        : undefined,
      examples: isOutline
        ? (sc.examples ?? []).flatMap((ex) =>
            (ex.tableBody ?? []).map((row) => row.cells.map((c) => c.value))
          )
        : undefined,
    })
  }

  const expanded = rawScenarios.flatMap(expandOutline)
  return { featureName: feature.name, scenarios: expanded }
}

// ─── Decision Table ──────────────────────────────────────────────────────────

function buildDecisionTable(scenarios: ParsedScenario[]): string {
  if (scenarios.length === 0) return ''

  // Zbierz unikalne warunki z Given/When
  const conditionSet = new Set<string>()
  for (const sc of scenarios) {
    for (const step of sc.steps) {
      if (step.keyword === 'Given' || step.keyword === 'When') {
        conditionSet.add(shortenCondition(step.text))
      }
    }
  }
  // Ogranicz do max 5 kolumn warunków
  const conditions = [...conditionSet].slice(0, 5)

  const headers = ['sc', ...conditions, 'result']
  const separator = headers.map((h) => '-'.repeat(Math.max(h.length, 3)))

  const rows: string[][] = scenarios.map((sc) => {
    const condCols = conditions.map((cond) => {
      // Czy scenariusz ma krok pasujący do tego warunku?
      const match = sc.steps.find(
        (s) =>
          (s.keyword === 'Given' || s.keyword === 'When') &&
          shortenCondition(s.text) === cond
      )
      if (!match) return '-'
      const val = extractQuotedValue(match.text)
      return val ? val.slice(0, 15) : '✓'
    })

    // Result z pierwszego Then
    const thenStep = sc.steps.find((s) => s.keyword === 'Then')
    const result = thenStep
      ? (extractQuotedValue(thenStep.text) ?? thenStep.text.slice(0, 20))
      : '-'

    return [sc.name.slice(0, 25), ...condCols, result]
  })

  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length), separator[i].length)
  )

  const pad = (s: string, w: number) => s.padEnd(w)
  const formatRow = (row: string[]) => '| ' + row.map((c, i) => pad(c, colWidths[i])).join(' | ') + ' |'
  const formatSep = () => '| ' + colWidths.map((w) => '-'.repeat(w)).join(' | ') + ' |'

  return [formatRow(headers), formatSep(), ...rows.map(formatRow)].join('\n')
}

// ─── Mermaid ─────────────────────────────────────────────────────────────────

function buildMermaid(featureName: string, scenarios: ParsedScenario[]): string {
  if (scenarios.length === 0) return ''

  const lines: string[] = ['flowchart TD']
  const used = new Set<string>()

  const uniqueId = (base: string): string => {
    let id = slug(base)
    let counter = 0
    while (used.has(id)) {
      id = `${slug(base)}_${++counter}`
    }
    used.add(id)
    return id
  }

  // Węzeł startowy
  const startId = 'start'
  used.add(startId)
  lines.push(`  ${startId}([Feature: ${safeMermaidLabel(featureName)}])`)

  // Wyciągnij Background steps (te same dla wszystkich — wspólny węzeł)
  const firstSc = scenarios[0]
  const backgroundSteps: string[] = []
  if (firstSc) {
    // Kroki które powtarzają się w KAŻDYM scenariuszu jako pierwsze Given = Background
    const sharedPrefix: string[] = []
    for (const step of firstSc.steps) {
      if (step.keyword !== 'Given') break
      const isShared = scenarios.every(
        (sc) => sc.steps.some((s) => s.keyword === 'Given' && s.text === step.text)
      )
      if (isShared) sharedPrefix.push(step.text)
      else break
    }
    backgroundSteps.push(...sharedPrefix)
  }

  let prevId = startId
  if (backgroundSteps.length > 0) {
    const bgId = uniqueId('bg_' + backgroundSteps[0])
    lines.push(`  ${bgId}[${safeMermaidLabel(backgroundSteps.join(', '))}]`)
    lines.push(`  ${prevId} --> ${bgId}`)
    prevId = bgId
  }

  const sharedBgId = prevId

  // Scenariusze
  for (const sc of scenarios) {
    const scId = uniqueId('sc_' + sc.name)
    lines.push(`  ${scId}[${safeMermaidLabel(sc.name)}]`)
    lines.push(`  ${sharedBgId} --> ${scId}`)

    const nonBgSteps = sc.steps.filter(
      (s) => !backgroundSteps.includes(s.text) || s.keyword === 'When' || s.keyword === 'Then'
    )

    let prevStepId = scId
    for (const step of nonBgSteps) {
      if (step.keyword === 'Then') {
        const stepId = uniqueId('res_' + step.text)
        lines.push(`  ${stepId}([${safeMermaidLabel(step.text.slice(0, 40))}])`)
        lines.push(`  ${prevStepId} --> ${stepId}`)
        break // Tylko pierwszy Then jako wynik
      } else if (step.keyword === 'When') {
        const stepId = uniqueId('act_' + step.text)
        lines.push(`  ${stepId}[${safeMermaidLabel(step.text.slice(0, 40))}]`)
        lines.push(`  ${prevStepId} --> ${stepId}`)
        prevStepId = stepId
      }
    }
  }

  return lines.join('\n')
}

// ─── Główna funkcja ──────────────────────────────────────────────────────────

export function parseGherkin(content: string, filePath: string): QAModule {
  const { featureName, scenarios } = parseGherkinDoc(content)

  const decisionTable = buildDecisionTable(scenarios)
  const mermaid = buildMermaid(featureName, scenarios)
  const compressed = decisionTable || mermaid

  const stats = computeStatsSync(content, compressed)

  return {
    name: featureName || basename(filePath, '.feature'),
    sourcePaths: [filePath],
    format: 'gherkin',
    stats,
    compressed: {
      decisionTable,
      mermaid,
      format: 'decision-table',
    },
    gaps: [],
  }
}
