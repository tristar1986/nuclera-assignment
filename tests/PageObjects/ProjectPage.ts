import { Project } from "../DataObjects/Project"
import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";
import { Item, ItemStatus } from "../DataObjects/Item";
import { User, UserRole } from "../DataObjects/User";
import { ProjectsPage } from "./ProjectsPage";

export class ProjectPage extends BasePage {
    page: Page;
    project?: Project;

    backToProjectsLink: Locator;
    heading?: Locator;
    projectStatus?: Locator;
    projectItemCount?: Locator;
    memberHeading?: Locator;
    addItemButton?: Locator;
    itemTable: Locator;
    projectMembersHeading: Locator;
    userSelect: Locator;
    projectMembersSection: Locator;

    constructor(page: Page, project?: Project) {
        super(page, undefined, false);
        this.page = page;
        
        this.backToProjectsLink = this.page.getByRole('link', { name: 'Back to Projects' });
        this.itemTable = this.page.getByTestId('items-list').getByRole('table');
        this.projectMembersSection = this.page.getByTestId('members-section');
        this.projectMembersHeading = this.projectMembersSection.getByRole('heading', { name: 'Project Members' });
        this.userSelect = this.projectMembersSection.getByTestId('member-add-select');
        this.visibleLocators.push(this.backToProjectsLink, this.projectMembersHeading, this.userSelect);

        if (project) {
            this.project = project;
            this.heading = this.page.getByRole('heading', { name: this.project.name });
            this.projectStatus = this.page.getByText(this.project.status);
            this.projectItemCount = this.page.getByTestId('project-detail-item-count');
            this.memberHeading = this.page.getByText('Project Members');
            this.addItemButton = this.page.getByRole('button', { name: 'Add Item' });
            this.visibleLocators.push(this.heading, this.projectStatus, this.projectItemCount, this.memberHeading, this.addItemButton, this.projectMembersSection);
        }
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
        await expect(this.userSelect.locator('option').first()).toContainText('Select user to add');
    }

    async projectNotFound() {
        await expect(this.page.getByText('Project not found')).toBeVisible();
        await expect(this.backToProjectsLink).toBeVisible();
    }

