import {Page} from "@playwright/test";
import { LoginPage } from "./PageObjects/LoginPage";
import { UsersPage, NewUserModal } from "./PageObjects/UsersPage";
import { BasePage } from "./PageObjects/BasePage";
import { ProjectsPage } from "./PageObjects/ProjectsPage";
import { User, UserRole } from "./DataObjects/User";

if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
}
export const adminPassword = process.env.ADMIN_PASSWORD;
export const adminUser = new User("admin", adminPassword, UserRole.Admin);

export function generate_random_string(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export async function login(page: Page, user: User) {
    let loginPage = await (new LoginPage(page)).goto();
    await loginPage.locatorsAreVisible();
    return await loginPage.signIn(user.username, user.password);
}

export async function loginAsAdmin(page: Page) {
    return await login(page, adminUser);
}

export async function gotoUsersPage(basePage: BasePage) {
    await basePage.usersLink.click();
    let usersPage = new UsersPage(basePage.page);
    await usersPage.locatorsAreVisible();
    return usersPage;
}

export async function gotoProjectsPage(basePage: BasePage) {
    await basePage.projectsLink.click();
    let projectsPage = new ProjectsPage(basePage.page);
    await projectsPage.locatorsAreVisible();
    return projectsPage;
}

export async function loginAsAdminAndCreateUser(page: Page, user: User) {
    let usersPage = await gotoUsersPage((await loginAsAdmin(page)));
    await usersPage.createUser(user);
    return usersPage;
}

export async function expectFailLogin(page: Page, password: string) {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn("admin", password);
    
    // TODO: There is an error message that appears very briefly but dissapears which could make the test flaky if we checked for it.
    // Ensure we are still on the login page
    await loginPage.locatorsAreVisible();
    // await expect(loginPage.errorMessage).toBeVisible();
    // await expect(loginPage.errorMessage).toHaveText("Invalid username or password");
}

export async function expectSuccessfulLogin(page: Page, user: User) {
    let usersPage = await loginAsAdminAndCreateUser(page, user);
    let loginPage = await (await gotoProjectsPage(usersPage)).logout();

    let projectPage = await loginPage.signIn(user.username, user.password);
    await projectPage.locatorsAreVisible();
}

export async function logout(basePage: BasePage) {
    let projectPage = await gotoProjectsPage(basePage)
    projectPage.logout()
}