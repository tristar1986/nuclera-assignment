import {Page} from "@playwright/test";
import { LoginPage } from "./PageObjects/LoginPage";
import { UsersPage } from "./PageObjects/UsersPage";
import { BasePage } from "./PageObjects/BasePage";
import { ProjectsPage } from "./PageObjects/ProjectsPage";

if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
}
export const adminPassword = process.env.ADMIN_PASSWORD;  

export function generate_random_string(length: number = 10): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
export async function login_as_admin(page: Page) {
    let loginPage = await (new LoginPage(page)).goto();
    return await loginPage.signIn("admin", adminPassword);
}

export async function gotoUsersPage(basePage: BasePage) {
    await basePage.usersLink.click();
    return new UsersPage(basePage.page);
}

export async function gotoProjectsPage(basePage: BasePage) {
    await basePage.projectsLink.click();
    return new ProjectsPage(basePage.page);
}