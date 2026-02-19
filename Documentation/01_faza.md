# QASignal — Faza 1: Plan Wykonawczy

## Parsery dla wszystkich formatów TC

**Czas:** Tydzień 2–3 (10 dni roboczych)
**Cel:** Działające parsery Gherkin, Playwright, Markdown, CSV + auto-detect, pokrycie testów >80%
**Zasada:** Każdy parser zwraca kompletny `QAModule` z wypełnionymi `stats`, `compressed` i `gaps: []`

---

## PRZED STARTEM — przygotowanie

### Krok 1.0a — Realne fixtures z pracy (przed Dniem 1)

Zanim zaczniesz pisać kod, przygotuj realne pliki z aktywnych projektów korporacyjnych:

- Minimum 1 plik `.feature` (10–20 scenariuszy, Scenario Outline mile widziany)
- Minimum 1 plik `.spec.ts` z Playwright (5–10 testów z `test.describe`)
- Minimum 1 plik `.md` z tabelami TC (styl Confluence / Jira)
- Opcjonalnie: eksport CSV z Jira/Xray (5–15 wierszy)

Zapisz je w:

```
packages/core/tests/fixtures/real/
  login-real.feature        ← z pracy, zanonimizowane jeśli trzeba
  checkout-real.spec.ts     ← z pracy
  payment-real.md           ← z pracy
  jira-export-real.csv      ← opcjonalnie
```

Parser jest oznaczony jako "done" dopiero gdy przejdzie na tych plikach.

### Krok 1.0b — Zrozum kontrakt wyjściowy

Każdy parser przyjmuje `string` (zawartość pliku) + `string` (ścieżka) i zwraca `QAModule`.
`gaps: []` — Faza 2 je wypełni. Parser zwraca pustą tablicę.
`stats.tokenizer = 'cl100k_base'` — używamy `get_encoding('cl100k_base')` z tiktoken.
`compressed.format = 'decision-table'` — decision table jest primary w Fazie 1.

---

## STRUKTURA PLIKÓW — co powstanie w Fazie 1

```
packages/core/src/parsers/
  gherkin.ts         ← Dzień 1–2
  playwright.ts      ← Dzień 3–4
  markdown.ts        ← Dzień 5–6
  csv.ts             ← Dzień 7–8
  index.ts           ← Dzień 9 (auto-detect)
  token-counter.ts   ← Dzień 1 (współdzielony przez wszystkie parsery)
  builders.ts        ← Dzień 7 (współdzielona logika Decision Table + Mermaid)

packages/core/tests/
  parsers/
    token-counter.test.ts
    gherkin.test.ts
    playwright.test.ts
    markdown.test.ts
    csv.test.ts
    auto-detect.test.ts
    integration.test.ts
  fixtures/
    gherkin/
      login.feature          ← kopia z examples/
      tags.feature           ← nowy: @smoke, @regression
      background.feature     ← nowy: Background z wieloma krokami
    playwright/
      login.spec.ts          ← kopia z examples/
      hooks.spec.ts          ← nowy: beforeEach, afterEach
      nested.spec.ts         ← nowy: zagnieżdżone describe, test bez describe
    markdown/
      payment.md             ← kopia z examples/
      steps-list.md          ← nowy: TC jako lista kroków
      mixed.md               ← nowy: tabele + listy + angielskie nagłówki
    csv/
      xray-export.csv        ← nowy: format Xray/Jira z przecinkiem
      semicolon-export.csv   ← nowy: format z średnikiem
    real/
      ← TUTAJ WKLEJASZ PLIKI Z PRACY
```

---

## INTERFEJSY WEWNĘTRZNE PARSERÓW

Nie dodajemy nowych typów do `qa-context.ts`. Typy wewnętrzne żyją tylko w plikach parserów.

### Publiczny interfejs każdego parsera (sygnatura funkcji)

```typescript
// gherkin.ts
export function parseGherkin(content: string, filePath: string): QAModule

// playwright.ts
export function parsePlaywright(content: string, filePath: string): QAModule

// markdown.ts
export function parseMarkdown(content: string, filePath: string): QAModule

// csv.ts
export interface CsvParserOptions {
  columns?: {
    id?: string
    title?: string
    steps?: string
    expected?: string
    priority?: string
    preconditions?: string
  }
  delimiter?: ',' | ';' | '\t'
}
export function parseCsv(content: string, filePath: string, options?: CsvParserOptions): QAModule

// index.ts (auto-detect)
export function parseFile(content: string, filePath: string): QAModule
export function detectFormat(content: string, filePath: string): SourceFormat
```

---

## token-counter.ts — współdzielony helper (Dzień 1)

