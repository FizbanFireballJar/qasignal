# Schemat .qa-context

Katalog `.qa-context/` jest tworzony w katalogu projektu po pierwszym uruchomieniu QASignal.

## Pliki

```
projekt/
└── .qa-context/
    ├── index.json        ← auto-generowany, nadpisywany przy rebuild
    ├── coverage.mmd      ← auto-generowany Mermaid dla całego projektu
    ├── overrides.json    ← ręczne korekty, NIE nadpisywane przy rebuild
    └── snapshot.hash     ← hash plików źródłowych (inwalidacja cache)
```

## index.json — przykład

```json
{
  "version": "1.0.0",
  "generated": "2026-02-19T10:00:00Z",
  "projectRoot": "/project",
  "sourceHash": "sha256:abc123...",
  "modules": {
    "checkout": {
      "name": "checkout",
      "sourcePaths": ["tests/checkout.feature"],
      "format": "gherkin",
      "stats": {
        "originalTokens": 2400,
        "compressedTokens": 180,
        "savedPercent": 92.5,
        "ratio": 13.3,
        "tokenizer": "cl100k_base"
      },
      "compressed": {
        "decisionTable": "| auth | cart | payment | result |\n|------|------|---------|--------|\n| ✓ | >0 | card | confirm |",
        "mermaid": "flowchart TD\n  start --> auth\n  auth --> cart\n  cart --> payment",
        "format": "decision-table"
      },
      "gaps": []
    }
  }
}
```

## overrides.json — przykład

```json
{
  "version": "1.0",
  "overrides": [
    {
      "id": "uuid-1234",
      "module": "checkout",
      "operation": "add_edge",
      "from": "pay:blik",
      "to": "blik_timeout",
      "label": "timeout >30s",
      "addedBy": "user",
      "addedAt": "2026-02-19T10:00:00Z",
      "note": "TC brakuje, zgłoszone jako gap"
    }
  ]
}
```

## Kluczowa zasada

`overrides.json` jest **nietykalny** przy rebuild.
Gdy plik testowy się zmienia → `index.json` i `coverage.mmd` są przebudowywane,
ale korekty z `overrides.json` są nakładane na nowy model po rebuild.
