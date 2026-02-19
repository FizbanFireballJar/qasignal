# QASignal — Wizja i Cele

## Cel nadrzędny

Widoczność w oficjalnej bibliotece MCP jako uznane narzędzie QA.
Historia marketingowa: *"See your QA coverage as a model — verify before you trust"*.

## Cele — korzyści dla użytkownika

1. Model AI rozumie twoje testy lepiej — bo dostaje esencję, nie ścianę tekstu.
2. Widzisz pokrycie testowe jako diagram — jednym rzutem oka, bez czytania setek TC.
3. Widzisz od razu czy AI poprawnie zrozumiał twoje testy — zanim mu zaufasz.
4. Możesz poprawić model coverage w chacie — bez edytowania plików testowych.
5. AI generuje brakujące TC patrząc na diagram — nie zgaduje, widzi luki.
6. Działa z każdym formatem — Gherkin, Playwright, Markdown, CSV.
7. Cache na dysku — analiza raz, wyniki dostępne zawsze, bez ponownego parsowania.
8. Twoje ręczne korekty modelu przeżywają zmiany w plikach testowych.

## Use Cases

### Use case 1: Kompresja kontekstu
Masz 400 TC. Copilot dostaje 40 linii Decision Table zamiast 40 stron tekstu.
Odpowiada lepiej. Nie trafiasz w limit tokenów.

### Use case 2: Weryfikacja modelu coverage
Piszesz: "Pokaż mi jak rozumiesz moduł checkout"
Copilot wywołuje `show_model`, dostajesz Mermaid diagram.
Widzisz od razu: "hej, brakuje gałęzi dla BLIK timeout" —
i to zanim zadasz jakiekolwiek pytanie o coverage.

### Use case 3: Wykrywanie luk
QASignal analizuje graf ścieżek i wskazuje kombinacje bez TC.
Nie "missing tests" — "suggested gaps". Opcjonalne, opt-in.