```typescript
// packages/core/src/parsers/token-counter.ts
import { get_encoding } from 'tiktoken'

const enc = get_encoding('cl100k_base')

export function countTokens(text: string): number {
  return enc.encode(text).length
}

export function computeStats(originalText: string, compressedText: string): TokenStats {
  const originalTokens = countTokens(originalText)
  const compressedTokens = countTokens(compressedText)
  const savedPercent = originalTokens > 0
    ? Math.round(((originalTokens - compressedTokens) / originalTokens) * 100 * 10) / 10
    : 0
  const ratio = compressedTokens > 0
    ? Math.round((originalTokens / compressedTokens) * 10) / 10
    : 0
  return {
    originalTokens,
    compressedTokens,
    savedPercent,
    ratio,
    tokenizer: 'cl100k_base',
  }
}
```

**Uwaga na WASM:** tiktoken ładuje `.wasm` w środowisku Node. Jeśli Vitest rzuca błąd, dodaj do `vitest.config.ts`:
```typescript
test: {
  pool: 'forks',  // izoluje WASM od worker threads
}
```

---

## DZIEŃ 1 — token-counter + parser Gherkin: szkielet (8h)

### Blok 1 (8:00–9:30) — token-counter.ts + testy

Stwórz `packages/core/src/parsers/token-counter.ts` (kod powyżej).

Napisz `packages/core/tests/parsers/token-counter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { countTokens, computeStats } from '../../src/parsers/token-counter.js'

describe('countTokens', () => {
  it('zwraca 0 dla pustego stringa', () => {
    expect(countTokens('')).toBe(0)
  })

  it('liczy tokeny dla prostego zdania', () => {
    const tokens = countTokens('Hello world')
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(5)
  })

  it('dłuższy tekst ma więcej tokenów', () => {
    expect(countTokens('a b c d e f g h i j')).toBeGreaterThan(countTokens('test'))
  })
})

describe('computeStats', () => {
  it('zwraca prawidłową strukturę TokenStats', () => {
    const stats = computeStats('original long text here with many words', 'short')
    expect(stats.tokenizer).toBe('cl100k_base')
    expect(stats.originalTokens).toBeGreaterThan(stats.compressedTokens)
    expect(stats.savedPercent).toBeGreaterThan(0)
    expect(stats.ratio).toBeGreaterThan(1)
  })

  it('savedPercent nie przekracza 100', () => {
    const stats = computeStats('a b c d e f g', 'x')
    expect(stats.savedPercent).toBeLessThanOrEqual(100)
  })
})
```

Uruchom `npm test` — token-counter testy muszą przejść zanim ruszysz dalej.

### Blok 2 (9:30–11:30) — Zbadaj API @cucumber/gherkin

Kluczowe informacje:
- `generateMessages` z `@cucumber/gherkin` zwraca `Envelope[]`
- `SourceMediaType` jest w `@cucumber/messages` (dependency of gherkin)
- Struktura: `Envelope.gherkinDocument.feature.children[].scenario`
- Scenariusze: `.scenario.name`, `.scenario.tags[].name`, `.scenario.steps[]`
- Outline: `.scenario.examples[].tableHeader.cells[]` + `.tableBody[].cells[]`
- Background: `.background.steps[]`

### Blok 3 (11:30–13:00) — Stwórz fixtures Gherkin

Skopiuj `examples/gherkin-project/tests/login.feature` → `packages/core/tests/fixtures/gherkin/login.feature`

Stwórz `packages/core/tests/fixtures/gherkin/tags.feature`:

```gherkin
@auth @smoke
Feature: Zarządzanie sesją

  @happy-path
  Scenario: Wylogowanie
    Given użytkownik jest zalogowany
    When klika "Wyloguj"
    Then sesja jest zakończona
    And użytkownik widzi stronę logowania

  @negative @regression
  Scenario: Wygaśnięcie sesji
    Given użytkownik ma sesję starszą niż 30 minut
    When próbuje wykonać akcję
    Then widzi komunikat "Sesja wygasła"
    And jest przekierowany na stronę logowania
```

### Blok 4 (13:30–16:00) — gherkin.ts: szkielet parsera

Implementuj `packages/core/src/parsers/gherkin.ts`:

**Algorytm Decision Table:**
1. Zbierz wszystkie scenariusze (Outline → ekspanduj do wierszy)
2. Kolumny = unikalne skrócone warunki z kroków When/Given (max 20 znaków)
3. Jeden wiersz per scenariusz / per Examples row
4. Wartości: wyciągnij z `"..."` w tekście kroku lub użyj `✓`/`✗`/`-`
5. Kolumna `result` = pierwsza wartość z kroku Then

**Algorytm Mermaid:**
1. `start([Feature: Nazwa])` → węzły Background → węzły scenariuszy
2. Background = wspólny węzeł, wszystkie scenariusze wychodzą od niego
3. When/Given steps = prostokąty `[ ]`, Then steps = zaokrąglone `([ ])`
4. IDs węzłów: `slug(text)_index` — escapuj znaki specjalne
5. W etykietach węzłów: zamień `"` na `'`, usuń `-->`, `{}`, `()`

