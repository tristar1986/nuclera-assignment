import test from "@playwright/test";
import { gotoUsersPage, loginAsAdmin, login, originalAdminUser } from "./helpers";

test.describe.fixme("Cleanup", () => {
    test.setTimeout(120000);
    test("delete all users except admin", async ({ page }) => {        
        let projectPage = await loginAsAdmin(page);
        let usersPage = await gotoUsersPage(projectPage);
        let users = await usersPage.getUsers()
        for (const user of users) {
            if (user.username == "admin") {
                continue;
            }
            await usersPage.deleteUser(user)
        }
    });
    
    test("remove all projects", async ({ page }) => {  
        let projectsPage = await login(page, originalAdminUser);
        let projects = await projectsPage.getProjects();
        for (const project of projects) {
            await projectsPage.deleteProject(project)
        }
    });
});