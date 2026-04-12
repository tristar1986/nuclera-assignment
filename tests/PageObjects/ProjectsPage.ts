import { BasePage } from "./BasePage";
import { LoginPage } from "./LoginPage";
import { expect, Locator, Page } from '@playwright/test';
import { Project, ProjectStatus } from "../DataObjects/Project";
import { ProjectPage } from "./ProjectPage";
import { User } from "../DataObjects/User";

export class ProjectsPage extends BasePage {
    heading: Locator;
    newProjectButton: Locator;
    searchInput: Locator;
    statusFilter: Locator;
    projectsTable: Locator;
    logoutButton: Locator;

    constructor(page: Page, loggedInUser?: User) {
        super(page, loggedInUser);
        this.heading = this.page.getByRole('heading', { name: "Projects" });
        this.newProjectButton = this.page.getByRole('button', { name: 'New Project' });
        this.searchInput = this.page.getByTestId("search-input");
        this.statusFilter = this.page.getByTestId("status-filter");
        this.projectsTable = this.page.getByTestId('projects-list').getByRole('table');
        this.logoutButton = this.page.getByRole('button', { name: 'Logout' });
        this.visibleLocators = [this.heading, this.searchInput, this.statusFilter, this.logoutButton];
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
    }

    async logout() {
        await this.logoutButton.click();
        let loginPage = new LoginPage(this.page);
        await loginPage.locatorsAreVisible();
        return loginPage;
    }

    async getProjects() {
        const rows  = await this.projectsTable.getByTestId('project-row').all();
        const projects: Project[] = [];
        for (const row of rows) {
            projects.push(await this.getProjectRowData(row));
        }
        return projects;
    }

    async getProjectRowData(row: Locator) {
        const name = await row.getByTestId('project-name').innerText();
        const status = await row.getByTestId('project-status').inputValue() as ProjectStatus;
        const itemCount = await row.getByTestId('project-item-count').innerText();
        const createdAt = await row.getByRole("cell").nth(4).innerText();
        return new Project(name, status, createdAt, undefined, parseInt(itemCount, 10))
    }

    async getProjectFromTable(projectToFind: Project): Promise<Project | undefined> {
        const matchingRows = this.projectsTable
            .getByTestId('project-row')
            .filter({ hasText: this.escapeRegex(projectToFind.name) });

        if ((await matchingRows.count()) === 0) {
            return undefined;
        }

        return await this.getProjectRowData(matchingRows.first());
    }

    async createProject(project: Project) {
        console.log(`Creating project with name: ${project.name}`);
        await this.newProjectButton.click();
        const newProjectModal = new NewProjectModal(this.page);
        await newProjectModal.locatorsAreVisible();
        await newProjectModal.fillForm(project);
        await newProjectModal.createButton.click();
        await newProjectModal.modal.waitFor({ state: 'hidden', timeout: newProjectModal.modalHiddenTimeout });
        await this.locatorsAreVisible();
    }

    async deleteProject(project: Project) {
        console.log(`Deleting project with name: ${project.name}`);
        await (await this.getProjectDeletionButton(project)).click();
        const deleteProjectModal = new DeleteProjectModal(this.page, project);
        await deleteProjectModal.locatorsAreVisible();
        await deleteProjectModal.deleteProject();
        await deleteProjectModal.modal.waitFor({ state: 'hidden', timeout: deleteProjectModal.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${project.name}" deleted`);
    }

    async waitForProjectToAppear(project: Project) {
        await expect(this.projectsTable.getByTestId("project-name").filter({ hasText: project.name })).toBeVisible();
    }

    async waitForProjectNotInList(project: Project) {
        await expect(this.projectsTable.getByTestId("project-name").filter({ hasText: project.name })).toHaveCount(0);
    }

    async inputSearch(searchTerm: string) {
        console.log(`Searching projects for term: ${searchTerm}`);
        await this.searchInput.clear();
        await this.searchInput.fill(searchTerm);
    }

    async getProjectLink(project: Project) {
        await this.waitForProjectToAppear(project);
        return await this.projectsTable.getByTestId("project-name").filter({ hasText: new RegExp(project.name) }).getAttribute('href');
    }

    async gotoProject(project: Project) {
        await this.waitForProjectToAppear(project);
        expect(await this.getProjectLink(project)).toBeTruthy();
        await this.page.goto(await this.getProjectLink(project) || '');
        let projectPage =  new ProjectPage(this.page, project);
        await projectPage.locatorsAreVisible();
        return projectPage;
    }

    async getProjectDeletionButton(project: Project) {
        return await this.projectsTable.getByRole('row').filter({ hasText: new RegExp(project.name) }).getByRole('button', { name: 'Delete' });
    }

    private escapeRegex(value: string) {
        return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }
}

export class NewProjectModal extends BasePage {
    modal: Locator;
    heading: Locator;
    nameLabel: Locator;
    nameInput: Locator;
    descriptionLabel: Locator;
    descriptionInput: Locator;
    statusLabel: Locator;
    statusSelect: Locator;
    createButton: Locator;
    cancelButton: Locator;

    constructor(page: Page) {
        super(page, undefined, false);
        this.modal = this.page.getByTestId('project-modal');
        this.heading = this.modal.getByRole('heading', { name: 'New Project' });
        this.nameLabel = this.modal.getByLabel('Name');
        this.nameInput = this.modal.getByTestId('project-modal-name');
        this.descriptionLabel = this.modal.getByLabel('Description');
        this.descriptionInput = this.modal.getByTestId('project-modal-description');
        this.statusLabel = this.modal.getByLabel('Status');
        this.statusSelect = this.modal.getByRole('combobox', { name: 'Status' });
        this.createButton = this.modal.getByRole('button', { name: 'Create' });
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
        this.visibleLocators = [this.heading, this.nameLabel, this.nameInput, this.descriptionLabel, this.descriptionInput, this.statusLabel, this.statusSelect, this.createButton, this.cancelButton];
    }

    async fillForm(project: Project) {
        await this.nameInput.fill(project.name);
        await this.descriptionInput.fill(project.description);
        await this.statusSelect.selectOption(project.status);
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
        for (const status of Object.values(ProjectStatus)) {
            await this.statusSelect.selectOption(status);
        }
    }
}

export class DeleteProjectModal extends BasePage {
    modal: Locator;
    heading: Locator;
    deleteButton: Locator;
    cancelButton: Locator;
    project: Project;

    constructor(page: Page, project: Project) {
        super(page, undefined, false);
        this.project = project;
        this.modal = this.page.locator('xpath=//*[@id="root"]/div/div[4]/div'); 
        this.heading = this.modal.getByRole('heading', { name: "Delete Project" });
        this.deleteButton = this.modal.getByRole('button', { name: 'Delete' });
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
        this.visibleLocators = [this.modal, this.heading, this.deleteButton, this.cancelButton];
    }

    async deleteProject() {
        await this.deleteButton.click();
    }
}