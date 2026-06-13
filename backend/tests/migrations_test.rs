use std::fs;
use std::path::Path;

fn backend_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

fn migrations_dir() -> std::path::PathBuf {
    backend_dir().join("migrations")
}

#[test]
fn migrations_directory_exists() {
    assert!(
        migrations_dir().exists(),
        "backend/migrations/ directory must exist"
    );
}

#[test]
fn at_least_two_migration_files_exist() {
    let entries: Vec<_> = fs::read_dir(migrations_dir())
        .expect("migrations dir must be readable")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|x| x == "sql").unwrap_or(false))
        .collect();
    assert!(
        entries.len() >= 2,
        "expected at least 2 migration files (schema + seed), found {}",
        entries.len()
    );
}

#[test]
fn schema_migration_creates_recipes_table() {
    let schema_file = find_migration_containing("CREATE TABLE")
        .expect("a migration file must contain CREATE TABLE for the recipes table");
    let content = fs::read_to_string(&schema_file).expect("schema migration must be readable");
    assert!(
        content.to_lowercase().contains("recipes"),
        "schema migration must create a 'recipes' table, found in: {:?}",
        schema_file
    );
}

#[test]
fn schema_migration_has_id_column() {
    let schema_file = find_migration_containing("CREATE TABLE")
        .expect("a migration file must contain CREATE TABLE");
    let content = fs::read_to_string(&schema_file).expect("schema migration must be readable");
    let lower = content.to_lowercase();
    assert!(
        lower.contains("id"),
        "schema migration must define an 'id' column"
    );
}

#[test]
fn schema_migration_has_name_column() {
    let schema_file = find_migration_containing("CREATE TABLE")
        .expect("a migration file must contain CREATE TABLE");
    let content = fs::read_to_string(&schema_file).expect("schema migration must be readable");
    let lower = content.to_lowercase();
    assert!(
        lower.contains("name") && lower.contains("text"),
        "schema migration must define a 'name TEXT' column"
    );
}

#[test]
fn seed_migration_inserts_recipes() {
    let seed_file = find_migration_containing("INSERT INTO")
        .expect("a migration file must contain INSERT INTO for seed data");
    let content = fs::read_to_string(&seed_file).expect("seed migration must be readable");
    let lower = content.to_lowercase();
    assert!(
        lower.contains("recipes"),
        "seed migration must insert into 'recipes' table"
    );
}

#[test]
fn seed_migration_is_idempotent() {
    let seed_file = find_migration_containing("INSERT INTO")
        .expect("a seed migration must exist with INSERT INTO");
    let content = fs::read_to_string(&seed_file).expect("seed migration must be readable");
    let lower = content.to_lowercase();
    assert!(
        lower.contains("on conflict"),
        "seed migration must use ON CONFLICT for idempotency"
    );
}

fn find_migration_containing(pattern: &str) -> Option<std::path::PathBuf> {
    let lower_pattern = pattern.to_lowercase();
    fs::read_dir(migrations_dir())
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|x| x == "sql").unwrap_or(false))
        .find(|e| {
            fs::read_to_string(e.path())
                .map(|c| c.to_lowercase().contains(&lower_pattern))
                .unwrap_or(false)
        })
        .map(|e| e.path())
}