    async addItemToProject(item: Item) {
        await this.addItemButton?.click();
        const addItemModal = new AddItemModal(this.page);
        await addItemModal.locatorsAreVisible();
        await addItemModal.fillForm(item);        
        await addItemModal.actionButton.click();
        await addItemModal.modal.waitFor({ state: 'hidden', timeout: addItemModal.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${item.name}" added`);

    }

    async getItems() {
        const rows = await this.itemTable.getByRole('row').all();
        const items: Item[] = [];
        for (const row of rows) {
            items.push(await this.getItemRowData(row));
        }
        return items;
    }

    async getItem(itemToFind: Item): Promise<Item | undefined> {
        const matchingRows = this.itemTable
            .getByTestId('item-row')
            .filter({ hasText: new RegExp(itemToFind.name) });

        if ((await matchingRows.count()) === 0) {
            return undefined;
        }

        return this.getItemRowData(matchingRows.first());
    }

    private async getItemRowData(row: Locator) {
        const name = await row.getByTestId('item-name').innerText();
        const status = await row.getByTestId('item-status').inputValue() as ItemStatus;
        return new Item(name, status);
    }

    async waitForItemInList(item: Item) {
        await expect(this.itemTable.getByTestId("item-row").filter({ hasText: new RegExp(item.name) }).first()).toBeVisible();
    }

    async waitForItemNotInList(item: Item) {
        await expect(this.itemTable.getByTestId("item-row").filter({ hasText: new RegExp(item.name) })).toHaveCount(0);
    }

    async clickEditItem(item: Item) {
        await this.waitForItemInList(item);
        await this.itemTable.getByRole("row").filter({ hasText: new RegExp(item.name) }).getByRole('button', { name: 'Edit' }).click();
        return new EditItemModal(this.page);
    }

    async editItem(currentItem: Item, updatedItem: Item) {
        const editItemModel = await this.clickEditItem(currentItem);
        await editItemModel.locatorsAreVisible();
        await editItemModel.fillForm(updatedItem);
        await editItemModel.actionButton.click();
        await editItemModel.modal.waitFor({ state: 'hidden', timeout: editItemModel.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${updatedItem.name}" saved`);
    }

    async waitForMemberInList(user: User) {
        return await expect(this.projectMembersSection.getByTestId('member-row').filter({ hasText: new RegExp(user.username) }).first()).toBeVisible();
    }

    async waitForMemberNotInList(user: User) {
        return expect(await this.projectMembersSection.getByTestId('member-row').filter({ hasText: new RegExp(user.username) })).toHaveCount(0);
    }

    async selectMemberToAdd(user: User) {
        await this.userSelect.selectOption(`${user.username} (${user.role.toLowerCase()})`);
    }
    async addMemberToProject(user: User) {
        await this.selectMemberToAdd(user);
        await this.projectMembersSection.getByRole('button', { name: 'Add' }).click();
        await this.waitForMemberInList(user);
    }

    async getMemberInProject(userToFind: User): Promise<User | undefined> {
        const matchingRows = this.projectMembersSection
            .getByTestId('member-row')
            .filter({ hasText: new RegExp(userToFind.username) });

        if ((await matchingRows.count()) === 0) {
            return undefined;
        }

        return this.getMemberRowData(matchingRows.first());        
    }

    async removeMemberFromProject(user: User) {
        await this.projectMembersSection.getByTestId('member-row').filter({ hasText: new RegExp(user.username) }).getByRole('button', { name: 'Remove' }).click();
        await this.waitForMemberNotInList(user);
    }

    private async getMemberRowData(row: Locator) {
        const name = await row.getByTestId('member-username').innerText();
        const status = await row.getByRole("cell").nth(1).innerText() as UserRole;
        return new User(name, "", status);
    }
}

export class ItemModal extends BasePage {
    modal: Locator;
    nameLabel: Locator;
    nameInput: Locator;
    descriptionLabel: Locator;
    descriptionInput: Locator;
    statusLabel: Locator;
    statusSelect: Locator;
    cancelButton: Locator;
    actionButton: Locator;
    heading: Locator;

    constructor(page: Page, headingName: string, actionButtonName: string) {
        super(page, undefined, false);
        this.modal = this.page.getByTestId('item-form');
        this.heading = this.modal.getByRole('heading', { name: headingName });
        this.actionButton = this.modal.getByRole('button', { name: actionButtonName });
        
        this.nameLabel = this.modal.getByLabel('Name');
        this.nameInput = this.modal.getByTestId('item-form-name');
        this.descriptionLabel = this.modal.getByLabel('Description');
        this.descriptionInput = this.modal.locator('xpath=//*[@id="item-form-description"]'); // This could do with a better selector
        this.statusLabel = this.modal.getByLabel('Status');
        this.statusSelect = this.modal.getByRole('combobox', { name: 'Status' });
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
        
        this.visibleLocators.push(this.modal, this.nameLabel, this.nameInput, this.descriptionLabel, this.descriptionInput, this.statusLabel, this.statusSelect, this.cancelButton, this.heading, this.actionButton);
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
        for (const status of Object.values(ItemStatus)) {
            await this.statusSelect.selectOption(status);
        }
    }

    async fillForm(item: Item) {
        await this.nameInput.fill(item.name);
        await this.descriptionInput.fill(item.description);
        await this.statusSelect.selectOption(item.status);
    }
}

export class AddItemModal extends ItemModal {
    constructor(page: Page) {
        super(page, 'Add Item', 'Add');
    }
}

export class EditItemModal extends ItemModal {
    constructor(page: Page) {
        super(page, 'Edit Item', 'Save');
    }
}