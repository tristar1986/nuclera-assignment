import test, { expect } from "@playwright/test";
import { createProjectWithItem, createProjectWithMember, generate_random_string, gotoProjectsPage, gotoUsersPage, login, loginAsAdmin, logout } from "./helpers";
import { Project, ProjectStatus } from "./DataObjects/Project";
import { format } from "date-fns";
import { User, UserRole } from "./DataObjects/User";
import { Item, ItemStatus } from "./DataObjects/Item";
import { AddItemModal } from "./PageObjects/ProjectPage";

test.describe("Project page tests", () => {
    let adminUser: User;
    let newProject: Project;
    let projectName: string;
    let projectDescription: string;

    test.beforeEach(async ({ page }) => {
        projectName = generate_random_string();
        projectDescription = generate_random_string();
        newProject = new Project(projectName, ProjectStatus.active, format(new Date(), 'dd/MM/yyyy'), projectDescription);
        adminUser = new User(generate_random_string(), generate_random_string(), UserRole.Admin);
        let projectsPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(adminUser);
        await logout(usersPage);
    });

    test("can add item to project", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        let item = new Item(generate_random_string(), ItemStatus.Todo, generate_random_string());
        let projectPage = await createProjectWithItem(projectsPage, newProject, item);
        await projectPage.waitForItemInList(item);
        let foundItem = await projectPage.getItem(item);
        compareItems(item, foundItem!);
    });

    test("cancel adding item is not added to project", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        let item = new Item(generate_random_string(), ItemStatus.Todo, generate_random_string());
        await projectsPage.createProject(newProject);
        let projectPage = await projectsPage.gotoProject(newProject);
        await projectPage.addItemButton?.click();
        const addItemModal = new AddItemModal(page);
        await addItemModal.locatorsAreVisible();
        await addItemModal.fillForm(item);        
        await addItemModal.cancelButton.click();
        await addItemModal.modal.waitFor({ state: 'hidden', timeout: addItemModal.modalHiddenTimeout });
        await projectPage.locatorsAreVisible();
        await projectPage.waitForItemNotInList(item);
    });

    test("edit item updates details", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        let item = new Item(generate_random_string(), ItemStatus.Todo, generate_random_string());
        let projectPage = await createProjectWithItem(projectsPage, newProject, item);
        let updatedItem = new Item(generate_random_string(), ItemStatus.Done, generate_random_string());
        await projectPage.editItem(item, updatedItem);
        await projectPage.waitForItemInList(updatedItem);
        let actualItem = await projectPage.getItem(updatedItem);
        compareItems(updatedItem, actualItem!);

        let editItemModal = await projectPage.clickEditItem(updatedItem);
        expect(await editItemModal.nameInput.inputValue()).toBe(updatedItem.name);
        expect(await editItemModal.descriptionInput.inputValue()).toBe(updatedItem.description);
        expect((await editItemModal.statusSelect.inputValue()).toLowerCase()).toBe(updatedItem.status.toLowerCase());
    });

    test("add user to project", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        let newUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(newUser);
        projectsPage = await gotoProjectsPage(usersPage);
        let projectPage = await createProjectWithMember(projectsPage, newProject, newUser);
        let foundUser = await projectPage.getMemberInProject(newUser);
        compareMembers(newUser, foundUser!);
    });

    test("remove user from project", async ({ page }) => {
        let projectsPage = await login(page, adminUser);
        let newUser = new User(generate_random_string(), generate_random_string(), UserRole.Regular);
        let usersPage = await gotoUsersPage(projectsPage);
        await usersPage.createUser(newUser);
        projectsPage = await gotoProjectsPage(usersPage);
        let projectPage = await createProjectWithMember(projectsPage, newProject, newUser);
        await projectPage.removeMemberFromProject(newUser);
        let foundUser = await projectPage.getMemberInProject(newUser);
        expect(foundUser).toBeUndefined();
    });
});

function compareItems(expected: Item, actual: Item) {
    expect(actual).toBeDefined();
    expect(actual.name).toBe(expected.name);
    expect(actual.status.toLowerCase()).toBe(expected.status.toLowerCase());
}

function compareMembers(expected: User, actual: User) {
    expect(actual).toBeDefined();
    expect(actual.username).toBe(expected.username);
    expect(actual.role).toBe(expected.role);
}