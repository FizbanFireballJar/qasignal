# Test Cases — Płatności

## TC-001: Płatność kartą — sukces

**Priorytet:** Wysoki
**Warunki wstępne:** Użytkownik zalogowany, produkty w koszyku

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Przejdź do kasy | Strona kasy widoczna |
| 2 | Wybierz "Karta kredytowa" | Formularz karty pojawia się |
| 3 | Podaj numer karty 4111111111111111 | Pole wypełnione |
| 4 | Podaj datę 12/28, CVV 123 | Pola wypełnione |
| 5 | Kliknij "Zapłać" | Płatność przetworzona |
| 6 | Sprawdź potwierdzenie | Numer zamówienia widoczny |

## TC-002: Płatność kartą — odrzucona

**Priorytet:** Wysoki

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Przejdź do kasy | Strona kasy widoczna |
| 2 | Podaj numer karty 4000000000000002 | Pole wypełnione |
| 3 | Kliknij "Zapłać" | Błąd: "Płatność odrzucona" |

## TC-003: Płatność BLIK

**Priorytet:** Średni

Kroki:
1. Przejdź do kasy
2. Wybierz "BLIK"
3. Podaj 6-cyfrowy kod
4. Zatwierdź w aplikacji bankowej
5. Sprawdź potwierdzenie zamówienia

Oczekiwany rezultat: Zamówienie złożone, email wysłany
