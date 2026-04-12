import test, { expect } from "@playwright/test";
import { generate_random_string, goBackToProjects, gotoProjectsPage, gotoUsersPage, login, loginAsAdmin, logout } from "./helpers";
import { User, UserRole } from "./DataObjects/User";
import { Project, ProjectStatus } from "./DataObjects/Project";
import { ProjectPage } from "./PageObjects/ProjectPage";

test.describe("Permissions Tests", () => {
    let regularUser: User;
    let adminUser: User;    
    let project: Project;
    let projectLink: string;

    test.beforeEach(async ({ page }) => {
        regularUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        project = new Project(generate_random_string(), ProjectStatus.completed, new Date().toISOString());
        let projectsPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(regularUser);
        await usersPage.createUser(adminUser);
        projectsPage = await gotoProjectsPage(usersPage);
        await projectsPage.createProject(project);
        projectLink = await projectsPage.getProjectLink(project);
        await logout(usersPage);
    });

    test("user cannot access users page", async ({ page }) => {
        let loginPage = await login(page, regularUser);
        await expect(loginPage.usersLink).toBeHidden();
    });

    test("regular user cannot delete project they are a member of", async ({ page }) => {
        let projectsPage = await loginAsAdmin(page);
        const projectPage = await projectsPage.gotoProject(project);
        await projectPage.addMemberToProject(regularUser);
        projectsPage = await goBackToProjects(projectPage);
        await logout(projectsPage);

        projectsPage = await login(page, regularUser);
        await projectsPage.waitForProjectToAppear(project);
        expect(await projectsPage.getProjectDeletionButton(project)).toBeHidden();  
    });

    test("regular user cannot access project they are not a member of", async ({ page }) => {
        let projectsPage = await login(page, regularUser);
        expect(await projectsPage.getProjectFromTable(project)).toBeUndefined();
    });

    test("admin can view all projects even if not a member", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        await projectsPage.waitForProjectToAppear(project);
        await projectsPage.gotoProject(project);
    });

    test("admin can delete project even if not a member", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        await projectsPage.waitForProjectToAppear(project);
        await projectsPage.deleteProject(project);
        await projectsPage.waitForProjectNotInList(project);
    });
});


// This should be fixed
test.describe.fixme("Project Access Tests", () => {
    let regularUser: User;
    let adminUser: User;    
    let project: Project;
    let projectLink: string;

    test.beforeEach(async ({ page }) => {
        regularUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        project = new Project(generate_random_string(), ProjectStatus.completed, new Date().toISOString());
        let projectsPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(regularUser);
        await usersPage.createUser(adminUser);
        projectsPage = await gotoProjectsPage(usersPage);
        await projectsPage.createProject(project);
        projectLink = await projectsPage.getProjectLink(project);
        await logout(usersPage);
    });

    test("user cannot see projects they are not a member of", async ({ page }) => {
        let projectsPage = await login(page, regularUser);
        expect(await projectsPage.getProjectFromTable(project)).toBeUndefined();       
        await page.goto(projectLink);
        let projectPage = new ProjectPage(page);
        await projectPage.projectNotFound();
    });
});