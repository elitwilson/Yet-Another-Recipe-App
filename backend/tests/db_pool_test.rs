// Tests verify pool wiring structure and fail-fast behavior without a live database.

use std::sync::Mutex;

static ENV_LOCK: Mutex<()> = Mutex::new(());

#[test]
fn config_reads_database_url_from_env() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::set_var("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
    let config = yara_backend::config::Config::from_env();
    std::env::remove_var("DATABASE_URL");
    assert_eq!(
        config.database_url,
        "postgres://user:pass@localhost:5432/db"
    );
}

#[test]
fn config_database_url_has_default() {
    let _guard = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    std::env::remove_var("DATABASE_URL");
    let config = yara_backend::config::Config::from_env();
    assert!(
        !config.database_url.is_empty(),
        "DATABASE_URL must have a default"
    );
    assert!(
        config.database_url.starts_with("postgres://"),
        "DATABASE_URL default must be a postgres URL, got: {}",
        config.database_url
    );
}

#[test]
fn db_module_is_public() {
    // Compile-time check: create_pool is a public async fn in yara_backend::db.
    let _f = yara_backend::db::create_pool;
    let _ = _f;
}

#[test]
fn app_state_holds_pool() {
    // Verified at compile time — AppState::new takes PgPool.
    let _: fn(sqlx::PgPool) -> yara_backend::app::AppState = yara_backend::app::AppState::new;
}

#[tokio::test]
async fn create_pool_returns_err_on_invalid_url() {
    let result = yara_backend::db::create_pool("not-a-valid-url").await;
    assert!(
        result.is_err(),
        "create_pool must return Err for an invalid URL, not panic or hang"
    );
}

#[tokio::test]
async fn create_pool_returns_err_on_unreachable_host() {
    // Port 1 is reserved/unlikely to have postgres; connection should fail fast.
    let result = yara_backend::db::create_pool("postgres://yara:yara@127.0.0.1:1/yara").await;
    assert!(
        result.is_err(),
        "create_pool must return Err when the host is unreachable, not panic or hang"
    );
}