### Blok 5 (16:00–17:30) — Szkieletowe testy gherkin.test.ts

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseGherkin } from '../../src/parsers/gherkin.js'

const FIXTURES = join(import.meta.dirname, '../fixtures/gherkin')

describe('parseGherkin — podstawowa struktura', () => {
  it('zwraca QAModule z wymaganymi polami', () => {
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

  it('compressed.decisionTable zawiera separator tabel Markdown', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.compressed.decisionTable).toContain('|')
  })

  it('compressed.mermaid zaczyna się od flowchart TD', () => {
    const content = readFileSync(join(FIXTURES, 'login.feature'), 'utf-8')
    const module = parseGherkin(content, 'login.feature')
    expect(module.compressed.mermaid).toMatch(/^flowchart TD/)
  })
})
```

### Koniec Dnia 1 — commit

```bash
npm test   # minimum 7 testów (3 token-counter + 4 gherkin)
git add packages/core/src/parsers/ packages/core/tests/parsers/ packages/core/tests/fixtures/
git commit -m "feat(parsers): token-counter + gherkin parser skeleton with tests"
git push origin main
```

---

## DZIEŃ 2 — Parser Gherkin: pełna implementacja (8h)

**Cel dnia:** Kompletny parser Gherkin z Scenario Outline, Background, tagami. Coverage >80%.

### Blok 1 (8:00–10:00) — Scenario Outline + Examples expansion

```typescript
function expandOutline(scenario: ParsedScenario): ParsedScenario[] {
  if (!scenario.isOutline || !scenario.examples || !scenario.exampleHeaders) {
    return [scenario]
  }
  return scenario.examples.map((exampleRow, idx) => {
    const substitutions = Object.fromEntries(
      scenario.exampleHeaders!.map((h, i) => [h, exampleRow[i] ?? ''])
    )
    return {
      ...scenario,
      name: `${scenario.name} [${idx + 1}]`,
      steps: scenario.steps.map(step => ({
        ...step,
        text: step.text.replace(/<(\w+)>/g, (_, key) => substitutions[key] ?? `<${key}>`),
      })),
      isOutline: false,
    }
  })
}
```

Przetestuj: `login.feature` ma `Scenario Outline: Walidacja pól` z 3 Examples → 3 wiersze w Decision Table.

### Blok 2 (10:00–12:00) — Background + tagi

- Background steps wstrzykiwane do każdego scenariusza jako pierwsze Given steps
- Tagi = Feature tagi + Scenario tagi (suma, deduplikacja)
- W Mermaid: Background = wspólny węzeł startowy, każdy scenariusz od niego wychodzi

### Blok 3 (13:00–17:00) — Decision Table i Mermaid: finalizacja

**Format Decision Table:**

```markdown
| sc | email | haslo | result |
|----|-------|-------|--------|
| Poprawne logowanie | valid | Password123! | dashboard |
| Błędne hasło | valid | zlehaslo | err:login |
| Walidacja pól [1] | nie-email | abc | err:validation |
| Walidacja pól [2] | user@test.com | (empty) | err:validation |
| Walidacja pól [3] | (empty) | pass | err:validation |
```

**Zasady kolumn:**
- Skróć warunki: usuń słowa kluczowe ("użytkownik", "jest", "na stronie"), zostaw domenę
- Max 20 znaków na nagłówek kolumny
- Wartość z cudzysłowów w tekście kroku → wartość, brak → `✓`/`-`

### Koniec Dnia 2 — commit

```bash
npm run test:coverage  # gherkin.ts >80%
git commit -m "feat(parsers): gherkin parser complete - Scenario Outline, Background, tags"
git push origin main
```

---

## DZIEŃ 3 — Parser Playwright: szkielet i AST (8h)

**Cel dnia:** Działający parser Playwright parsujący `login.spec.ts`, zwracający `QAModule`.

### Blok 1 (8:00–9:30) — API @typescript-eslint/typescript-estree

```typescript
import { parse, simpleTraverse } from '@typescript-eslint/typescript-estree'

// parse(content, { jsx: false, comment: false, tokens: false })
// simpleTraverse(ast, { enter(node) { ... } })

// Wzorce do szukania:
// test('name', async ({page}) => {...})   → test call
// test.describe('name', () => {...})      → describe wrapper
// test.beforeEach(async ({page}) => {...}) → hook
// await page.fill/click/goto/...          → page action
// expect(page).toHaveURL(...)             → assertion
// expect(locator).toContainText(...)      → assertion
```

### Blok 2 (9:30–11:30) — Stwórz fixtures Playwright

Skopiuj `examples/playwright-project/tests/login.spec.ts` → `packages/core/tests/fixtures/playwright/login.spec.ts`

Stwórz `packages/core/tests/fixtures/playwright/hooks.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cart')
    await page.click('[data-testid="checkout"]')
  })

  test('płatność kartą -> potwierdzenie', async ({ page }) => {
    await page.fill('[data-testid="card-number"]', '4111111111111111')
    await page.fill('[data-testid="cvv"]', '123')
    await page.click('[data-testid="pay"]')
    await expect(page).toHaveURL('/confirmation')
  })

  test('pusta karta -> błąd walidacji', async ({ page }) => {
    await page.click('[data-testid="pay"]')
    await expect(page.locator('[data-testid="card-error"]')).toContainText('Numer karty jest wymagany')
  })
})
```

Stwórz `packages/core/tests/fixtures/playwright/nested.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('samodzielny test logowania', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL('/login')
})

