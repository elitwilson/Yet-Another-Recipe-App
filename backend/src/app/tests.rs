use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use sqlx::PgPool;
use tower::ServiceExt;

use super::{create_router_with_state, AppState};

fn make_state() -> AppState {
    // connect_lazy does not open a real connection — safe for routing tests
    let pool = PgPool::connect_lazy("postgres://yara:yara@localhost:5432/yara").unwrap();
    AppState::new(pool)
}

#[tokio::test]
async fn get_api_recipes_route_exists() {
    let app = create_router_with_state(make_state());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/recipes")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    // 404 means no route registered; anything else means the route exists
    // (it may 500 without a real DB, but that proves routing is wired)
    assert_ne!(
        response.status(),
        StatusCode::NOT_FOUND,
        "GET /api/recipes must be a registered route"
    );
}

#[tokio::test]
async fn health_route_still_reachable() {
    let app = create_router_with_state(make_state());
    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}
