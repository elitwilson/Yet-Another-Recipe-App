use axum::{routing::get, Router};
use sqlx::PgPool;

use crate::recipes::handler::{
    create_recipe, delete_recipe, get_recipe, list_recipes, update_recipe,
};
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
    let api = Router::new()
        .route("/recipes", get(list_recipes).post(create_recipe))
        .route(
            "/recipes/:id",
            get(get_recipe).put(update_recipe).delete(delete_recipe),
        );

    Router::new()
        .route("/health", get(health))
        .nest("/api", api)
        .with_state(state)
}

#[cfg(test)]
mod tests;
