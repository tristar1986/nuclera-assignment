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
        expect(await projectsPage.waitForProjectInTable(newProject)).toBe(true);
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

        expect(await projectsPage.waitForProjectInTable(project1)).toBe(true);
        expect(await projectsPage.waitForProjectInTable(project2)).toBe(true);
        expect(await projectsPage.waitForProjectInTable(project3)).toBe(true);
    });

    test("projects can be searched by name", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let project1 = new Project(generate_random_string(), ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'));
        let project2 = new Project(generate_random_string(), ProjectStatus.completed, format(new Date(), 'dd/MM/yyyy'));
        await projectsPage.createProject(project1);
        await projectsPage.createProject(project2);

        await projectsPage.inputSearch(project1.name);
        expect(await projectsPage.waitForProjectInTable(project1)).toBe(true);
        expect(await projectsPage.waitForProjectNotInTable(project2)).toBe(true);

        console.log("clear search returns all projects");
        await projectsPage.searchInput.clear();

        // cant check for all projects here as other tests may have created projects that are still present, but can check that the two created in this test are visible
        expect(await projectsPage.waitForProjectInTable(project1)).toBe(true);
        expect(await projectsPage.waitForProjectInTable(project2)).toBe(true);
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
        expect(await projectsPage.waitForProjectInTable(project1)).toBe(true);
        expect(await projectsPage.waitForProjectNotInTable(project2)).toBe(true);
        expect(await projectsPage.waitForProjectNotInTable(project3)).toBe(true);

    });

    test("projects can be filters by description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let searchTerm1 = generate_random_string();
        let searchTerm2 = generate_random_string();
        await projectsPage.createProject(newProject);

        await projectsPage.inputSearch(newProject.description);
        expect(await projectsPage.waitForProjectInTable(newProject)).toBe(true);

        await projectsPage.inputSearch(generate_random_string());
        expect(await projectsPage.waitForProjectNotInTable(newProject)).toBe(true);
    });

    test("projects can be searched by individual words in description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.createProject(newProject);
        
        await projectsPage.inputSearch(searchTerm1);
        expect(await projectsPage.waitForProjectInTable(newProject)).toBe(true);
    });

    test("projects cannot be searched by multiple words in description", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        let searchTerm1 = generate_random_string();
        let searchTerm2 = generate_random_string();
        await projectsPage.createProject(newProject);
        
        await projectsPage.inputSearch(`${searchTerm1} ${searchTerm2}`);
        expect(await projectsPage.waitForProjectNotInTable(newProject)).toBe(true);
    });

    test("projects can be deleted", async ({ page }) => {
        let projectsPage = await login(page, adminUser);        
        await projectsPage.createProject(newProject);
        let projectLink = await projectsPage.getProjectLink(newProject);
        expect(projectLink).toBeTruthy();
        await projectsPage.deleteProject(newProject);
        expect(await projectsPage.isProjectInTable(newProject)).toBe(false);
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
        expect(await projectsPage.isProjectInTable(newProject)).toBe(false);
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
        expect(await projectsPage.isProjectInTable(newProject)).toBe(false);
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
        expect(await projectsPage.isProjectInTable(newProject)).toBe(true);
    });
});