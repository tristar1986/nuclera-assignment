import { BasePage } from "./BasePage";
import { expect, Locator, Page } from '@playwright/test';
import { User, UserRole } from "../DataObjects/User";

export class UsersPage extends BasePage {
    newUserButton: Locator;
    heading: Locator;
    userTable: Locator;

    constructor(page: Page) {
        super(page);
        this.newUserButton = this.page.getByRole('button', { name: 'New User' });
        this.heading = this.page.getByRole('heading', { name: 'Users' });
        
        this.userTable = this.page.getByTestId('users-list').getByRole('table');
        this.visibleLocators = [this.heading, this.newUserButton, this.userTable];
    }

    async createUser(user: User) {
        console.log(`Creating user with username: ${user.username}, password: ${user.password}, role: ${user.role}`);
        await this.newUserButton.click();
        const newUsermodal = new NewUserModal(this.page);
        await newUsermodal.locatorsAreVisible();
        await newUsermodal.fillForm(user);
        await newUsermodal.createButton.click();
        await newUsermodal.modal.waitFor({ state: 'hidden', timeout: newUsermodal.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${user.username}" created`);
        await expect(this.userTable.getByRole('columnheader')).toHaveText(['Username', 'Role', 'Actions']); // ensure after a user is created the table appears with headers.
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
    }

    async getUsers() {
        const rows = await this.userTable.getByRole('row').all()
        const users: User[] = [];
        for (const row of rows) {
            const cells = await row.getByRole('cell').all();
            if (cells.length === 0) continue;
            const username = await cells[0].innerText();
            const role = await cells[1].innerText();
            users.push(new User(username, '', UserRole[role as keyof typeof UserRole]));
        }
        console.log(`Current users in table: ${users.map(u => u.username).join(', ')}`);
        return users;
    }

    async isUserInTable(userToFind: User) {
        await this.userTable.getByTestId('user-username').filter({ hasText: new RegExp(userToFind.username) }).isVisible(); // Regex to handle case sensitivity
        let users = await this.getUsers();
        // expect(users).toContain(userToFind); This doesnt work for some reason
        let found: boolean = false;
        for (const user of users) {
            if (user.username == userToFind.username && user.role == userToFind.role) {
                found = true;
                break;
            }
        }
        return found;
    }

    async expectUserAlreadyExistsError() {
        const modal = new NewUserModal(this.page);
        await expect(modal.errorMessage).toContainText("Username already exists");
    }

    async deleteUser(user: User) {
        console.log(`Deleting user with username: ${user.username}`);
        await this.userTable.getByRole('row').filter({ hasText: new RegExp(user.username) }).getByRole('button', { name: 'Delete' }).click();
        const deleteUserModal = new DeleteUserModal(this.page, user);
        await deleteUserModal.locatorsAreVisible();
        deleteUserModal.deleteUser();
        await deleteUserModal.modal.waitFor({ state: 'hidden', timeout: deleteUserModal.modalHiddenTimeout });
        await this.locatorsAreVisible();
        await this.toast.waitFor({ state: 'visible', timeout: this.toastVisibleTimeout });
        await expect(this.toast).toContainText(`"${user.username}" deleted`);
    }

    async isDeleteUserDisabled(user: User) {
        const deleteButton = await this.userTable.getByRole('row').filter({ hasText: new RegExp(user.username) }).getByRole('button', { name: 'Delete' });
        return await deleteButton.isDisabled();
    }

}

export class NewUserModal extends BasePage {
    modal: Locator;
    usernameLabel: Locator;
    usernameInput: Locator
    passwordLabel: Locator;
    passwordInput: Locator
    createButton: Locator;
    cancelButton: Locator;
    roleLabel: Locator;
    roleSelect: Locator;
    errorMessage: Locator;

    constructor(page: Page) {
        super(page, undefined, false);
        this.modal = this.page.getByTestId('user-modal');
        this.usernameLabel = this.modal.getByLabel("Username");
        this.usernameInput = this.modal.getByTestId('user-modal-username');
        this.passwordLabel = this.modal.getByLabel("Password");
        this.passwordInput = this.modal.getByTestId('user-modal-password');
        this.roleLabel = this.modal.getByLabel("Role");
        this.roleSelect = this.modal.getByRole('combobox', { name: 'Role' });
        this.createButton = this.modal.getByRole('button', { name: 'Create' });
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
        this.errorMessage = this.modal.getByTestId('user-modal-error');
        this.visibleLocators = [this.modal, this.usernameLabel, this.usernameInput, this.passwordLabel, this.passwordInput, this.roleLabel, this.roleSelect, this.createButton, this.cancelButton];
    }

    async fillForm(user: User) {
        await this.usernameInput.fill(user.username);
        await this.passwordInput.fill(user.password);
        await this.roleSelect.selectOption(user.role);
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
        for (const role of Object.values(UserRole)) {
            await this.roleSelect.selectOption(role);
        }
    }
}

export class DeleteUserModal extends BasePage {
    modal: Locator;
    header: Locator;
    deleteButton: Locator;
    cancelButton: Locator;
    user: User;
    
    constructor(page: Page, user: User) {
        super(page, undefined, false);
        this.user = user;   

        // Using xpath here as there is no unique identifier
        this.modal = this.page.locator('xpath=//*[@id="root"]/div/div[3]/div'); 
        this.header = this.modal.getByRole('heading', { name: 'Delete User' });
        this.deleteButton = this.modal.getByRole('button', { name: 'Delete' });
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
        this.visibleLocators = [this.modal, this.header, this.deleteButton, this.cancelButton];
    }

    async locatorsAreVisible() {
        await super.locatorsAreVisible();
        expect(this.modal.getByText(this.user.username)).toBeVisible();
    }

    async deleteUser() {
        await this.deleteButton.click();
    }
}