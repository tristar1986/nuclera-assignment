import { expect, Locator, Page } from "@playwright/test";

export class BasePage {
    title: string = "ProjectHub";
    page: Page;
    visibleLocators: Locator[] = [];

    hasNavigationBar: boolean;
    usersLink: Locator;
    projectsLink: Locator;
    synchroniseLink: Locator;

    constructor(page: Page, hasNavigationBar: boolean = true) {
        this.page = page;
        this.hasNavigationBar = hasNavigationBar;
        this.usersLink = this.page.getByRole('link', { name: 'Users' });
        this.projectsLink = this.page.getByRole('link', { name: 'Projects' });
        this.synchroniseLink = this.page.getByRole('link', { name: 'Synchronise' });
    }

    async locatorsAreVisible() {
        for (const locator of this.visibleLocators) {
            await expect(locator).toBeVisible();
        }

        if (this.hasNavigationBar) {
            await this.usersLink.isVisible();
            await this.projectsLink.isVisible();
            await this.synchroniseLink.isVisible();
        }
    }
}