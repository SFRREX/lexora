import { test, expect } from '@playwright/test';

test.describe('Lexora AI Suite E2E', () => {
  test('loads Lexora Studio and verifies brand and main editor', async ({ page }) => {
    await page.goto('/');

    // Verify title and main brand presence
    await expect(page).toHaveTitle(/Lexora/i);
    await expect(page.locator('text=Lexora').first()).toBeVisible();

    // Verify textarea is available for editing
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Type text into the editor
    await textarea.fill('Their is alot of misteaks in this document.');
    
    // Verify word count updates
    await expect(page.locator('text=/8 words/i').first()).toBeVisible();
  });

  test('switches across core views seamlessly', async ({ page }) => {
    await page.goto('/');

    // Switch to AI Content Detector view
    const checkerBtn = page.getByRole('button', { name: /AI Checker/i }).first();
    await expect(checkerBtn).toBeVisible();
    await checkerBtn.click();
    await expect(page.locator('h1', { hasText: 'Lexora AI Checker' })).toBeVisible();

    // Switch to Academic Refiner view
    const academicBtn = page.getByRole('button', { name: /Academic Refiner/i }).first();
    await expect(academicBtn).toBeVisible();
    await academicBtn.click();
    await expect(page.locator('h1', { hasText: 'Lexora Academic Refiner' })).toBeVisible();

    // Switch back to Studio
    const studioBtn = page.getByRole('button', { name: /Writing Studio/i }).first();
    await expect(studioBtn).toBeVisible();
    await studioBtn.click();
    await expect(page.locator('textarea').first()).toBeVisible();
  });
});
