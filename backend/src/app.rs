use axum::{routing::get, Router};
use sqlx::PgPool;

use crate::routes::health::health;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

pub fn create_router() -> Router {
    Router::new().route("/health", get(health))
}

pub fn create_router_with_state(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .with_state(state)
}
