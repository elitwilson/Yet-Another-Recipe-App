// Integration tests for GET /api/recipes — requires a live Postgres with migrations applied.
// Run with: DATABASE_URL=postgres://yara:yara@localhost:5433/yara cargo test --test recipes

use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::Value;
use tower::ServiceExt;
use yara_backend::{app::AppState, db::create_pool};

async fn app() -> axum::Router {
    let url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://yara:yara@localhost:5433/yara".to_string());
    let pool = create_pool(&url)
        .await
        .expect("failed to connect to test DB");
    yara_backend::app::create_router_with_state(AppState::new(pool))
}

#[tokio::test]
async fn get_api_recipes_returns_200() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .uri("/api/recipes")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn get_api_recipes_content_type_is_json() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .uri("/api/recipes")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let content_type = response
        .headers()
        .get("content-type")
        .expect("content-type header must be present")
        .to_str()
        .unwrap();
    assert!(
        content_type.contains("application/json"),
        "content-type must be application/json, got: {content_type}"
    );
}

#[tokio::test]
async fn get_api_recipes_body_is_array_with_seeded_rows() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .uri("/api/recipes")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&body_bytes).expect("body must be valid JSON");
    let arr = body.as_array().expect("body must be a JSON array");
    assert!(
        arr.len() >= 3,
        "seeded DB must return at least 3 recipes, got {}",
        arr.len()
    );
    let first = &arr[0];
    assert!(
        first.get("id").is_some(),
        "each recipe must have an id field"
    );
    assert!(
        first.get("title").is_some(),
        "each recipe must have a title field"
    );
    assert!(
        first.get("ingredients").is_some(),
        "each recipe must have an ingredients field"
    );
    assert!(
        first["ingredients"].as_array().is_some(),
        "ingredients must be an array"
    );
    assert!(
        first.get("source").is_some(),
        "each recipe must have a source field"
    );
    assert!(
        first["source"].get("type").is_some(),
        "source must have a type field"
    );
    // Verify ORDER BY id — ids must be non-decreasing
    let ids: Vec<i64> = arr
        .iter()
        .map(|r| r["id"].as_i64().expect("id must be a number"))
        .collect();
    let mut sorted = ids.clone();
    sorted.sort();
    assert_eq!(ids, sorted, "recipes must be returned ORDER BY id");
}
