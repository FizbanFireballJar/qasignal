/**
 * Schemat pliku .qa-context/overrides.json
 * Ręczne korekty modelu coverage.
 * Przeżywają rebuild cache — nigdy nie są nadpisywane automatycznie.
 * Orphaned overrides (węzeł nie istnieje po rebuild) są pomijane z warningiem.
 */

export type OverrideOperation =
  | 'add_edge' // dodaj połączenie między węzłami
  | 'add_node' // dodaj nowy węzeł
  | 'remove_edge' // usuń błędne połączenie
  | 'rename_node' // popraw nazwę węzła
  | 'mark_gap' // oznacz ścieżkę jako brakującą TC

export interface ModelOverride {
  id: string // UUID — unikalny identyfikator korekty
  module: string // nazwa modułu którego dotyczy
  operation: OverrideOperation
  addedBy: 'user' // zawsze 'user' — tylko człowiek dodaje
  addedAt: string // ISO timestamp
  note?: string // opcjonalny komentarz użytkownika

  // Pola zależne od operation:
  // add_edge, remove_edge:
  from?: string // węzeł źródłowy
  to?: string // węzeł docelowy
  label?: string // etykieta krawędzi

  // add_node:
  node?: string // identyfikator węzła
  nodeLabel?: string // etykieta wyświetlana
  style?: string // Mermaid style string np. "fill:#ff6b6b"

  // rename_node:
  oldName?: string
  newName?: string

  // mark_gap:
  path?: string[] // sekwencja węzłów
}

export interface OverridesFile {
  version: '1.0'
  overrides: ModelOverride[]
}

// Helper — pusty plik overrides dla nowego projektu
export const EMPTY_OVERRIDES: OverridesFile = {
  version: '1.0',
  overrides: [],
}
