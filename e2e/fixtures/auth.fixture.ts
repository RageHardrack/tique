import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('daniel@lascar.dev', 'admin123456');
    await use(page);
  },
});

export { expect } from '@playwright/test';
