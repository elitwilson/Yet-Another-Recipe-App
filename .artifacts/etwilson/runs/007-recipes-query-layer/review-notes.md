# Create queries.rs + wire up module structure (Tasks 1-3 combined)

## Verdict: FLAGGED

**Task:** Create queries.rs + wire up module structure (Tasks 1-3 combined: queries.rs, mod.rs, handler.rs)
**Spec:** .artifacts/etwilson/specs/007-recipes-query-layer.md

**Scope issues:**
- `backend/src/recipes/handler/tests.rs` — This file is not listed in the spec's declared in-scope files. In-scope files are: `backend/src/recipes/handler.rs`, `backend/src/recipes/queries.rs`, `backend/src/recipes/mod.rs`, `.claude/rules/backend-query-layer.md`. The tests.rs file is a new file being created outside that list.

**Coverage gaps:**
- The spec has no requirement for new tests. This is a structural refactor; the spec explicitly states integration tests are out of scope and that `cargo check` + `cargo test` (existing tests) are the verification gates. The test written (`queries_module_is_accessible`) is reasonable as a compile-check but is not required by the spec. The coverage question is moot — there are no test requirements to cover.

**Note on the test itself:** The test is a compile-time structural check, not an integration test, so it does not violate the "integration tests out of scope" clause. However, the file it lives in (`handler/tests.rs`) is not in scope per the spec. If the team lead approves adding this file to scope, the test content is acceptable.
