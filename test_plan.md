# Test plan
## Login Page
1. Registered user with correct password can login and ends on project page **

    1. Mismatch of case
    1. Special Characters (unicode or control characters)
    1. Whitespace
1. Incorrect password errors and fails to login, check for: **
1. Prompt on empty fields **
1. Root redirects to login 
1. Password is obfuscated
1. Logout **

    1. Check project page is in accessible (redirects to login)

## User page
### New user modal
1. Add new regular user **
1. Add new regular user complex password
1. Add new user with same username (case?) **
1. Check role list is only regular/admin **
1. Prompt on empty fields
1. Cancel does not create a new user **

    1. Click outside of model dismisses it
1. Add admin user **
1. Delete regular user (should no longer be able to login.) **

    1. What happens if user is in an existing session, auth timeout? Probably not worth auto test.
1. Delete admin user **
1. Should not be able to delete yourself **

## Projects page
### Filter projects
1. No filter lists all projects you are a member of or all if you are admin. **

    1. Check project field values
1. Each status filters only projects in that state **
1. Search filters on words in the name or project description **

    1. Case insenstive
    1. Multiple search terms
1. Clear filter returns all valid projects **
1. Change project status with drop down
1. Select all checks all items
1. Deselect all unchecks all items

    1. Popup dissapears
1. Multi selector pop up only present when an item is selected.
1. Change item status with drop down

### Delete project
1. Delete project ** 

    1. Removed from project list
    1. Direct link no longer works/shows appropriate error page.
    1. Does not show up for previous members of the deleted project

### New project modal
1. Add new active project **

    1. Check state is set correctly
    1. Check using special characters in name and deescription fields
    1. Resize description box
1. Cancel does not create a new project

    1. Click outside of model dismisses it
1. Prompt on empty fields

## Project page
1. Verify name, state, description, item count **
1. Can select and delete multiple items
1. Select all checks all items
1. Deselect all unchecks all items

    1. Popup dissapears
1. Multi selector pop up only present when an item is selected
1. Change item status with drop down.

### Add/edit item modal
1. Add new item **
    
    1. Check status is set correctly
    1. Check using special characters in name and deescription fields
    1. Resize description box.
    1. Check appears in list
1. Cancel does not create a new project **

    1. Click outside of model dismisses it
1. Prompt on empty mandatory fields
1. Edit item populates fields and status correctly **

    1. Item is updated

### Project members
1. Project members list shows correct members (check field values) **

1. Add user drop down lists all available users not already a member **
1. User drop down dissapears when no more members can be added
1. Removing a member removes them from the list and also their ability to see the project
        
    1. Can be readded using dropdown

## Synchronise 
1. Last synced time
1. Start syncing starts the sync process

    1. Sync progress and completes
    1. Last synced time updates
    1. Workaround first sync always fails
1. Revisit sync time stays
1. Navigate away mid sync

## Permissions 
1. Check page permisisons of user **

    1. User page
    1. Project pages you are not a member of
    1. Delete project

# Page objects/structures
* Login page
* Project list page
* Users page
* Syncronise page
* Add/edit object modal
* Checkbox selector
