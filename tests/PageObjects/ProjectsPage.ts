import { BasePage } from "./BasePage";
import { LoginPage } from "./LoginPage";
import { expect, Locator, Page } from '@playwright/test';
import { Project, ProjectStatus } from "../DataObjects/Project";
import { User } from "../DataObjects/User";

type ProjectRowData = {
    name: string;
    status: string;
    itemCount: string;
    createdAt: string;
};

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
        // this.page.getByText("") This could just create false positives.
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
        const rowData = await this.projectsTable.getByTestId('project-row').evaluateAll((rows) => {
            return rows
                .filter((row) => {
                    const element = row as HTMLElement;
                    return element.offsetParent !== null;
                })
                .map((row) => {
                    const cells = row.querySelectorAll('td');
                    const name = (row.querySelector('[data-testid="project-name"]') as HTMLElement | null)?.innerText?.trim() ?? '';
                    const status = (row.querySelector('[data-testid="project-status"]') as HTMLSelectElement | null)?.value ?? '';
                    const itemCount = (row.querySelector('[data-testid="project-item-count"]') as HTMLElement | null)?.innerText?.trim() ?? '0';
                    const createdAt = (cells[4] as HTMLElement | undefined)?.innerText?.trim() ?? '';
                    return { name, status, itemCount, createdAt };
                });
        });

        const projects: Project[] = [];
        for (const row of rowData) {
            projects.push(await this.getProjectFromNameCell(row));
        }

        console.log(`Current projects in table: ${projects.map(p => p.name).join(', ')}`);
        return projects;
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
        await this.projectsTable.getByRole('row').filter({ hasText: this.escapeRegex(project.name) }).getByRole('button', { name: 'Delete' }).click();
        const deleteProjectModal = new DeleteProjectModal(this.page, project);
        await deleteProjectModal.locatorsAreVisible();
        await deleteProjectModal.deleteProject();
        await deleteProjectModal.modal.waitFor({ state: 'hidden', timeout: deleteProjectModal.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${project.name}" deleted`);
    }

    async isProjectInTable(projectToFind: Project) {
        let projects = await this.getProjects();
        // expect(projects).toContain(projectToFind); This doesnt work for some reason
        let found: boolean = false;
        for (const project of projects) {
            if (project.name == projectToFind.name) {

                if (projectToFind.isEqualTo(project, true)) {
                    found = true;
                    break;
                }
            }
        }
        return found;
    }

    async waitForProjectToAppear(project: Project) {
        await this.getProjectNameCell(project.name)
            .waitFor({ state: 'visible', timeout: 5000 });
    }

    async waitForProjectInTable(project: Project) {
        await this.waitForProjectToAppear(project);
        const projectRow = await this.getProjectFromNameCell(this.getProjectNameCell(project.name));
        return project.isEqualTo(projectRow, true);
    }

    async waitForProjectNotInTable(project: Project) {
        await this.waitForProjectToDisappear(project);
        return !(await this.getProjectNameCell(project.name).isVisible());
    }

    async waitForProjectToDisappear(project: Project) {
        await this.getProjectNameCell(project.name)
            .waitFor({ state: 'hidden', timeout: 5000 });
    }

    async inputSearch(searchTerm: string) {
        console.log(`Searching projects for term: ${searchTerm}`);
        await this.searchInput.clear();
        await this.searchInput.fill(searchTerm);
    }

    async getProjectLink(project: Project) {
        await this.waitForProjectToAppear(project);
        return this.getProjectNameCell(project.name).getAttribute('href');
    }

    private async getProjectFromNameCell(projectNameCellOrRowData: Locator | ProjectRowData) {
        if (!("locator" in projectNameCellOrRowData)) {
            return new Project(
                projectNameCellOrRowData.name,
                ProjectStatus[projectNameCellOrRowData.status.toLowerCase() as keyof typeof ProjectStatus],
                projectNameCellOrRowData.createdAt,
                undefined,
                parseInt(projectNameCellOrRowData.itemCount, 10)
            );
        }

        const projectNameCell = projectNameCellOrRowData;
        const projectRow = projectNameCell.locator('xpath=ancestor::tr[1]');
        const cells = await projectRow.getByRole('cell').all();
        const name = await projectNameCell.innerText();
        const status = await projectRow.getByTestId("project-status").inputValue();
        const itemCount = await projectRow.getByTestId("project-item-count").innerText();
        const createdAt = await cells[4].innerText();
        return new Project(name, ProjectStatus[status.toLowerCase() as keyof typeof ProjectStatus], createdAt, undefined, parseInt(itemCount, 10));
    }

    private getProjectNameCell(projectName: string) {
        return this.projectsTable
            .getByTestId('project-name')
            .filter({ hasText: this.escapeRegex(projectName) })
            .first();
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