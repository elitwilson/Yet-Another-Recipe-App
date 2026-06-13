use std::path::Path;

fn backend_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

#[test]
fn sqlx_offline_cache_directory_exists() {
    assert!(
        backend_dir().join(".sqlx").exists(),
        "backend/.sqlx/ must exist (run `cargo sqlx prepare` to generate it)"
    );
}

#[test]
fn readme_documents_sqlx_cli_install() {
    let content =
        std::fs::read_to_string(backend_dir().join("README.md")).expect("README.md must exist");
    assert!(
        content.contains("sqlx-cli") || content.contains("cargo install sqlx"),
        "README.md must document sqlx-cli installation"
    );
}

#[test]
fn readme_documents_migrate_run() {
    let content =
        std::fs::read_to_string(backend_dir().join("README.md")).expect("README.md must exist");
    assert!(
        content.contains("migrate run"),
        "README.md must document `sqlx migrate run`"
    );
}

#[test]
fn readme_documents_sqlx_prepare() {
    let content =
        std::fs::read_to_string(backend_dir().join("README.md")).expect("README.md must exist");
    assert!(
        content.contains("sqlx prepare") || content.contains("cargo sqlx prepare"),
        "README.md must document `cargo sqlx prepare`"
    );
}

#[test]
fn readme_documents_offline_mode() {
    let content =
        std::fs::read_to_string(backend_dir().join("README.md")).expect("README.md must exist");
    assert!(
        content.contains("SQLX_OFFLINE"),
        "README.md must document SQLX_OFFLINE offline build mode"
    );
}
