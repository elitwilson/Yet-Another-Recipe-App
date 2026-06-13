// Integration tests for /api/recipes — requires a live Postgres with migrations applied.
// Run with: DATABASE_URL=postgres://yara:yara@localhost:5433/yara cargo test --test recipes

use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
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

fn unique_title(prefix: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    format!("{prefix} {nanos}")
}

fn recipe_body() -> Value {
    json!({
        "title": unique_title("Integration Test Recipe"),
        "servings": 2,
        "total_time": 15,
        "tags": ["test"],
        "favorite": false,
        "ingredients": [{"qty": "1", "unit": "cup", "item": "water"}],
        "steps": ["Boil water."],
        "notes": [],
        "source": {"type": "manual", "host": null, "url": null, "method": null}
    })
}

// --- GET /api/recipes ---

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
    assert!(first.get("id").is_some(), "each recipe must have an id field");
    assert!(first.get("title").is_some(), "each recipe must have a title field");
    assert!(first.get("ingredients").is_some(), "each recipe must have an ingredients field");
    assert!(first["ingredients"].as_array().is_some(), "ingredients must be an array");
    assert!(first.get("source").is_some(), "each recipe must have a source field");
    assert!(first["source"].get("type").is_some(), "source must have a type field");
    let ids: Vec<i64> = arr
        .iter()
        .map(|r| r["id"].as_i64().expect("id must be a number"))
        .collect();
    let mut sorted = ids.clone();
    sorted.sort();
    assert_eq!(ids, sorted, "recipes must be returned ORDER BY id");
}

// --- GET /api/recipes/:id ---

#[tokio::test]
async fn get_api_recipe_by_id_returns_200_for_known_id() {
    let app = app().await;

    // Create a recipe first so we have a known id
    let create_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/recipes")
                .header("content-type", "application/json")
                .body(axum::body::Body::from(recipe_body().to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(create_resp.status(), StatusCode::CREATED);
    let body_bytes = create_resp.into_body().collect().await.unwrap().to_bytes();
    let created: Value = serde_json::from_slice(&body_bytes).unwrap();
    let id = created["id"].as_i64().unwrap();

    let get_resp = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/recipes/{id}"))
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_resp.status(), StatusCode::OK);
    let body_bytes = get_resp.into_body().collect().await.unwrap().to_bytes();
    let recipe: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(recipe["id"], id);
    assert!(recipe["title"].as_str().unwrap().starts_with("Integration Test Recipe"));
}

#[tokio::test]
async fn get_api_recipe_by_id_returns_404_for_unknown_id() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .uri("/api/recipes/999999999")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(body.get("error").is_some(), "404 response must have error field");
}

// --- POST /api/recipes ---

#[tokio::test]
async fn post_api_recipes_returns_201_with_created_recipe() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/recipes")
                .header("content-type", "application/json")
                .body(axum::body::Body::from(recipe_body().to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let recipe: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(recipe.get("id").is_some(), "created recipe must have server-generated id");
    assert!(recipe.get("created_at").is_some(), "created recipe must have server-generated created_at");
    assert!(recipe["title"].as_str().unwrap().starts_with("Integration Test Recipe"));
    assert_eq!(recipe["servings"], 2);
}

// --- PUT /api/recipes/:id ---

#[tokio::test]
async fn put_api_recipe_returns_200_with_updated_recipe() {
    let app = app().await;

    let create_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/recipes")
                .header("content-type", "application/json")
                .body(axum::body::Body::from(recipe_body().to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let body_bytes = create_resp.into_body().collect().await.unwrap().to_bytes();
    let created: Value = serde_json::from_slice(&body_bytes).unwrap();
    let id = created["id"].as_i64().unwrap();

    let updated_body = json!({
        "title": unique_title("Updated Recipe"),
        "servings": 4,
        "total_time": 30,
        "tags": ["updated"],
        "favorite": true,
        "ingredients": [{"qty": "2", "unit": "cups", "item": "milk"}],
        "steps": ["Heat milk."],
        "notes": ["A note."],
        "source": {"type": "url", "host": "example.com", "url": "https://example.com", "method": null}
    });

    let put_resp = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/recipes/{id}"))
                .header("content-type", "application/json")
                .body(axum::body::Body::from(updated_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(put_resp.status(), StatusCode::OK);
    let body_bytes = put_resp.into_body().collect().await.unwrap().to_bytes();
    let recipe: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert_eq!(recipe["id"], id);
    assert!(recipe["title"].as_str().unwrap().starts_with("Updated Recipe"));
    assert_eq!(recipe["servings"], 4);
    assert_eq!(recipe["favorite"], true);
}

#[tokio::test]
async fn put_api_recipe_returns_404_for_unknown_id() {
    let updated_body = json!({
        "title": unique_title("Ghost Recipe"),
        "servings": null,
        "total_time": null,
        "tags": [],
        "favorite": false,
        "ingredients": [],
        "steps": [],
        "notes": [],
        "source": {"type": "manual", "host": null, "url": null, "method": null}
    });
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri("/api/recipes/999999999")
                .header("content-type", "application/json")
                .body(axum::body::Body::from(updated_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(body.get("error").is_some(), "404 response must have error field");
}

// --- DELETE /api/recipes/:id ---

#[tokio::test]
async fn delete_api_recipe_returns_204_for_known_id() {
    let app = app().await;

    let create_resp = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/recipes")
                .header("content-type", "application/json")
                .body(axum::body::Body::from(recipe_body().to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let body_bytes = create_resp.into_body().collect().await.unwrap().to_bytes();
    let created: Value = serde_json::from_slice(&body_bytes).unwrap();
    let id = created["id"].as_i64().unwrap();

    let delete_resp = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/recipes/{id}"))
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(delete_resp.status(), StatusCode::NO_CONTENT);
    let body_bytes = delete_resp.into_body().collect().await.unwrap().to_bytes();
    assert!(body_bytes.is_empty(), "DELETE 204 must have empty body");
}

#[tokio::test]
async fn delete_api_recipe_returns_404_for_unknown_id() {
    let response = app()
        .await
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri("/api/recipes/999999999")
                .body(axum::body::Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(body.get("error").is_some(), "404 response must have error field");
}