test.describe('Admin panel', () => {
  test.describe('Użytkownicy', () => {
    test('lista użytkowników', async ({ page }) => {
      await page.goto('/admin/users')
      await expect(page.locator('table')).toBeVisible()
    })
  })
})
```

### Blok 3 (11:30–16:30) — playwright.ts: implementacja

**Wyciąganie page actions** (wzorzec: `await page.METHOD(...)`):
```typescript
const PAGE_ACTIONS = ['fill', 'click', 'goto', 'type', 'check', 'selectOption',
                      'hover', 'dblclick', 'press', 'upload', 'uncheck']
// Wartość: METHOD(selector) lub METHOD(selector, value)
// Uwaga: selector może zawierać " — zamień na ' w wyjściu
```

**Wyciąganie assertions** (wzorzec: `expect(...).MATCHER(...)`):
```typescript
// Wzorzec: callee = MemberExpression, object = CallExpression expect()
// Wartość: MATCHER(value) lub samo MATCHER jeśli brak arg
```

**Decision Table dla Playwright:**
```markdown
| test | setup | action | assertion |
|------|-------|--------|-----------|
| poprawne logowanie | goto /login | fill+click | URL=/dashboard |
| błędne hasło | goto /login | fill+click | error:Nieprawidłowe |
| pusty formularz | goto /login | click | visible:email-error |
```

**Mermaid:**
- beforeEach = setup węzeł, każdy test od niego wychodzi
- Zagnieżdżone describe = prefix w nazwie węzła

### Blok 4 (16:30–17:30) — Testy Playwright

```typescript
describe('parsePlaywright', () => {
  it('zwraca QAModule dla login.spec.ts', () => { ... })
  it('wykrywa 3 testy w login.spec.ts', () => { ... })
  it('compressed.mermaid zawiera flowchart TD', () => { ... })
  it('beforeEach actions są widoczne w setup kolumnie', () => { ... })
  it('stats.originalTokens > stats.compressedTokens', () => { ... })
})
```

### Koniec Dnia 3 — commit

```bash
git commit -m "feat(parsers): playwright parser - AST traversal, page actions, expect assertions"
git push origin main
```

---

## DZIEŃ 4 — Parser Playwright: edge cases + real fixtures (8h)

**Cel dnia:** Parser odporny na edge cases, coverage >80%.

### Edge cases do obsłużenia

1. **`test()` bez `test.describe()`** — moduleName = basename pliku bez `.spec.ts`
2. **Zagnieżdżone `test.describe()`** — nazwa testu = `Outer > Inner > test name`
3. **`test.skip()`, `test.only()`** — traktuj normalnie, dodaj suffix `[SKIP]`/`[ONLY]`
4. **Selektory z `"` w Mermaid** — `[data-testid="submit"]` → zamień `"` na `'` w etykietach
5. **beforeEach stacking** — zbieraj hooks z wszystkich poziomów describe od zewnętrznego do bieżącego

### Testy edge cases

```typescript
it('obsługuje test bez describe wrappera', () => {
  const content = readFileSync(join(FIXTURES, 'nested.spec.ts'), 'utf-8')
  const module = parsePlaywright(content, 'nested.spec.ts')
  expect(module.name).toBeTruthy()
})

it('zagnieżdżone describe tworzy czytelne nazwy', () => {
  const content = readFileSync(join(FIXTURES, 'nested.spec.ts'), 'utf-8')
  const module = parsePlaywright(content, 'nested.spec.ts')
  expect(module.compressed.decisionTable).toMatch(/admin|użytkownicy|lista/i)
})

it('Mermaid nie zawiera niedozwolonych " w etykietach węzłów', () => {
  const content = readFileSync(join(FIXTURES, 'login.spec.ts'), 'utf-8')
  const module = parsePlaywright(content, 'login.spec.ts')
  const labelMatches = module.compressed.mermaid.matchAll(/\[([^\]]+)\]/g)
  for (const match of labelMatches) {
    expect(match[1]).not.toContain('"')
  }
})
```

### Koniec Dnia 4 — commit

```bash
npm run test:coverage  # playwright.ts >80%
git commit -m "feat(parsers): playwright parser complete - edge cases, nested describe, beforeEach"
git push origin main
```

---

## DZIEŃ 5 — Parser Markdown (8h)

