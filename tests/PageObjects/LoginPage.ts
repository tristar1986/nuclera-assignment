import { BasePage } from "./BasePage";
import { expect, Locator, Page } from '@playwright/test';
import { ProjectsPage } from "./ProjectsPage";

export class LoginPage extends BasePage {
    usernameLabel: Locator;
    usernameInput: Locator;

    passwordLabel: Locator;
    passwordInput: Locator;

    signInButton: Locator;

    headingLoc: Locator;

    constructor(page: Page) {
        super(page, false);
        this.page.getByLabel("Username")
        this.usernameInput = this.page.getByTestId('login-username');

        this.page.getByLabel("Password")
        this.passwordInput = this.page.getByTestId('login-password');
        
        this.signInButton = this.page.getByRole("button", { name: "Sign in" });
        this.headingLoc = this.page.getByRole('heading', { name: this.title });
        this.usernameLabel = this.page.getByLabel("Username");
        this.passwordLabel = this.page.getByLabel("Password");

        this.visibleLocators = [this.headingLoc, this.usernameLabel, this.usernameInput, this.passwordLabel, this.passwordInput, this.signInButton];
    }

    async goto() {
        await this.page.goto('/');
        expect(this.page).toHaveTitle(this.title);
        await this.locatorsAreVisible();
        return this;
    }

    async signIn(username: string, password: string) {
        console.log(`Signing in with username: ${username}`);
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        return new ProjectsPage(this.page);
    }
}