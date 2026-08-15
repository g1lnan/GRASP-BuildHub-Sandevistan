import { expect, test } from '@playwright/test'

const LECTURER_EMAIL = 'lecturer@grasp.demo'
const PASSWORD = 'GraspDemo2026!'

test.use({ storageState: undefined })

async function loginAsLecturer(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', LECTURER_EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/lecturer/courses')
}

test.describe('lecturer console', () => {
  test('courses page shows sidebar and heading', async ({ page }) => {
    await loginAsLecturer(page)
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('can navigate to new course form', async ({ page }) => {
    await loginAsLecturer(page)
    await page.click('a[href="/lecturer/courses/new"]')
    await expect(page).toHaveURL('/lecturer/courses/new')
    await expect(page.getByLabel(/[Tt]ên học phần/i)).toBeVisible()
    await expect(page.getByLabel(/[Hh]ọc kỳ/i)).toBeVisible()
  })

  test('create course form submits and redirects to course detail', async ({ page }) => {
    await loginAsLecturer(page)
    await page.goto('/lecturer/courses/new')
    await page.fill('input[name="name"]', 'Tư duy phản biện E2E')
    await page.fill('input[name="term"]', 'HK1 2026')
    await page.click('button[type="submit"]')
    // Should redirect to /lecturer/courses/<uuid>
    await page.waitForURL(/\/lecturer\/courses\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tư duy phản biện E2E')
  })

  test('course detail shows join code and assignments section', async ({ page }) => {
    await loginAsLecturer(page)
    // Create a course first
    await page.goto('/lecturer/courses/new')
    await page.fill('input[name="name"]', 'Khóa học E2E Chi tiết')
    await page.fill('input[name="term"]', 'HK2 2026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/courses\/[0-9a-f-]+$/)
    // Verify join code visible
    await expect(page.getByText(/[A-Z0-9]{8}/)).toBeVisible()
    // Assignments heading
    await expect(page.getByRole('heading', { name: /[Bb]ài tập/i })).toBeVisible()
  })

  test('can create an assignment from course detail', async ({ page }) => {
    await loginAsLecturer(page)
    // Create course
    await page.goto('/lecturer/courses/new')
    await page.fill('input[name="name"]', 'Khóa học có bài tập')
    await page.fill('input[name="term"]', 'HK1 2026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/courses\/[0-9a-f-]+$/)

    // Go to new assignment
    await page.click(`a[href*="/assignments/new"]`)
    await page.waitForURL(/\/assignments\/new$/)

    // Fill form
    await page.fill('input[name="title"]', 'Bài tập E2E')
    await page.fill('textarea[name="prompt"]', 'Phân tích lập luận chính sách.')
    // Set dueAt — must be future datetime-local
    await page.fill('input[name="dueAt"]', '2027-01-01T12:00')
    await page.fill('textarea[name="subjectConcepts"]', 'lập luận\nbằng chứng')
    await page.fill('input[name="probeCount"]', '6')
    await page.fill('input[name="timeCapSeconds"]', '480')
    await page.fill('input[name="defenseWeightPct"]', '20')

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/assignments\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bài tập E2E')
  })

  test('publish toggle changes status pill', async ({ page }) => {
    await loginAsLecturer(page)
    // Create course + assignment quickly
    await page.goto('/lecturer/courses/new')
    await page.fill('input[name="name"]', 'Khóa publish test')
    await page.fill('input[name="term"]', 'HK1 2026')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/courses\/[0-9a-f-]+$/)

    await page.click(`a[href*="/assignments/new"]`)
    await page.waitForURL(/\/assignments\/new$/)
    await page.fill('input[name="title"]', 'Bài tập Publish')
    await page.fill('textarea[name="prompt"]', 'Nội dung bài tập.')
    await page.fill('input[name="dueAt"]', '2027-06-01T09:00')
    await page.fill('textarea[name="subjectConcepts"]', 'khái niệm')
    await page.fill('input[name="probeCount"]', '5')
    await page.fill('input[name="timeCapSeconds"]', '360')
    await page.fill('input[name="defenseWeightPct"]', '15')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/assignments\/[0-9a-f-]+$/)

    // Click publish
    await page.click('button:has-text(/[Xx]uất bản/)')
    // Status pill should change to published
    await expect(page.getByText(/[Đđ]ã xuất bản/i)).toBeVisible()
  })

  test('archive course shows archived pill', async ({ page }) => {
    await loginAsLecturer(page)
    await page.goto('/lecturer/courses/new')
    await page.fill('input[name="name"]', 'Khóa học sẽ lưu trữ')
    await page.fill('input[name="term"]', 'HK1 2025')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/lecturer\/courses\/[0-9a-f-]+$/)

    await page.click('button:has-text(/[Ll]ưu trữ/)')
    await expect(page.getByText(/[Đđ]ã lưu trữ/i)).toBeVisible()
  })
})
