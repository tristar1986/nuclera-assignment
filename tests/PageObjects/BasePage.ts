import { expect, Locator, Page } from "@playwright/test";
import { User, UserRole } from "../DataObjects/User";

export class BasePage {
    title: string = "ProjectHub";
    page: Page;
    visibleLocators: Locator[] = [];
    loggedInUser?: User;

    hasNavigationBar: boolean;
    usersLink: Locator;
    projectsLink: Locator;
    synchroniseLink: Locator;
    toast: Locator;

    // Timeouts for modal/toasts visibility
    modalHiddenTimeout: number = 2000;
    toastHiddenTimeout: number = 6000;
    toastVisibleTimeout: number = 1000;

    constructor(page: Page, loggedInUser?: User, hasNavigationBar: boolean = true) {
        this.page = page;
        this.hasNavigationBar = hasNavigationBar;
        this.loggedInUser = loggedInUser;
        this.usersLink = this.page.getByRole('link', { name: 'Users' });
        this.projectsLink = this.page.getByRole('link', { name: 'Projects' });
        this.synchroniseLink = this.page.getByRole('link', { name: 'Synchronise' });
        this.toast = this.page.getByTestId('toast');
    }

    async locatorsAreVisible() {
        for (const locator of this.visibleLocators) {
            await expect(locator).toBeVisible();
        }

        if (this.hasNavigationBar) {
            if (this.loggedInUser && this.loggedInUser.role !== UserRole.Regular) {
                await expect(this.usersLink).toBeVisible(); 
            }

            await expect(this.projectsLink).toBeVisible();
            await expect(this.synchroniseLink).toBeVisible();
        }
    }
}