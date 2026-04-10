import { test, expect } from '@playwright/test';
import { LoginPage } from './PageObjects/LoginPage';
import { generate_random_string, expectFailLogin, expectSuccessfulLogin, gotoUsersPage, loginAsAdmin, gotoProjectsPage, logout } from './helpers';
import { User, UserRole } from './DataObjects/User';

test.describe("Login Page Tests", () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {        
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test("admin can login successfully", async ({ page }) => {
        let adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        await expectSuccessfulLogin(page, adminUser);
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
        await loginPage.passwordInput.fill(generate_random_string());
        await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
        await expect(loginPage.passwordInput).toHaveText("");
    });

    test("username field is mandatory", async ({ page }) => {
        await loginPage.passwordInput.fill(generate_random_string());
        await expect(loginPage.usernameInput).toHaveAttribute("required");
        await loginPage.signInButton.click();
        await loginPage.locatorsAreVisible();
    });

    test("password field is mandatory", async ({ page }) => {
        await loginPage.usernameInput.fill(generate_random_string());
        await expect(loginPage.passwordInput).toHaveAttribute("required");
        await loginPage.signInButton.click();
        await loginPage.locatorsAreVisible();
    });

    test("deleted user cannot login", async ({ page }) => {
        let newUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        let projectPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectPage);
        await usersPage.createUser(newUser);
        await usersPage.deleteUser(newUser);
        
        await logout(projectPage);
        await expectFailLogin(page, newUser.password);
    });
});
