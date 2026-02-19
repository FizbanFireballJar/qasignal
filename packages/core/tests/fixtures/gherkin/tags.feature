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