**Cel dnia:** Parser Markdown obsługujący tabele TC i listy kroków.

### Dwa warianty formatu

**Wariant A — tabela kroków:**
```markdown
## TC-001: Tytuł
**Priorytet:** Wysoki
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Akcja | Rezultat |
```

**Wariant B — lista kroków:**
```markdown
## TC-003: Tytuł
Kroki:
1. Krok pierwszy
2. Krok drugi
Oczekiwany rezultat: Efekt końcowy
```

### Algorytm parsowania

1. Split po nagłówkach `## ` → każda sekcja = jeden TC
2. Wyciągnij ID z `TC-XXX:` prefix w nagłówku
3. Wyciągnij priorytet z `**Priorytet:**` lub `**Priority:**`
4. Jeśli linie z `|` → tryb tabeli (pomiń nagłówek + separator)
5. Jeśli linie `^\d+\.` → tryb listy
6. `Oczekiwany rezultat:` lub `Expected Result:` → kolumna result

### Stwórz fixtures Markdown

Skopiuj `examples/mixed-project/tests/payment.md` → `packages/core/tests/fixtures/markdown/payment.md`

Stwórz `packages/core/tests/fixtures/markdown/steps-list.md`:
```markdown
# Test Cases — Rejestracja

## TC-010: Rejestracja poprawna
**Priorytet:** Wysoki

Kroki:
1. Przejdź do /register
2. Wypełnij email unikalny@test.com
3. Wypełnij hasło MinHaslo123!
4. Kliknij "Zarejestruj"

Oczekiwany rezultat: Konto utworzone, email weryfikacyjny wysłany

## TC-011: Rejestracja — email zajęty

Kroki:
1. Przejdź do /register
2. Wypełnij email juz@istnieje.com
3. Kliknij "Zarejestruj"

Oczekiwany rezultat: Błąd "Email jest już zajęty"
```

### Koniec Dnia 5 — commit

```bash
git commit -m "feat(parsers): markdown parser - table TC, step lists, heuristic extraction"
git push origin main
```

---

## DZIEŃ 6 — Parser Markdown: edge cases + eksport (6h)

### Edge cases Markdown

1. **Nagłówki H1/H3** — fallback jeśli brak `##`
2. **Sekcje bez TC** (wstęp, opis) — ignoruj sekcje bez kroków
3. **Angielski i polski** — `Priority:` / `Priorytet:`, `Expected Result:` / `Oczekiwany rezultat:`
4. **Tabela bez kolumny "Akcja"** — kolumna 1 = steps, ostatnia = result
5. **Znaki specjalne Mermaid** w nazwie TC — zamień `()`, `{}`, `-->` na `_`

Stwórz `packages/core/tests/fixtures/markdown/mixed.md`:
```markdown
# Moduł: Koszyk

Ten dokument opisuje test cases dla modułu koszyka.

## TC-020: Dodaj produkt do koszyka

**Priority:** High

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add to cart" | Product appears in cart |
| 2 | Go to /cart | Cart shows 1 item |

## TC-021: Usuń produkt (edge case: pusty koszyk)

| Warunek | Wynik |
|---------|-------|
| koszyk niepusty | produkt usunięty |
| po usunięciu pusty | "Koszyk jest pusty" widoczne |
```

### Eksport parserów z index.ts

Po zakończeniu Dnia 6, dodaj do `packages/core/src/index.ts`:

```typescript
// Parsery — Faza 1 (parseCsv i parseFile dodamy po Dniu 9)
export { parseGherkin } from './parsers/gherkin.js'
export { parsePlaywright } from './parsers/playwright.js'
export { parseMarkdown } from './parsers/markdown.js'
```

### Koniec Dnia 6 — commit

```bash
npm run test:coverage  # markdown.ts >80%
git commit -m "feat(parsers): markdown parser complete - edge cases, mixed formats"
git push origin main
```

---

## DZIEŃ 7 — Parser CSV (8h)

**Cel dnia:** Parser CSV dla eksportów Xray i Jira, konfigurowalny mapping kolumn.

### Analiza formatów CSV

**Format Xray (comma-delimited):**
```csv
ID,Summary,Pre-condition,Test Steps,Expected Result,Priority
TC-001,Logowanie poprawne,,"krok1|krok2|krok3",Dashboard widoczny,High
```

**Format alternatywny (semicolon, polskie nazwy):**
```csv
Klucz;Tytuł;Kroki;Oczekiwany rezultat;Priorytet
TC-001;Logowanie;krok1|krok2;Dashboard;Wysoki
```

### Kluczowe decyzje implementacyjne

- **Brak zewnętrznej biblioteki CSV** — własny RFC 4180 subset (obsługa `"` jako escape)
- **Auto-detect delimiter:** zlicz `,` vs `;` vs `\t` w pierwszej linii
- **Auto-detect kolumny:** case-insensitive match na typowe nazwy
- **Strip BOM:** `\uFEFF` na początku pliku (Excel exports)
- **Parsowanie kroków:** spróbuj `\n`, `|`, `;` jako separator w polu Steps
- **Fallback ID:** jeśli brak kolumny ID → `#1`, `#2`, ...

