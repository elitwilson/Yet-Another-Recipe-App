---
id: STR-013
title: Edit & delete flows
epic: EPIC-002
status: specced
priority: high
---

## Goal

Wire up edit and delete interactions on the detail view so users can update and remove recipes. Completes the full CRUD loop for the library.

---

## Scope

### In
- **Edit flow**: "Edit" button on the detail view → editor form (STR-012) pre-populated with the current recipe → "Save" calls `updateRecipe` → success returns to detail view showing updated data
- **Delete flow**: "Delete" button → confirmation dialog → confirmed → `deleteRecipe` called → redirect to `/` (library)
- Save button disabled when draft is invalid (title + ≥1 ingredient + ≥1 step)
- Loading state during save and delete operations
- Error handling: error message if save or delete fails

### Out
- Discard/cancel confirmation — navigating away or clicking Back discards changes silently (browser default)
- Optimistic updates

---

## Acceptance Criteria

- [ ] "Edit" button on the detail view opens the editor form pre-populated with all current recipe fields
- [ ] All fields are editable in the form
- [ ] "Save" button is disabled when the draft is invalid
- [ ] Saving calls `PUT /api/recipes/:id`; on success, the detail view refreshes with updated data
- [ ] Error state renders if the save call fails (without navigating away)
- [ ] "Delete" button opens a confirmation dialog with a destructive warning
- [ ] Confirming delete calls `DELETE /api/recipes/:id` and redirects to `/`
- [ ] Cancelling the delete dialog returns to the detail view with no change
- [ ] Loading indicators render during save and delete operations

---

## Context & Decisions

- **Edit UI pattern**: the architect should implement the approach decided during STR-011 — either an inline `$state` toggle on `/recipes/[id]` switching between read view and editor, or a `/recipes/[id]/edit` sub-route. STR-011's spec documents which was chosen; follow it.
- **After a successful save**: re-fetch the recipe or merge the API response to ensure the detail view reflects server state — do not rely on the local draft being identical to what the server persisted.
- **Delete confirmation**: use a shadcn-svelte Dialog component. Copy: "Delete this recipe?" with a destructive confirm button and a cancel button.

---

## Dependencies

- **Depends on:** STR-011 (detail view — provides entry point and current recipe data), STR-012 (editor form component)
- **Blocks:** none

---

## Notes

- "Back" / "Cancel" from the edit form should navigate to `/recipes/[id]` without saving. No discard confirmation needed.
- The detail view's `fetchRecipe` call will need to be re-triggered or the response from `updateRecipe` merged after a successful save, depending on how STR-011 set up data loading.
