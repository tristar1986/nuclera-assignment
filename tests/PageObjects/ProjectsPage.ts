import { BasePage } from "./BasePage";
import { LoginPage } from "./LoginPage";
import { expect, Locator, Page } from '@playwright/test';

export class ProjectsPage extends BasePage {
    logoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.logoutButton = this.page.getByRole('button', { name: 'Logout' });
    }

    async logout() {
        await this.logoutButton.click();
        let loginPage = new LoginPage(this.page);
        await loginPage.locatorsAreVisible();
        return loginPage;
    }
}