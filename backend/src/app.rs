use axum::{routing::get, Router};

use crate::routes::health::health;

pub fn create_router() -> Router {
    Router::new().route("/health", get(health))
}
