import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './PageObjects/LoginPage';
import { UsersPage } from './PageObjects/UsersPage';
import { ProjectsPage } from './PageObjects/ProjectsPage';
import { generate_random_string, login_as_admin, gotoProjectsPage, gotoUsersPage, adminPassword } from './helpers';
import { User, UserRole } from './DataObjects/User';
import { log } from 'node:console';

// TODO: Change to use generated admin
test("admin can login successfully", async ({ page }) => {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    let projectPage = await loginPage.signIn("admin", adminPassword);
    await projectPage.locatorsAreVisible();
});

test("incorrect simple password does not login", async ({ page }) => {
    await expectFailLogin(page, generate_random_string(10));
});

test("regular user can login successfully", async ({ page }) => {
    let newUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
    await expectSuccessfulLogin(page, newUser);
});

test("login with utf-8 characters in password successfully", async ({ page }) => {
    let newUser = new User(generate_random_string(), generate_random_string() + "αβγ", UserRole.Regular);
    await expectSuccessfulLogin(page, newUser);
});

test("login with whitespace in password successfully", async ({ page }) => {
    let newUser = new User(generate_random_string(), generate_random_string() + "  " + generate_random_string(), UserRole.Regular);
    await expectSuccessfulLogin(page, newUser);
});

test("root page redirects to login when not authenticated", async ({ page }) => {
    await page.goto('/');
    let loginPage = new LoginPage(page);
    await loginPage.locatorsAreVisible();
});

test("password characters are obfuscated", async ({ page }) => {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill(generate_random_string());
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
    expect(loginPage.passwordInput).toHaveText("");
});

test("username field is mandatory", async ({ page }) => {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill(generate_random_string());
    await expect(loginPage.usernameInput).toHaveAttribute("required");
    await loginPage.signInButton.click();
    await loginPage.locatorsAreVisible();
});

test("password field is mandatory", async ({ page }) => {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.fill(generate_random_string());
    await expect(loginPage.passwordInput).toHaveAttribute("required");
    await loginPage.signInButton.click();
    await loginPage.locatorsAreVisible();
});

async function expectFailLogin(page: Page, password: string) {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn("admin", password);
    
    // TODO: There is an error message that appears very briefly but dissapears which could make the test flaky if we checked for it.
    // Ensure we are still on the login page
    await loginPage.locatorsAreVisible();
    // await expect(loginPage.errorMessage).toBeVisible();
    // await expect(loginPage.errorMessage).toHaveText("Invalid username or password");
}

async function expectSuccessfulLogin(page: Page, user: User) {
    let usersPage = await gotoUsersPage((await login_as_admin(page)));
    await usersPage.createUser(user);
    let loginPage = await (await gotoProjectsPage(usersPage)).logout();

    let projectPage = await loginPage.signIn(user.username, user.password);
    await projectPage.locatorsAreVisible();
}
