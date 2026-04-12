# Test Plan

Status key:
- [x]: implemented / covered
- [ ]: planned/not yet automated
- [~]: deferred/manual or low ROI for automation

Priority key:
- [High]
- [Normal]

## Login Page
- [x] [High] Valid login redirects registered user to projects page
    - [x] [High] Username case mismatch
    - [x] [High] Special characters (Unicode/control)
    - [x] [High] Whitespace handling
- [x] [High] Incorrect password shows error and blocks login
- [x] [High] Empty fields show validation prompts
- [x] [Normal] Root URL redirects to login
- [x] [Normal] Password field is obfuscated
- [x] [High] Logout redirects to login and protects project page

## User Page

### New User Modal
- [x] [High] Create regular user
- [x] [Normal] Create regular user with complex password
- [x] [High] Prevent duplicate username creation (including case variant)
- [x] [High] Role list includes only regular/admin
- [x] [Normal] Empty fields show validation prompts
- [x] [High] Cancel does not create user
    - [x] [High] Click outside modal dismisses it
- [x] [High] Create admin user
- [x] [High] Delete regular user
    - [~] [Normal] Existing session behavior after deletion (auth timeout); low ROI for automation
- [x] [High] Delete admin user
- [x] [High] User cannot delete self
- [x] [Normal] Toast behavior
    - [x] [Normal] Dismisses on cancel
    - [x] [Normal] Auto-dismisses after timeout

## Projects Page

### Filter Projects
- [x] [High] No filter shows all visible projects
    - [x] [High] Validate project field values
- [x] [High] Status filter returns only matching projects
- [x] [High] Search filters by name/description
    - [ ] [High] Case-insensitive matching
    - [x] [High] Multiple search terms
- [x] [High] Clear filters restores valid full list
- [ ] [Normal] Change project status via dropdown
- [ ] [Normal] Select all checks all rows
- [ ] [Normal] Deselect all unchecks all rows
    - [ ] [Normal] Multi-select popup disappears
- [ ] [Normal] Multi-select popup appears only when a row is selected
- [ ] [Normal] Empty-projects state
- [ ] [Normal] Column headers

### Delete Project
- [x] [High] Delete project
    - [x] [High] Removed from list
    - [x] [High] Direct URL is no longer accessible
    - [ ] [High] Hidden from previous members

### New Project Modal
- [x] [High] Create project
    - [x] [High] State is set correctly
    - [ ] [High] Special characters in name/description
    - [ ] [High] Description box resizing
- [x] [Normal] Cancel does not create project
    - [x] [Normal] Click outside modal dismisses it
- [x] [Normal] Empty fields show validation prompts

## Project Page
- [x] [High] Validate name, state, description, and item count
- [ ] [Normal] Select and delete multiple items
- [ ] [Normal] Select all checks all items
- [ ] [Normal] Deselect all unchecks all items
    - [ ] [Normal] Multi-select popup disappears
- [ ] [Normal] Multi-select popup appears only when an item is selected
- [ ] [Normal] Change item status via dropdown
- [ ] [Normal] Column headers
- [ ] [Normal] Empty-items state

### Add/Edit Item Modal
- [x] [High] Add new item
    - [x] [High] Status is set correctly
    - [ ] [High] Special characters in name/description
    - [ ] [High] Description box resizing
    - [x] [High] Item appears in list
- [x] [High] Cancel does not create project/item
    - [ ] [High] Click outside modal dismisses it
- [ ] [Normal] Empty mandatory fields show prompts
- [x] [High] Edit item pre-populates fields and status correctly
    - [x] [High] Item updates correctly
    - [x] [High] Re-open shows updated values
- [ ] [High] Item count updates

### Project Members
- [x] [High] Members list shows correct members and field values
    - [ ] [High] Empty-members state
- [x] [High] Add user to members list
- [x] [High] Remove user from members list
- [ ] [High] Add-user dropdown shows only users not already in the project
- [ ] [Normal] Add-user dropdown disappears when no users remain
- [ ] [Normal] Removing member revokes project visibility
    - [ ] [Normal] User can be re-added from dropdown
- [ ] [Normal] Add User button disabled when no member is selected

## Synchronise
- [~] [Normal] Last synced time is shown
- [~] [Normal] Start sync triggers sync process
    - [~] [Normal] Sync shows progress and completes
    - [~] [Normal] Last synced time updates
    - [~] [Normal] Known issue: first sync currently fails
- [~] [Normal] Last synced time persists after revisit
- [~] [Normal] Navigate away during active sync

## Permissions
- [x] [High] Validate page permissions for regular users
    - [x] [High] Users page access
    - [x] [High] Non-member project page access
    - [x] [High] Delete project permission

## Page Objects / Structures
- Login page
- Project list page
- Users page
- Synchronise page
- Add/edit object modal
- Checkbox selector

## TODOs
- Refactor modal form submission to use shared base code
- Replace fragile XPath locators with stable selectors
- Create generic modal cancel flow
- Create generic table collation helpers