## Write failing tests for the edit/delete wiring (RED)

## Verdict: APPROVED

**Task:** Write failing tests for the edit/delete wiring (RED)
**Spec:** .artifacts/etwilson/specs/014-edit-and-delete-flows.md

**Scope issues:** none

**Coverage gaps:** none

All required behaviors are covered:
- Save disabled when invalid / enabled when valid (source-level check on `formValid|valid` + `disabled`)
- Save calls `updateRecipe` (source check for `updateRecipe` import + usage)
- Successful save navigates to detail view (source check for `goto`)
- Failed save renders error without navigating (source check for `error`)
- Save loading state disables button while in flight (source check for `saving`)
- Draft deep-copied (source check for `structuredClone|...`)
- Confirming delete calls `deleteRecipe` then `goto('/')` (source checks for both)
- Cancelling dialog makes no API call (source check for `confirmingDelete = false`)
- Failed delete renders error without navigating (source check for `error`)
- Delete loading state disables confirm button (source check for `deleting`)
- Delete dialog opens on clicking Delete (source check for `confirmingDelete = true`)
- Edit link navigates to `/recipes/[id]/edit` (source check for `/edit`)
- Load function: fetches recipe by numeric id, returns `{ recipe }`, throws 404 on bad id, throws 404 on 404 fetch failure, throws 500 on other failures

Note: Tests use source-level string matching rather than component mounting. This is an acceptable approach given the SvelteKit SFC structure and is consistent with the spec's guidance to prioritize logic-level wiring over deep DOM simulation. The load function tests are proper behavioral unit tests.