### Fixtures CSV

Stwórz `packages/core/tests/fixtures/csv/xray-export.csv`:
```csv
ID,Summary,Pre-condition,Test Steps,Expected Result,Priority
TC-001,Logowanie poprawne,Użytkownik niezalogowany,"1. Przejdź do /login|2. Wpisz user@example.com|3. Wpisz Password123!|4. Kliknij Zaloguj",Dashboard widoczny,High
TC-002,Błędne hasło,,"1. Przejdź do /login|2. Wpisz user@example.com|3. Wpisz złehasło|4. Kliknij Zaloguj",Komunikat błędu widoczny,High
TC-003,Puste pola,,"1. Przejdź do /login|2. Kliknij Zaloguj",Błędy walidacji widoczne,Medium
```

Stwórz `packages/core/tests/fixtures/csv/semicolon-export.csv`:
```csv
Klucz;Tytuł;Kroki;Oczekiwany rezultat;Priorytet
TC-010;Rejestracja poprawna;Krok 1. Idź do /register|Krok 2. Wypełnij dane|Krok 3. Kliknij zarejestruj;Konto utworzone;Wysoki
TC-011;Email zajęty;Krok 1. Idź do /register|Krok 2. Wypełnij zajęty email|Krok 3. Kliknij zarejestruj;Błąd: email zajęty;Wysoki
```

### Refactor: builders.ts

Po zaimplementowaniu CSV, wyodrębnij współdzieloną logikę do `packages/core/src/parsers/builders.ts`:

```typescript
// Wewnętrzny interfejs (nie eksportowany z @qasignal/core)
interface ParsedTC {
  id: string | null
  title: string
  priority: string | null
  steps: string[]
  expectedResults: string[]
}

export function buildDecisionTable(tcs: ParsedTC[]): string
export function buildMermaid(tcs: ParsedTC[], moduleName: string): string
```

Zaktualizuj `markdown.ts` i `csv.ts` żeby importowały z `builders.ts`.

### Koniec Dnia 7 — commit

```bash
git commit -m "feat(parsers): csv parser - Xray/Jira exports, auto-detect columns/delimiter
refactor(parsers): extract shared decision table and mermaid builders"
git push origin main
```

---

## DZIEŃ 8 — Parser CSV: edge cases + testy integracyjne (6h)

### Edge cases CSV

```typescript
it('obsługuje BOM na początku pliku', () => {
  const module = parseCsv('\uFEFFID,Summary\nTC-001,Test', 'bom.csv')
  expect(module.compressed.decisionTable).toContain('TC-001')
})

it('obsługuje Windows CRLF line endings', () => {
  const module = parseCsv('ID,Summary\r\nTC-001,Test\r\nTC-002,Test2', 'crlf.csv')
  const rows = module.compressed.decisionTable.split('\n').filter(l => l.startsWith('|'))
  expect(rows.length).toBeGreaterThanOrEqual(4)
})

it('generuje auto-ID gdy brak kolumny ID', () => {
  const module = parseCsv('Tytuł,Kroki\nLogowanie,krok1', 'no-id.csv')
  expect(module.compressed.decisionTable).toMatch(/#1|Row 1/)
})
```

### Testy integracyjne — kontrakt QAModule

```typescript
// packages/core/tests/parsers/integration.test.ts
const PARSERS = [
  { name: 'gherkin', fn: () => parseGherkin('Feature: T\n  Scenario: S\n    Given g\n    When w\n    Then t', 'test.feature') },
  { name: 'playwright', fn: () => parsePlaywright("import{test}from'@playwright/test'\ntest('t',async({page})=>{})", 'test.spec.ts') },
  { name: 'markdown', fn: () => parseMarkdown('## TC-001: T\n\nKroki:\n1. k\n\nOczekiwany rezultat: ok', 'test.md') },
  { name: 'csv', fn: () => parseCsv('ID,Summary\nTC-001,Test', 'test.csv') },
]

// Dla każdego parsera sprawdź: gaps=[], stats.tokenizer, compressed pola, sourcePaths, format
```

### Koniec Dnia 8 — commit

```bash
npm run test:coverage  # csv.ts >80%, builders.ts >80%
git commit -m "feat(parsers): csv parser complete - BOM, CRLF, edge cases
test(parsers): integration contract tests for all parsers"
git push origin main
```

---

## DZIEŃ 9 — Auto-detect (parsers/index.ts) (6h)

### Implementacja detectFormat

