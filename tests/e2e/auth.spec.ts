import { expect, test } from '@playwright/test'

const LECTURER_EMAIL = 'lecturer@grasp.demo'
const STUDENT_EMAIL = 'student.a@grasp.demo'
const PASSWORD = 'GraspDemo2026!'

test.describe('authentication', () => {
  test('unauthenticated root redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated /lecturer/courses redirects to /login', async ({ page }) => {
    await page.goto('/lecturer/courses')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated /student redirects to /login', async ({ page }) => {
    await page.goto('/student')
    await expect(page).toHaveURL('/login')
  })

  test('login page renders form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel(/[Mm]ật khẩu/)).toBeVisible()
    await expect(page.getByRole('button', { name: /[Đđ]ăng nhập/i })).toBeVisible()
  })

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'bad@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('lecturer login redirects to /lecturer/courses', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', LECTURER_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/lecturer/courses')
  })

  test('student login redirects to /student', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', STUDENT_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/student')
  })

  test('lecturer cannot access /student', async ({ page }) => {
    // Login as lecturer
    await page.goto('/login')
    await page.fill('input[name="email"]', LECTURER_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/lecturer/courses')
    // Try to navigate to student area
    await page.goto('/student')
    await expect(page).not.toHaveURL('/student')
  })

  test('student cannot access /lecturer/courses', async ({ page }) => {
    // Login as student
    await page.goto('/login')
    await page.fill('input[name="email"]', STUDENT_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/student')
    // Try lecturer area
    await page.goto('/lecturer/courses')
    await expect(page).not.toHaveURL('/lecturer/courses')
  })
})
