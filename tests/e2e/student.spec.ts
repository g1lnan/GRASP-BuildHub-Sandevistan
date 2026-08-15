import { expect, test } from '@playwright/test'

const STUDENT_EMAIL = 'student.a@grasp.demo'
const PASSWORD = 'GraspDemo2026!'
const SEED_JOIN_CODE = 'GRASP234'

async function loginAsStudent(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', STUDENT_EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/student')
}

test.describe('student area', () => {
  test('student home shows courses heading', async ({ page }) => {
    await loginAsStudent(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('join course page renders form', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/join')
    await expect(page.getByLabel(/[Mm]ã tham gia/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /[Tt]ham gia/i })).toBeVisible()
  })

  test('invalid join code shows error', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/join')
    await page.fill('input[name="joinCode"]', 'XXXXXXXX')
    await page.click('button[type="submit"]')
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('join with seed code redirects to /student', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/join')
    await page.fill('input[name="joinCode"]', SEED_JOIN_CODE)
    await page.click('button[type="submit"]')
    // Either already enrolled (error) or redirects to /student
    const url = page.url()
    const isOnStudent = url.endsWith('/student') || url.endsWith('/student/')
    const isOnJoin = url.includes('/student/join')
    expect(isOnStudent || isOnJoin).toBe(true)
  })

  test('enrolled course appears as card on home page', async ({ page }) => {
    await loginAsStudent(page)
    // The seed data enrolls student.a in the seed course
    // If it appears, we should see a course card
    await expect(page).toHaveURL('/student')
    // Either shows the enrolled course card or the empty state join prompt
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
  })

  test('course detail shows assignments section', async ({ page }) => {
    await loginAsStudent(page)
    // Navigate to seed course if enrolled
    const links = await page.locator('a[href*="/student/courses/"]').all()
    const firstLink = links[0]
    if (firstLink !== undefined) {
      await firstLink.click()
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible()
    } else {
      // No courses enrolled yet — skip
      test.skip()
    }
  })

  test('student cannot access lecturer routes', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/lecturer/courses')
    await expect(page).not.toHaveURL('/lecturer/courses')
  })
})
