import { type Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string = 'daniel@lascar.dev', password: string = 'admin123456') {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard');
  }

  async expectErrorMessage(message: string) {
    const errorAlert = this.page.locator('.text-red-400');
    await expect(errorAlert).toContainText(message);
  }
}
