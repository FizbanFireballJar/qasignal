# Wspierane formaty wejściowe

QASignal auto-wykrywa format na podstawie rozszerzenia pliku i zawartości.

## Gherkin (`.feature`)

Standard BDD. Parser używa `@cucumber/gherkin`.

```gherkin
Feature: Logowanie
  Scenario: Poprawne logowanie
    Given użytkownik na stronie logowania
    When wpisuje prawidłowe dane
    Then widzi dashboard
```

Obsługiwane: Scenario, Scenario Outline, Background, Examples, tagi (@tag).

## Playwright TypeScript (`.spec.ts`)

Parser używa AST (`@typescript-eslint/typescript-estree`).

```typescript
test('logowanie -> dashboard', async ({ page }) => {
  await page.fill('[data-testid="email"]', 'user@example.com')
  await page.click('[data-testid="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

Obsługiwane: `test()`, `test.describe()`, `test.beforeEach()`, page actions, expect.

## Markdown (`.md`)

Tabele TC i listy kroków.

```markdown
## TC-001: Płatność kartą — sukces

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz kartę | Formularz pojawia się |
| 2 | Kliknij Zapłać | Płatność przetworzona |
```

## CSV

Eksporty z Jira/Xray. Konfigurowalne kolumny przez `qasignal.config.ts`.

```csv
ID,Tytuł,Warunki wstępne,Kroki,Oczekiwany rezultat,Priorytet
TC-001,Logowanie poprawne,...,...,...,Wysoki
```
