import { test, expect } from '@playwright/test'

test.describe('Logowanie', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('poprawne logowanie -> dashboard', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'Password123!')
    await page.click('[data-testid="submit"]')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="welcome"]')).toContainText('Witaj')
  })

  test('błędne hasło -> komunikat błędu', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'user@example.com')
    await page.fill('[data-testid="password"]', 'złehasło')
    await page.click('[data-testid="submit"]')
    await expect(page.locator('[data-testid="error"]')).toContainText('Nieprawidłowe')
    await expect(page).toHaveURL('/login')
  })

  test('pusty formularz -> błędy walidacji', async ({ page }) => {
    await page.click('[data-testid="submit"]')
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })
})
