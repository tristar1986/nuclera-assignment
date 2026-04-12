# nuclera-assignment

Nuclera technical assignment using Playwright and TypeScript.

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
1. From the project root, install Node dependencies:
     `npm install`
2. Install Playwright browsers:
     `npx playwright install`

### Execute Tests
- Run all tests:
    `npx playwright test`
- Run a single test file:
    `npx playwright test tests/project-page-tests.spec.ts`
- Run tests matching a title:
    `npx playwright test -g "add user to project"`
- Run on a specific browser project:
    `npx playwright test --project=chromium`

CI is configured via GitHub Actions to run the suite for pull requests to `main` and merges into `main` using projects defined in `playwright.config.ts`.

## Prioritisation Logic

I prioritised automation based on a risk-and-value model after initial exploratory testing:
- Business criticality and usage frequency: core flows that many users depend on were automated first.
- Security and data integrity impact: features where failure could create customer or compliance risk were treated as high priority.
- Implementation ROI: I preferred scenarios that provide broad coverage quickly and can reuse existing page/data objects.

This approach maximises confidence early while keeping the suite maintainable and fast enough for CI feedback.

## Object Oriented Design Choices

The framework uses object-oriented design to keep tests readable, reusable, and easy to extend:
- Page Object Model (`tests/PageObjects`): each page is represented by a class that encapsulates locators and user interactions.
- Data Object classes (`tests/DataObjects`): reusable test data models separate scenario data from test flow logic.
- Encapsulation: tests call high-level methods rather than direct locator actions, reducing duplication and brittleness.
- Single responsibility: page classes focus on page behavior, data objects on state, and spec files on assertions and intent.

This structure improves maintainability and makes adding new scenarios faster as coverage grows.

## Manual vs Auto

The following areas were intentionally not automated:
- Styling/themes: visual polish changes frequently and is better validated through manual exploratory/usability testing.
- Session-expiry-dependent behavior (for example, validating logout after user deletion): timing can be long and environment-dependent, making it low ROI and potentially flaky for CI.
- Synchronise page (deprioritised): during exploration it appeared unstable (initial sync failure and non-persistent `last synced` value). Given time constraints and lower immediate value, it was left for later once behavior stabilises.

These choices focus automation on stable, high-value checks and reserve fragile or low-value areas for manual coverage.