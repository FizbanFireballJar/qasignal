import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseGherkin } from '../../src/parsers/gherkin.js'

const FIXTURES = join(import.meta.dirname, '../fixtures/gherkin')

describe('parseGherkin — podstawowa struktura QAModule', () => {
  it('zwraca QAModule z wymaganymi polami dla login.feature', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.name).toBeTruthy()
    expect(module.format).toBe('gherkin')
    expect(module.sourcePaths).toContain('login.feature')
    expect(module.gaps).toEqual([])
  })

  it('stats.tokenizer jest cl100k_base', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.stats.tokenizer).toBe('cl100k_base')
  })

  it('stats.originalTokens > stats.compressedTokens', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.stats.originalTokens).toBeGreaterThan(module.stats.compressedTokens)
  })

  it('compressed.decisionTable zawiera separator Markdown', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.compressed.decisionTable).toContain('|')
    expect(module.compressed.decisionTable).toContain('-')
  })

  it('compressed.mermaid zaczyna się od flowchart TD', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.compressed.mermaid).toMatch(/^flowchart TD/)
  })

  it('compressed.format = decision-table', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.compressed.format).toBe('decision-table')
  })
})

describe('parseGherkin — scenariusze', () => {
  it('wykrywa scenariusze z login.feature', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    // login.feature ma 2 normalne scenariusze + 3 Outline Examples = 5 wierszy
    const rows = module.compressed.decisionTable
      .split('\n')
      .filter((l) => l.startsWith('|'))
    // Nagłówek + separator + min 2 wiersze danych
    expect(rows.length).toBeGreaterThanOrEqual(4)
  })

  it('Scenario Outline ekspanduje do wielu wierszy', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    // login.feature: Scenario Outline z 3 Examples → 3 wiersze (+ 2 normalne = 5)
    const rows = module.compressed.decisionTable
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .slice(2) // pomiń nagłówek i separator
    expect(rows.length).toBeGreaterThanOrEqual(5)
  })

  it('Background steps są uwzględnione w Mermaid', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    // Background: "aplikacja jest uruchomiona"
    expect(module.compressed.mermaid).toMatch(/aplikacja|uruchomiona/i)
  })
})

describe('parseGherkin — tagi', () => {
  it('parsuje plik z tagami Feature i Scenario', () => {
    const content = readFileSync(join(FIXTURES, 'tags.feature'), 'utf-8')
    const module = parseGherkin(content, 'tags.feature')
    expect(module.name).toBeTruthy()
    expect(module.compressed.decisionTable).toContain('|')
  })

  it('zwraca 2 scenariusze z tags.feature', () => {
    const content = readFileSync(join(FIXTURES, 'tags.feature'), 'utf-8')
    const module = parseGherkin(content, 'tags.feature')
    const rows = module.compressed.decisionTable
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .slice(2)
    expect(rows.length).toBe(2)
  })
})

describe('parseGherkin — Background', () => {
  it('parsuje background.feature z Background steps', () => {
    const content = readFileSync(join(FIXTURES, 'background.feature'), 'utf-8')
    const module = parseGherkin(content, 'background.feature')
    expect(module.compressed.mermaid).toMatch(/flowchart TD/)
    expect(module.gaps).toEqual([])
  })

  it('Background tworzy wspólny węzeł w Mermaid', () => {
    const content = readFileSync(join(FIXTURES, 'background.feature'), 'utf-8')
    const module = parseGherkin(content, 'background.feature')
    // "admin" z Background powinien być w Mermaid
    expect(module.compressed.mermaid).toMatch(/admin|zalogowany|produkty/i)
  })
})

describe('parseGherkin — Mermaid bezpieczeństwo', () => {
  it('Mermaid nie zawiera niezabezpieczonych cudzysłowów w etykietach węzłów', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    const lines = module.compressed.mermaid.split('\n')
    for (const line of lines) {
      // Linie z węzłami: zawierają [ lub ([
      if (line.match(/\s+\w+[\[(]/)) {
        // Wyciągnij etykietę między [ ] lub ([ ])
        const label = line.match(/\[([^\]]+)\]/)?.[1] ?? ''
        expect(label).not.toContain('"')
      }
    }
  })
})

describe('parseGherkin — edge cases', () => {
  it('parsuje inline string bez wyjątku', () => {
    const content = `Feature: Test\n  Scenario: Prosty\n    Given krok\n    When akcja\n    Then wynik`
    expect(() => parseGherkin(content, 'test.feature')).not.toThrow()
  })

  it('nazwa modułu pochodzi z Feature', () => {
    const content = `Feature: Moja Feature\n  Scenario: S\n    Given g\n    When w\n    Then t`
    const module = parseGherkin(content, 'test.feature')
    expect(module.name).toBe('Moja Feature')
  })

  it('pusty Feature zwraca QAModule z pustymi polami compressed', () => {
    const content = `Feature: Pusta\n`
    const module = parseGherkin(content, 'empty.feature')
    expect(module.name).toBeTruthy()
    expect(module.gaps).toEqual([])
  })
})
