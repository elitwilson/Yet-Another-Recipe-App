use axum::{routing::get, Router};
use sqlx::PgPool;

use crate::recipes::handler::list_recipes;
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
    let api = Router::new().route("/recipes", get(list_recipes));

    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        .with_state(state)
}

#[cfg(test)]
mod tests;
