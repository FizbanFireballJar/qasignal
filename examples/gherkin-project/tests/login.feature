Feature: Logowanie

  Background:
    Given aplikacja jest uruchomiona

  Scenario: Poprawne logowanie
    Given użytkownik jest na stronie logowania
    When wpisuje email "user@example.com"
    And wpisuje hasło "Password123!"
    And klika "Zaloguj"
    Then widzi dashboard
    And widzi "Witaj, user!"

  Scenario: Błędne hasło
    Given użytkownik jest na stronie logowania
    When wpisuje email "user@example.com"
    And wpisuje hasło "złehasło"
    And klika "Zaloguj"
    Then widzi błąd "Nieprawidłowe dane logowania"
    And pozostaje na stronie logowania

  Scenario Outline: Walidacja pól
    Given użytkownik jest na stronie logowania
    When wpisuje email "<email>"
    And wpisuje hasło "<hasło>"
    And klika "Zaloguj"
    Then widzi błąd walidacji "<błąd>"

    Examples:
      | email         | hasło | błąd                     |
      | nie-email     | abc   | Niepoprawny format email  |
      | user@test.com |       | Hasło jest wymagane       |
      |               | pass  | Email jest wymagany       |