```typescript
export function detectFormat(content: string, filePath: string): SourceFormat {
  const ext = extname(filePath).toLowerCase()

  // 1. Rozszerzenie — deterministic
  if (ext === '.feature') return 'gherkin'
  if (ext === '.csv') return 'csv'
  if (['.spec.ts', '.spec.js', '.test.ts', '.test.js'].some(e => filePath.endsWith(e))) return 'playwright'
  if (ext === '.md' || ext === '.markdown') return 'markdown'

  // 2. Zawartość .ts/.js bez .spec
  if ((ext === '.ts' || ext === '.js') &&
      (content.includes('@playwright/test') || content.includes('page.goto'))) {
    return 'playwright'
  }

  // 3. Fallback na zawartość
  if (content.includes('Feature:') && content.includes('Scenario')) return 'gherkin'
  if (content.includes('import { test') && content.includes('playwright')) return 'playwright'
  if (content.includes('## TC-') || content.includes('| Krok |')) return 'markdown'
  if (content.split('\n')[0]?.includes(',')) return 'csv'

  return 'markdown'
}

export function parseFile(content: string, filePath: string): QAModule {
  const format = detectFormat(content, filePath)
  switch (format) {
    case 'gherkin':    return parseGherkin(content, filePath)
    case 'playwright': return parsePlaywright(content, filePath)
    case 'csv':        return parseCsv(content, filePath)
    case 'markdown':
    case 'mixed':
    default:           return parseMarkdown(content, filePath)
  }
}
```

### Testy auto-detect

```typescript
// Rozszerzenia
it('.feature → gherkin', () => expect(detectFormat('', 'login.feature')).toBe('gherkin'))
it('.csv → csv', () => expect(detectFormat('', 'export.csv')).toBe('csv'))
it('.spec.ts → playwright', () => expect(detectFormat('', 'login.spec.ts')).toBe('playwright'))
it('.md → markdown', () => expect(detectFormat('', 'tcs.md')).toBe('markdown'))

// Zawartość (fallback dla .txt itp.)
it('Feature: w treści → gherkin', () => {
  expect(detectFormat('Feature: T\n  Scenario: S', 'f.txt')).toBe('gherkin')
})

// parseFile — unified entry point
it('parseFile zwraca QAModule z format=gherkin dla .feature', () => {
  const module = parseFile('Feature: T\n  Scenario: S\n    Given g\n    When w\n    Then t', 'test.feature')
  expect(module.format).toBe('gherkin')
})
```

### Aktualizacja publicznego API

Zaktualizuj `packages/core/src/index.ts` — kompletne eksporty Fazy 1:

```typescript
// Parsery — Faza 1
export { parseGherkin } from './parsers/gherkin.js'
export { parsePlaywright } from './parsers/playwright.js'
export { parseMarkdown } from './parsers/markdown.js'
export { parseCsv } from './parsers/csv.js'
export type { CsvParserOptions } from './parsers/csv.js'
export { parseFile, detectFormat } from './parsers/index.js'
```

### Koniec Dnia 9 — commit

```bash
npm run build
npm test
npm run lint
npm run format:check
git commit -m "feat(parsers): auto-detect format - parseFile unified entry point
feat(core): export all parsers from public API"
git push origin main
```

---

## DZIEŃ 10 — Finalizacja Fazy 1 (4h)

### Checklist końcowa Fazy 1

```
PARSERY:
[ ] gherkin.ts — parseGherkin(content, path) → QAModule
[ ] playwright.ts — parsePlaywright(content, path) → QAModule
[ ] markdown.ts — parseMarkdown(content, path) → QAModule
[ ] csv.ts — parseCsv(content, path, options?) → QAModule
[ ] parsers/index.ts — parseFile, detectFormat
[ ] token-counter.ts — countTokens, computeStats
[ ] builders.ts — buildDecisionTable, buildMermaid (wspólne dla MD + CSV)

WYJŚCIE PARSERÓW:
[ ] compressed.decisionTable — Markdown tabela, nie puste dla niepustego wejścia
[ ] compressed.mermaid — 'flowchart TD...' lub '', bez " w etykietach
[ ] compressed.format = 'decision-table'
[ ] gaps = [] wszędzie
[ ] stats.tokenizer = 'cl100k_base' wszędzie
[ ] stats.originalTokens >= stats.compressedTokens

FIXTURES:
[ ] packages/core/tests/fixtures/gherkin/ — min 3 pliki
[ ] packages/core/tests/fixtures/playwright/ — min 3 pliki
[ ] packages/core/tests/fixtures/markdown/ — min 3 pliki
[ ] packages/core/tests/fixtures/csv/ — min 2 pliki
[ ] packages/core/tests/fixtures/real/ — min 3 realne pliki z pracy (odkomentowane testy)

TESTY I COVERAGE:
[ ] token-counter.test.ts przechodzi
[ ] gherkin.test.ts przechodzi, coverage >80%
[ ] playwright.test.ts przechodzi, coverage >80%
[ ] markdown.test.ts przechodzi, coverage >80%
[ ] csv.test.ts przechodzi, coverage >80%
[ ] auto-detect.test.ts przechodzi
[ ] integration.test.ts przechodzi — kontrakt QAModule dla wszystkich parserów
[ ] Oryginalne 3 testy typów z Fazy 0 nadal przechodzą

BUILD I CI:
[ ] npm run build → success
[ ] npm run lint → 0 błędów
[ ] npm run format:check → czyste
[ ] GitHub Actions CI zielone na Node 18 i 20
```

