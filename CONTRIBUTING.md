# Contributing to QASignal

## Adding a new parser

1. Create `packages/core/src/parsers/your-format.ts`
2. Implement `Parser` interface from `types/qa-context.ts`
3. Add auto-detection logic to `parsers/index.ts`
4. Add fixtures to `examples/your-format-project/`
5. Write tests with >80% coverage
6. Open PR

## Running locally

```bash
npm install
npm test
npm run build
```

## Project structure

```
packages/core/       — logika biznesowa (parsery, kompressor, cache)
packages/mcp-server/ — serwer MCP (tools, resources)
examples/            — przykładowe projekty dla każdego formatu
docs/                — dokumentacja
.qa-context/         — cache (auto-generowany, nie commitowany poza overrides.json)
```

## Commit convention

```
feat: nowa funkcjonalność
fix: naprawa błędu
docs: zmiany w dokumentacji
test: dodanie/zmiana testów
refactor: refaktoryzacja bez zmiany zachowania
chore: zmiany w konfiguracji/tooling
```

## Code style

- TypeScript strict mode
- Prettier (semi: false, singleQuote: true)
- ESLint z @typescript-eslint
- Vitest, coverage >80%
