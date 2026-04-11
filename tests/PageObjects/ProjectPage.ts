import { urlToHttpOptions } from "url";
import { Project } from "../DataObjects/Project"
import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

export class ProjectPage extends BasePage {
    page: Page;
    project?: Project;

    backToProjectsLink: Locator;
    heading?: Locator;
    projectStatus?: Locator;
    projectItemCount?: Locator;
    memberHeading?: Locator;

    constructor(page: Page, project?: Project) {
        super(page, undefined, false);
        this.page = page;
        
        this.backToProjectsLink = this.page.getByRole('link', { name: 'Back to Projects' });
        this.visibleLocators = [this.backToProjectsLink];

        if (project) {
            this.project = project;
            this.heading = this.page.getByRole('heading', { name: this.project.name });
            this.projectStatus = this.page.getByText(this.project.status);
            this.projectItemCount = this.page.getByTestId('project-detail-item-count');
            this.memberHeading = this.page.getByText('Project Members');
            this.visibleLocators.push(this.heading, this.projectStatus, this.projectItemCount, this.memberHeading);
        }
        this.locatorsAreVisible();
    }

    async projectNotFound() {
        await expect(this.page.getByText('Project not found')).toBeVisible();
        await expect(this.backToProjectsLink).toBeVisible();
    }
}