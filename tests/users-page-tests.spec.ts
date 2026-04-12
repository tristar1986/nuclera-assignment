import { test, expect, Page } from '@playwright/test';
import { LoginPage } from './PageObjects/LoginPage';
import { NewUserModal, UsersPage } from './PageObjects/UsersPage';
import { generate_random_string, loginAsAdmin, gotoProjectsPage, gotoUsersPage, adminPassword, loginAsAdminAndCreateUser, logout, login } from './helpers';
import { User, UserRole } from './DataObjects/User';

test.describe("Users Page Tests", () => {
    let newUser: User;
    let adminUser: User;
    let usersPage: UsersPage;

    test.beforeEach(async ({ page }) => {
        newUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        let projectPage = await loginAsAdmin(page);
        usersPage = await gotoUsersPage(projectPage);
    });

    test("create regular user as admin", async ({ page }) => { 
        await usersPage.createUser(newUser);
        await usersPage.toast.waitFor({ state: 'hidden', timeout: usersPage.toastHiddenTimeout });
        expect(await usersPage.isUserInTable(newUser)).toBe(true);
    });

    test

    test("create user with utf-8 characters in password successfully", async ({ page }) => {
        newUser = new User(generate_random_string(), generate_random_string() + "αβγ", UserRole.Regular);
        await usersPage.createUser(newUser);
        expect(await usersPage.isUserInTable(newUser)).toBe(true);
    });

    test("create user with same username", async ({ page }) => {
        let user2 = new User(newUser.username, generate_random_string(), UserRole.Regular);
        await usersPage.createUser(newUser);
        expect(await usersPage.isUserInTable(newUser)).toBe(true);
        await expect(usersPage.createUser(user2)).rejects.toThrow();
        await usersPage.expectUserAlreadyExistsError();
    });

    test("create user with different cased username", async ({ page }) => {
        let username = generate_random_string();
        let user2 = new User(username.toUpperCase(), generate_random_string(), UserRole.Regular);
        await usersPage.createUser(newUser);
        expect(await usersPage.isUserInTable(newUser)).toBe(true);
        await usersPage.createUser(user2);
        expect(await usersPage.isUserInTable(user2)).toBe(true);
    });

    test("username field is mandatory when creating user", async ({ page }) => {
        await usersPage.createUser(newUser);
        usersPage.newUserButton.click();
        const newUserModal = new NewUserModal(page);
        await newUserModal.locatorsAreVisible();
        await newUserModal.passwordInput.fill(generate_random_string());
        await expect(newUserModal.usernameInput).toHaveAttribute("required");
        await newUserModal.createButton.click();
        await newUserModal.locatorsAreVisible();
    });

    test("password field is mandatory when creating user", async ({ page }) => {
        await usersPage.newUserButton.click();
        const newUserModal = new NewUserModal(page);
        await newUserModal.locatorsAreVisible();
        await newUserModal.usernameInput.fill(generate_random_string());
        await expect(newUserModal.passwordInput).toHaveAttribute("required");
        await newUserModal.createButton.click();
        await newUserModal.locatorsAreVisible();
    });

    test("cancel creating user", async ({ page }) => {
        await usersPage.newUserButton.click();
        const newUserModal = new NewUserModal(page);
        await newUserModal.locatorsAreVisible();
        await newUserModal.fillForm(newUser);
        await newUserModal.cancelButton.click();
        await newUserModal.modal.waitFor({ state: 'hidden', timeout: newUserModal.modalHiddenTimeout });
        await usersPage.locatorsAreVisible();
        await expect(usersPage.userTable.getByTestId('user-username').filter({ hasText: newUser.username })).toHaveCount(0);
    });

    test("unfocus create user modal cancel creation", async ({ page }) => {
        await usersPage.newUserButton.click();
        const newUserModal = new NewUserModal(page);
        await newUserModal.locatorsAreVisible();
        await newUserModal.fillForm(newUser);
        await page.mouse.click(0, 0);
        await newUserModal.modal.waitFor({ state: 'hidden', timeout: newUserModal.modalHiddenTimeout });
        await usersPage.locatorsAreVisible();
        await expect(usersPage.userTable.getByTestId('user-username').filter({ hasText: newUser.username })).toHaveCount(0);
    });

   test("delete user", async ({ page }) => {
        await usersPage.createUser(newUser);
        expect(await usersPage.isUserInTable(newUser)).toBe(true);
        await usersPage.deleteUser(newUser);
        await usersPage.toast.waitFor({ state: 'hidden', timeout: usersPage.toastHiddenTimeout });
        expect(await usersPage.isUserInTable(newUser)).toBe(false);
    });

    test("delete admin user", async ({ page }) => {
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        await usersPage.createUser(adminUser);
        expect(await usersPage.isUserInTable(adminUser)).toBe(true);
        await usersPage.deleteUser(adminUser);
        expect(await usersPage.isUserInTable(adminUser)).toBe(false);     
    });

    test("delete own user", async ({ page }) => {
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        await usersPage.createUser(adminUser);
        await logout(usersPage);
        let projectsPage = await login(page, adminUser);
        usersPage = await gotoUsersPage(projectsPage);
        expect(await usersPage.isDeleteUserDisabled(adminUser)).toBe(true);
    });
});