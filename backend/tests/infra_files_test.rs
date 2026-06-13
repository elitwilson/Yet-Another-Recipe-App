use std::fs;
use std::path::Path;

fn repo_root() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("backend has a parent directory")
        .to_path_buf()
}

#[test]
fn docker_compose_exists_at_repo_root() {
    assert!(
        repo_root().join("docker-compose.yml").exists(),
        "docker-compose.yml must exist at repo root"
    );
}

#[test]
fn docker_compose_contains_postgres_service() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(content.contains("postgres"), "compose file must define a postgres service");
}

#[test]
fn docker_compose_references_named_volume() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(content.contains("volumes:"), "compose file must declare a named volume");
}

#[test]
fn docker_compose_exposes_postgres_port() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(content.contains("5432"), "compose file must expose postgres port 5432");
}

#[test]
fn root_env_example_exists() {
    assert!(
        repo_root().join(".env.example").exists(),
        ".env.example must exist at repo root"
    );
}

#[test]
fn root_env_example_documents_postgres_vars() {
    let content = fs::read_to_string(repo_root().join(".env.example"))
        .expect(".env.example must be readable");
    assert!(content.contains("POSTGRES_USER"), "root .env.example must document POSTGRES_USER");
    assert!(content.contains("POSTGRES_PASSWORD"), "root .env.example must document POSTGRES_PASSWORD");
    assert!(content.contains("POSTGRES_DB"), "root .env.example must document POSTGRES_DB");
}

#[test]
fn backend_env_example_exists() {
    assert!(
        repo_root().join("backend").join(".env.example").exists(),
        "backend/.env.example must exist"
    );
}

#[test]
fn backend_env_example_documents_database_url() {
    let content = fs::read_to_string(repo_root().join("backend").join(".env.example"))
        .expect("backend/.env.example must be readable");
    assert!(content.contains("DATABASE_URL"), "backend/.env.example must document DATABASE_URL");
}
