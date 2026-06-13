use super::AppError;
use axum::response::IntoResponse;
use http_body_util::BodyExt;

#[tokio::test]
async fn database_error_returns_500() {
    let err = AppError::Database(sqlx::Error::RowNotFound);
    let response = err.into_response();
    assert_eq!(
        response.status(),
        axum::http::StatusCode::INTERNAL_SERVER_ERROR
    );
}

#[tokio::test]
async fn database_error_body_has_error_field() {
    let err = AppError::Database(sqlx::Error::RowNotFound);
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
    let err = AppError::Database(sqlx::Error::RowNotFound);
    let response = err.into_response();
    let body_bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = std::str::from_utf8(&body_bytes).unwrap();
    assert!(
        !body_str.to_lowercase().contains("rownotfound"),
        "raw sqlx error must not appear in response body"
    );
}
