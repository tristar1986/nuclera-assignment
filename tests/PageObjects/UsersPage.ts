import { BasePage } from "./BasePage";
import { Locator, Page } from '@playwright/test';
import { User, UserRole } from "../DataObjects/User";

export class UsersPage extends BasePage {
    newUserButton: Locator;
    constructor(page: Page) {
        super(page);
        this.newUserButton = this.page.getByRole('button', { name: 'New User' });
    }

    async createUser(user: User) {
        console.log(`Creating user with username: ${user.username}, password: ${user.password}, role: ${user.role}`);
        await this.newUserButton.click();
        const modal = new NewUserModal(this.page);
        await modal.locatorsAreVisible();
        await modal.usernameInput.fill(user.username);
        await modal.passwordInput.fill(user.password);
        await modal.roleInput.selectOption(user.role);
        await modal.createButton.click();
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
    roleInput: Locator;

    constructor(page: Page) {
        super(page, false);
        this.modal =this.page.getByTestId('user-modal');
        this.usernameLabel = this.page.getByLabel("Username");
        this.usernameInput = this.page.getByTestId('user-modal-username');
        this.passwordLabel = this.page.getByLabel("Password");
        this.passwordInput = this.page.getByTestId('user-modal-password');
        this.roleLabel = this.page.getByLabel("Role");
        this.roleInput = this.page.getByRole('combobox', { name: 'Role' });
        this.createButton = this.page.getByRole('button', { name: 'Create' });
        this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
        this.visibleLocators = [this.modal, this.usernameLabel, this.usernameInput, this.passwordLabel, this.passwordInput, this.roleLabel, this.roleInput, this.createButton, this.cancelButton];
    }
}