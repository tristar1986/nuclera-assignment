import test, { expect } from "@playwright/test";
import { format } from 'date-fns';
import { User, UserRole } from "./DataObjects/User";
import { UsersPage } from "./PageObjects/UsersPage";
import { generate_random_string, gotoUsersPage, login, loginAsAdmin, logout } from "./helpers";
import { ProjectStatus, Project } from "./DataObjects/Project";
import { ProjectPage } from "./PageObjects/ProjectPage";
import { ProjectsPage, NewProjectModal } from "./PageObjects/ProjectsPage";

test.describe("Projects Page Tests", () => {
    let adminUser: User;
    let newProject: Project;
    let searchTerm1: string;
    let searchTerm2: string;

    test.beforeEach(async ({ page }) => {
        searchTerm1 = generate_random_string();
        searchTerm2 = generate_random_string();
        newProject = new Project(generate_random_string(), ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'), `${searchTerm1} This is a test project ${searchTerm2}`);
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        let projectsPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(adminUser);
        await logout(usersPage);
    });

    test("admin can create projects", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        await projectsPage.createProject(newProject);
        await projectsPage.waitForProjectToAppear(newProject);
        let foundProject = await projectsPage.getProjectFromTable(newProject);
        compareProjects(newProject, foundProject!);
    });

    test("all projects are visible with no search options selected", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let project1 = new Project(generate_random_string(), ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'));
        let project2 = new Project(generate_random_string(), ProjectStatus.completed, format(new Date(), 'dd/MM/yyyy'));
        let project3 = new Project(generate_random_string(), ProjectStatus.archived, format(new Date(), 'dd/MM/yyyy'));
        await projectsPage.createProject(project1);
        await projectsPage.createProject(project2);
        await projectsPage.createProject(project3);

        console.log("Check default search options");
        expect(await projectsPage.searchInput.inputValue()).toBe("");
        expect(await projectsPage.statusFilter.inputValue()).toBe("all");
        await projectsPage.waitForProjectToAppear(project1);
        await projectsPage.waitForProjectToAppear(project2);
        await projectsPage.waitForProjectToAppear(project3);
    });

    test("projects can be searched by name", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let project1 = new Project(generate_random_string(), ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'));
        let project2 = new Project(generate_random_string(), ProjectStatus.completed, format(new Date(), 'dd/MM/yyyy'));
        await projectsPage.createProject(project1);
        await projectsPage.createProject(project2);

        await projectsPage.inputSearch(project1.name);
        await projectsPage.waitForProjectToAppear(project1);
        await projectsPage.waitForProjectNotInList(project2);

        console.log("clear search returns all projects");
        await projectsPage.searchInput.clear();

        await projectsPage.waitForProjectToAppear(project1);
        await projectsPage.waitForProjectToAppear(project2);
    });

    test("projects can be filtered by status", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let project1 = new Project(generate_random_string(), ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'));
        let project2 = new Project(generate_random_string(), ProjectStatus.completed, format(new Date(), 'dd/MM/yyyy'));
        let project3 = new Project(generate_random_string(), ProjectStatus.archived, format(new Date(), 'dd/MM/yyyy'));
        await projectsPage.createProject(project1);
        await projectsPage.createProject(project2);
        await projectsPage.createProject(project3);

        await projectsPage.statusFilter.selectOption(ProjectStatus.active);
        await projectsPage.locatorsAreVisible();
        await projectsPage.waitForProjectToAppear(project1);
        await projectsPage.waitForProjectNotInList(project2);
        await projectsPage.waitForProjectNotInList(project3);
    });

    test("projects can be filtered by description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.createProject(newProject);

        await projectsPage.inputSearch(newProject.description);
        `await projectsPage.waitForProjectToAppear(newProject);`

        await projectsPage.inputSearch(generate_random_string());
        await projectsPage.waitForProjectNotInList(newProject);
    });

    test("projects can be searched by individual words in description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.createProject(newProject);
        
        await projectsPage.inputSearch(searchTerm1);
        await projectsPage.waitForProjectToAppear(newProject);

        await projectsPage.inputSearch(searchTerm2);
        await projectsPage.waitForProjectToAppear(newProject);
    });

    test("projects cannot be searched by multiple words in description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let searchTerm1 = generate_random_string();
        let searchTerm2 = generate_random_string();
        await projectsPage.createProject(newProject);
        
        await projectsPage.inputSearch(`${searchTerm1} ${searchTerm2}`);
        await projectsPage.waitForProjectNotInList(newProject);
    });

    test("projects can be deleted", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.createProject(newProject);
        let projectLink = await projectsPage.getProjectLink(newProject);
        expect(projectLink).toBeTruthy();
        await projectsPage.deleteProject(newProject);
        let foundProject = await projectsPage.getProjectFromTable(newProject);
        expect(foundProject).toBeUndefined();
        // This will always be true given the above assertion
        if (projectLink) {
            await page.goto(projectLink);
            let projectPage = new ProjectPage(page);
            await projectPage.projectNotFound();
        }
    });

    test("cancel project creation does not create it", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.newProjectButton.click();
        const newProjectModal = new NewProjectModal(page);
        await newProjectModal.locatorsAreVisible();
        await newProjectModal.fillForm(newProject);
        await newProjectModal.cancelButton.click();
        await newProjectModal.modal.waitFor({ state: 'hidden', timeout: newProjectModal.modalHiddenTimeout });
        await projectsPage.locatorsAreVisible();
        let foundProject = await projectsPage.getProjectFromTable(newProject);
        expect(foundProject).toBeUndefined();
    });

    test("unfocus project modal cancels creation", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.newProjectButton.click();
        const newProjectModal = new NewProjectModal(page);
        await newProjectModal.locatorsAreVisible();
        await newProjectModal.fillForm(newProject);
        await page.mouse.click(0, 0);
        await newProjectModal.modal.waitFor({ state: 'hidden', timeout: newProjectModal.modalHiddenTimeout });
        await projectsPage.locatorsAreVisible();
        let foundProject = await projectsPage.getProjectFromTable(newProject);
        expect(foundProject).toBeUndefined();
    });

    test("name field is mandatory on project creation", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.newProjectButton.click();
        const newProjectModal = new NewProjectModal(page);
        await newProjectModal.locatorsAreVisible();
        await newProjectModal.descriptionInput.fill(newProject.description);
        await newProjectModal.statusSelect.selectOption(newProject.status);
        await expect(newProjectModal.nameInput).toHaveAttribute("required");
        await newProjectModal.createButton.click();
        await newProjectModal.locatorsAreVisible();
    });

    test("description field is optional on project creation", async ({ page }) => {
        newProject.description = "";
        let projectsPage = await login(page, adminUser);
        await projectsPage.createProject(newProject);
        let foundProject = await projectsPage.getProjectFromTable(newProject);
        expect(foundProject).toBeTruthy();
        compareProjects(newProject, foundProject!);
    });
});

function compareProjects(expectedProject: Project, actualProject: Project) {
    expect(actualProject).toBeDefined();
    expect(actualProject?.name).toBe(expectedProject.name);
    expect(actualProject?.status.toLowerCase()).toBe(expectedProject.status.toLowerCase());
    expect(actualProject?.itemCount).toBe(expectedProject.itemCount);
}