### Aktualizacja README

Zmień sekcję `## Status` w `README.md`:

```markdown
## Status

- Phase 0: Foundation — DONE
- Phase 1: Parsers — DONE (Gherkin, Playwright, Markdown, CSV)
- Phase 2: Compressor — planned
- Phase 3: MCP Server — planned
```

### Commit i tag

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build

git add .
git commit -m "feat: phase 1 complete - parsers for all TC formats with >80% coverage"
git tag v0.1.0-phase1
git push origin main --tags
```

---

## COMMIT STRATEGY

| Dzień | Commit |
|-------|--------|
| 1 | `feat(parsers): token-counter + gherkin parser skeleton with tests` |
| 2 | `feat(parsers): gherkin parser complete - Scenario Outline, Background, tags` |
| 3 | `feat(parsers): playwright parser - AST traversal, page actions, assertions` |
| 4 | `feat(parsers): playwright parser complete - edge cases, nested describe` |
| 5 | `feat(parsers): markdown parser - table TC, step lists, heuristic extraction` |
| 6 | `feat(parsers): markdown parser complete - edge cases, mixed formats` |
| 7 | `feat(parsers): csv parser - Xray/Jira exports, auto-detect columns/delimiter` + `refactor(parsers): extract shared builders` |
| 8 | `feat(parsers): csv parser complete - BOM, CRLF, edge cases` + `test(parsers): integration contract tests` |
| 9 | `feat(parsers): auto-detect format + unified parseFile entry point` |
| 10 | `feat: phase 1 complete - parsers for all TC formats with >80% coverage` |

---

## DELIVERABLES FAZY 1

1. **4 parsery** — Gherkin, Playwright, Markdown, CSV — każdy zwracający kompletny `QAModule`
2. **token-counter.ts** — helper tiktoken cl100k_base, współdzielony przez wszystkie parsery
3. **builders.ts** — współdzielona logika Decision Table + Mermaid dla Markdown i CSV
4. **auto-detect** — `parseFile()` i `detectFormat()` jako unified entry point
5. **Publiczne API** — wszystkie parsery eksportowane z `@qasignal/core`
6. **Fixtures** — 3+ pliki per format + realne pliki z pracy
7. **Testy** — >80% coverage, kontrakt QAModule zweryfikowany integracją
8. **Tag v0.1.0-phase1** — punkt odniesienia do Fazy 2

## CO NIE JEST ZROBIONE (celowo)

- `gaps: []` — zawsze puste (Faza 2: Graph Builder + PathFinder)
- Cache plików na dysku (Faza 2: cache/writer.ts, cache/reader.ts)
- File watcher (Faza 2: cache/watcher.ts)
- Zaawansowany semantyczny Graf (Faza 2: compressor/graph.ts)

## CO DALEJ — Faza 2

Graph Builder + Path Finder + zaawansowany Mermaid z kolorowaniem coverage + cache na dysk.
Pierwsze zadanie Fazy 2: `compressor/graph.ts` — budowanie semantycznego grafu z QAModule.

---

## POTENCJALNE PROBLEMY I ROZWIĄZANIA

**tiktoken WASM na Windows/Vitest:**
Jeśli `get_encoding()` rzuca błąd w Vitest, dodaj do `vitest.config.ts`:
```typescript
test: { pool: 'forks' }
```
Alternatywa: lazy init — `let enc: Tiktoken | null = null; function getEnc() { return enc ?? (enc = get_encoding('cl100k_base')) }`

**@typescript-eslint/typescript-estree + NodeNext modules:**
Wszystkie importy wewnętrzne muszą kończyć się `.js` (nie `.ts`) nawet jeśli plik to `.ts`.
Przykład: `import { parseGherkin } from './gherkin.js'`

**@cucumber/messages jako zależność:**
`SourceMediaType` jest w `@cucumber/messages`, nie w `@cucumber/gherkin`.
Sprawdź czy jest w node_modules — jest dependency of gherkin, więc powinien być dostępny.
Jeśli nie: `npm install --workspace packages/core @cucumber/messages`

**Mermaid labels z polskimi znakami:**
Polskie znaki są OK w Mermaid. Problem to: `"`, `-->`, `{`, `}`, `(`, `)` w etykietach.
Rozwiązanie: wrapper function `safeMermaidLabel(text: string)` który escapuje/usuwa te znaki.

**import.meta.dirname w testach:**
`import.meta.dirname` wymaga `"module": "NodeNext"` w tsconfig (już mamy).
W Vitest działa poprawnie z tą konfiguracją.
