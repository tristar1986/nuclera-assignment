import {expect, Page} from "@playwright/test";
import { LoginPage } from "./PageObjects/LoginPage";
import { UsersPage, NewUserModal } from "./PageObjects/UsersPage";
import { BasePage } from "./PageObjects/BasePage";
import { ProjectsPage } from "./PageObjects/ProjectsPage";
import { User, UserRole } from "./DataObjects/User";
import { Project, ProjectStatus } from "./DataObjects/Project";
import { Item, ItemStatus } from "./DataObjects/Item";
import { ProjectPage } from "./PageObjects/ProjectPage";

if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
}
export const adminPassword = process.env.ADMIN_PASSWORD;
export const originalAdminUser = new User("admin", adminPassword, UserRole.Admin);

export function generate_random_string(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export async function login(page: Page, user: User): Promise<ProjectsPage> {
    let loginPage = await (new LoginPage(page)).goto();
    await loginPage.locatorsAreVisible();
    return await loginPage.signIn(user);
}

export async function loginAsAdmin(page: Page): Promise<ProjectsPage> {
    return await login(page, originalAdminUser);
}

export async function gotoUsersPage(basePage: BasePage): Promise<UsersPage> {
    await basePage.usersLink.click();
    let usersPage = new UsersPage(basePage.page);
    await usersPage.locatorsAreVisible();
    return usersPage;
}

export async function gotoProjectsPage(basePage: BasePage): Promise<ProjectsPage> {
    await basePage.projectsLink.click();
    let projectsPage = new ProjectsPage(basePage.page);
    await projectsPage.locatorsAreVisible();
    return projectsPage;
}

export async function loginAsAdminAndCreateUser(page: Page, user: User): Promise<UsersPage> {
    let usersPage = await gotoUsersPage((await loginAsAdmin(page)));
    await usersPage.createUser(user);
    return usersPage;
}

export async function expectFailLogin(page: Page, user: User) {
    let loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(loginPage.signIn(user)).rejects.toThrow();
    
    // TODO: There is an error message that appears very briefly but dissapears which could make the test flaky if we checked for it.
    // Ensure we are still on the login page
    await loginPage.locatorsAreVisible();
    // await expect(loginPage.errorMessage).toBeVisible();
    // await expect(loginPage.errorMessage).toHaveText("Invalid username or password");
}

export async function expectSuccessfulLogin(page: Page, user: User) {
    let usersPage = await loginAsAdminAndCreateUser(page, user);
    let loginPage = await (await gotoProjectsPage(usersPage)).logout();

    let projectPage = await loginPage.signIn(user);
    await projectPage.locatorsAreVisible();
}

export async function logout(basePage: BasePage) {
    let projectPage = await gotoProjectsPage(basePage)
    await projectPage.logout()
}

export async function createProjectWithItem(projectsPage: ProjectsPage, project: Project, item: Item) {
    await projectsPage.createProject(project);
    let projectPage = await projectsPage.gotoProject(project);
    await projectPage.addItemToProject(item);
    await projectPage.waitForItemInList(item);
    return projectPage;
}

export async function createProjectWithMember(projectsPage: ProjectsPage, project: Project, user: User) {
    await projectsPage.createProject(project);
    let projectPage = await projectsPage.gotoProject(project);
    await projectPage.addMemberToProject(user);
    await projectPage.waitForMemberInList(user);
    return projectPage;
}

export async function goBackToProjects(projectPage: ProjectPage) {
    await projectPage.backToProjectsLink.click();
    let projectsPage = new ProjectsPage(projectPage.page);
    await projectsPage.locatorsAreVisible();
    return projectsPage;
}