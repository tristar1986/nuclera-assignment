import { BasePage } from "./BasePage";
import { expect, Locator, Page } from '@playwright/test';
import { ProjectsPage } from "./ProjectsPage";
import { User } from "../DataObjects/User";

export class LoginPage extends BasePage {
    usernameLabel: Locator;
    usernameInput: Locator;

    passwordLabel: Locator;
    passwordInput: Locator;

    signInButton: Locator;

    headingLoc: Locator;

    constructor(page: Page) {
        super(page, undefined, false);
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

    async signIn(user: User) {
        console.log(`Signing in with username: ${user.username}`);
        await this.usernameInput.fill(user.username);
        await this.passwordInput.fill(user.password);
        await this.signInButton.click();
        let projectsPage = new ProjectsPage(this.page, user);
        await projectsPage.locatorsAreVisible();
        return projectsPage;
    }
}