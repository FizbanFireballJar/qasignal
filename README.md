# QASignal

QA coverage compression and visualization for AI assistants.

## The Problem

You have 400 test cases. Your AI assistant has no idea they exist.
Pasting them into chat hits token limits and drowns the model in noise.

## What QASignal Does

**1. Compresses your test cases**
400 TC → 40-line Decision Table. 90%+ token reduction.
Model answers coverage questions better with less, structured input.

**2. Shows you a visual model of your coverage**
Ask: *"Show me the checkout coverage model"*
Get a Mermaid diagram in chat. See gaps instantly. Verify before you trust.

**3. Lets you correct the model in chat**
Spot an error in the diagram? Tell Copilot to fix it.
Corrections survive file changes.

## Status

Phase 0 — Foundation
Parsers: not yet | Compression: not yet | MCP Server: not yet

## Quick Start (coming in Phase 3)

```bash
npm install -g @qasignal/mcp-server
qasignal init
```

## Supported Formats

- Gherkin `.feature`
- Playwright TypeScript `.spec.ts`
- Markdown test cases `.md`
- CSV exports from Jira/Xray

## License

MIT
