Feature: Zarządzanie produktami

  Background:
    Given użytkownik jest zalogowany jako admin
    And jest na stronie "Produkty"

  Scenario: Dodaj nowy produkt
    When klika "Dodaj produkt"
    And wypełnia nazwę "Laptop Pro"
    And ustawia cenę "2999.00"
    And klika "Zapisz"
    Then produkt "Laptop Pro" pojawia się na liście
    And widzi komunikat "Produkt został dodany"

  Scenario: Usuń istniejący produkt
    Given produkt "Stary Laptop" istnieje na liście
    When klika ikonę usuwania przy "Stary Laptop"
    And potwierdza usunięcie w dialogu
    Then produkt "Stary Laptop" znika z listy
    And widzi komunikat "Produkt został usunięty"

  Scenario: Edytuj cenę produktu
    Given produkt "Laptop Pro" istnieje na liście
    When klika "Edytuj" przy "Laptop Pro"
    And zmienia cenę na "2499.00"
    And klika "Zapisz"
    Then cena "Laptop Pro" wyświetla się jako "2499.00"
