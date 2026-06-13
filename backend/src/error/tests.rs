use super::AppError;
use axum::response::IntoResponse;
#[allow(unused_imports)]
use http_body_util::BodyExt;

#[tokio::test]
async fn database_error_returns_500() {
    let err = AppError::Database(sqlx::Error::PoolTimedOut);
    let response = err.into_response();
    assert_eq!(
        response.status(),
        axum::http::StatusCode::INTERNAL_SERVER_ERROR
    );
}

#[tokio::test]
async fn database_error_body_has_error_field() {
    let err = AppError::Database(sqlx::Error::PoolTimedOut);
    let response = err.into_response();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(
        body.get("error").is_some(),
        "response body must have an 'error' field"
    );
}

#[tokio::test]
async fn database_error_does_not_leak_raw_error() {
    let err = AppError::Database(sqlx::Error::PoolTimedOut);
    let response = err.into_response();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = std::str::from_utf8(&body_bytes).unwrap();
    assert!(
        !body_str.to_lowercase().contains("pooltimedout"),
        "raw sqlx error must not appear in response body"
    );
}

#[tokio::test]
async fn row_not_found_maps_to_not_found_variant() {
    let err = AppError::from(sqlx::Error::RowNotFound);
    assert!(
        matches!(err, AppError::NotFound),
        "sqlx::Error::RowNotFound must convert to AppError::NotFound"
    );
}

#[tokio::test]
async fn not_found_returns_404() {
    let err = AppError::NotFound;
    let response = err.into_response();
    assert_eq!(response.status(), axum::http::StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn not_found_body_has_error_field() {
    let err = AppError::NotFound;
    let response = err.into_response();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap();
    assert!(
        body.get("error").is_some(),
        "404 response body must have an 'error' field"
    );
}

#[tokio::test]
async fn other_sqlx_errors_still_map_to_database_variant() {
    let err = AppError::from(sqlx::Error::PoolTimedOut);
    assert!(
        matches!(err, AppError::Database(_)),
        "non-RowNotFound sqlx errors must convert to AppError::Database"
    );
}
